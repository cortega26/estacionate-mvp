# ADR 0011: Payment States — PaymentIntent, Payment, Refund, Payout

**Estado:** Aceptado
**Fecha:** 2026-04-27

**Nota Fase 1:** Esta ADR describe infraestructura de demo/simulador y diseño
futuro bloqueado. No habilita pagos, refunds, payouts, PSP ni conciliación
productiva para comunidades reales. `LEGAL_COMMERCIAL_GUARDRAILS.md` prevalece
si hay conflicto.

---

## Contexto

El schema actual tiene:

- `Payment.status` con enum `PaymentStatus`: `pending | paid | failed | refunded`
- `Payment.gatewayStatus` con enum `GatewayStatus`: `pending | approved | rejected | cancelled | refunded`
- `Payout.status` como `String` libre (no enum)
- No existe un modelo `Refund` — los reembolsos se reflejan solo en `Payment.status = refunded`
- No existe un `PaymentIntent` — el pago se crea directamente sin una intención previa que capture el monto y la idempotency key antes de iniciar con el gateway

Consecuencias hoy:

- `Booking.paymentStatus` y `Payment.status` son enums distintos que pueden divergir.
- Un webhook duplicado del gateway puede mutar el estado de un `Payment` que ya estaba `paid`.
- No hay forma de rastrear reintentos de pago: si el usuario abre el checkout dos veces, no hay idempotency key que prevenga dos `Payment`s para la misma reserva.
- Los reembolsos no tienen estado propio — si un reembolso falla en el gateway, el `Payment` queda marcado `refunded` sin confirmar.
- `Payout.status` como string libre permite valores arbitrarios y no es queryable de forma segura.

---

## Decisión

### Estado objetivo de los modelos de pago

#### 1. `PaymentIntent` (nuevo modelo)

Captura la intención de pago antes de redirigir al gateway. Es el punto de idempotencia.

```
Estados: created → pending_gateway → approved | rejected | expired | cancelled
```

```prisma
model PaymentIntent {
  id              String              @id @default(uuid())
  bookingId       String              @unique @map("booking_id")  // una sola intención activa por reserva
  amount          Int                 // CLP, centavos o unidad entera según gateway
  currency        String              @default("CLP")
  status          PaymentIntentStatus
  idempotencyKey  String              @unique @map("idempotency_key")
  gatewayRef      String?             @map("gateway_ref")  // preference_id de MercadoPago
  expiresAt       DateTime            @map("expires_at")
  createdAt       DateTime            @default(now()) @map("created_at")
  updatedAt       DateTime            @updatedAt @map("updated_at")

  booking         Booking             @relation(...)
  payment         Payment?
}

enum PaymentIntentStatus {
  created
  pending_gateway
  approved
  rejected
  expired
  cancelled
}
```

#### 2. `Payment` (existente — estados simplificados)

El `Payment` se crea solo cuando el gateway confirma la captura (webhook `approved`). Es el registro financiero del cargo real.

```
Estados: captured → settled → chargeback_initiated | chargeback_won | chargeback_lost
```

```prisma
enum PaymentStatus {
  captured          // gateway aprobó; todavía no liquidado a la comunidad
  settled           // incluido en un Payout
  chargeback_initiated
  chargeback_won
  chargeback_lost
}
```

El `GatewayStatus` existente se mantiene como campo de auditoría del gateway (lo que el gateway reportó crudamente) pero no es el estado de negocio. El estado de negocio es `PaymentStatus`.

#### 3. `Refund` (nuevo modelo)

Cada reembolso es una entidad propia con su ciclo de vida.

```
Estados: requested → pending_gateway → succeeded | failed
```

```prisma
model Refund {
  id            String       @id @default(uuid())
  paymentId     String       @map("payment_id")
  amount        Int
  reason        String?
  status        RefundStatus
  gatewayRef    String?      @map("gateway_ref")
  requestedBy   String       @map("requested_by")  // actorId
  requestedAt   DateTime     @default(now()) @map("requested_at")
  resolvedAt    DateTime?    @map("resolved_at")

  payment       Payment      @relation(...)
}

enum RefundStatus {
  requested
  pending_gateway
  succeeded
  failed
}
```

#### 4. `Payout` (existente — enum formal)

```prisma
enum PayoutStatus {
  calculated        // generado por el cron de reconciliación
  pending_approval  // esperando aprobación de Finance
  approved          // aprobado; listo para enviar al gateway
  paid              // gateway confirmó transferencia a la comunidad
  failed            // gateway rechazó o falló la transferencia
  disputed          // hay un mismatch; en revisión por Finance
  void              // anulado antes de enviar (ej: error de cálculo)
}
```

El campo `Payout.status String` existente se reemplaza por `PayoutStatus`.

### Mapping gateway → estado de negocio

| GatewayStatus (webhook)  | PaymentIntent →                | Payment creado       |
| ------------------------ | ------------------------------ | -------------------- |
| `approved`               | `approved`                     | Sí — `captured`      |
| `rejected`               | `rejected`                     | No                   |
| `cancelled`              | `cancelled`                    | No                   |
| `refunded` (callback)    | N/A — aplica a `Refund.status` | `Refund → succeeded` |
| `in_process` / `pending` | `pending_gateway`              | No (aún)             |

### Idempotency en webhooks

`WebhookEvent` debe existir con `idempotencyKey UNIQUE`. Antes de procesar cualquier webhook:

1. Verificar que el `WebhookEvent.idempotencyKey` no existe → si existe, ignorar (responder 200 al gateway).
2. Crear el `WebhookEvent` en la misma transacción que la mutación de estado.
3. Si la transacción falla, el `WebhookEvent` no quedó guardado → el retry del gateway será procesado.

### Relación con el estado de `Booking`

`Booking.paymentStatus` se elimina a largo plazo. El estado de pago de una reserva se deriva de `PaymentIntent.status`. En el corto plazo (sin migración destructiva) se mantiene `Booking.paymentStatus` sincronizado automáticamente por `BookingService.transition()`.

---

## Alternativas descartadas

| Alternativa                                              | Por qué se descartó                                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Mantener `Payment` como único modelo sin `PaymentIntent` | Sin idempotency key antes del gateway; dos aperturas del checkout crean dos pagos    |
| Reembolso como campo `Payment.refundedAt`                | No captura el ciclo de vida del reembolso; no permite múltiples reembolsos parciales |
| `Payout.status` como String libre                        | No queryable con type safety; permite estados inválidos                              |
| Gateway status como estado de negocio                    | Cada gateway usa nomenclatura diferente; acoplamiento directo                        |

---

## Criterios de aceptación (gate para implementación)

- [ ] `PaymentIntent` model existe en schema con migración.
- [ ] `PaymentIntentStatus` enum cubre `created | pending_gateway | approved | rejected | expired | cancelled`.
- [ ] `Refund` model existe en schema con `RefundStatus` enum.
- [ ] `PayoutStatus` enum reemplaza el campo `String` en `Payout`.
- [ ] `WebhookEvent` tiene `idempotencyKey @unique` — webhook duplicado no re-procesa.
- [ ] `PaymentService.initiate(bookingId)` crea un `PaymentIntent` con idempotency key antes de redirigir al gateway.
- [ ] Webhook handler verifica idempotency key antes de mutar cualquier estado.
- [ ] Test: webhook duplicado con misma idempotency key devuelve 200 sin re-procesar.
- [ ] Test: `Refund` en estado `failed` no marca el `Payment` como `refunded`.

---

## Consecuencias

- Requiere migraciones Prisma para `PaymentIntent`, `Refund`, y cambio de `Payout.status`.
- El flujo de checkout en el frontend debe iniciar con `POST /api/payments/intent` (que crea `PaymentIntent`) antes de redirigir al gateway.
- El webhook handler debe reescribirse para respetar la idempotency key y el nuevo mapping de estados.
- Los tests de `PaymentService` deben actualizarse para el nuevo flujo de dos pasos (intent → webhook).
- Esta implementación está sujeta a los gate conditions de `documentation/LEGAL_COMMERCIAL_GUARDRAILS.md` §3 — el código puede implementarse como infraestructura pero no activarse contra pagadores reales sin los gates legales cumplidos.
