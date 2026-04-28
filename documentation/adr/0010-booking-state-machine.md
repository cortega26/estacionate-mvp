# ADR 0010: Booking State Machine

**Estado:** Aceptado
**Fecha:** 2026-04-27

**Nota Fase 1:** Las transiciones que mencionan pago corresponden al simulador o
a fases futuras bloqueadas. En la fase habilitada, una reserva confirmada no debe
depender de un pago integrado real.

---

## Contexto

El `BookingStatus` enum actual tiene: `pending`, `confirmed`, `cancelled`, `completed`, `no_show`. No existe un state machine formal — las transiciones se hacen con asignaciones directas a `status` dispersas en el código. No hay estados operacionales de acceso físico (`checked_in`, `checked_out`, `overstay`). La conserjería solo lee reservas; no registra ningún evento de entrada o salida.

Consecuencias hoy:

- No hay prueba auditable de que la visita efectivamente ingresó al edificio.
- `completed` y `no_show` se asignan sin verificación de si hubo check-in previo.
- No hay mecanismo para detectar sobreestadía (visita que no sale).
- Transiciones inválidas (ej: `cancelled → confirmed`) no están prevenidas por la lógica de servicio.

---

## Decisión

### Estados canónicos

```
pending
  ├─► confirmed   (validación operacional Fase 1 o simulador/futuro bloqueado)
  │     ├─► checked_in    (concierge registra entrada)
  │     │     ├─► checked_out   (concierge registra salida — terminal)
  │     │     └─► overstay      (sistema detecta fin de ventana sin check-out)
  │     │           └─► checked_out  (concierge registra salida tardía — terminal)
  │     ├─► no_show       (sistema o concierge después de grace period — terminal)
  │     └─► cancelled     (residente o admin cancela — terminal)
  └─► cancelled   (residente cancela antes de confirmación — terminal)
```

Estados terminales: `cancelled`, `checked_out`, `no_show`. No se puede transicionar desde un estado terminal.

### Mapa de transiciones válidas

```typescript
const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'no_show', 'cancelled'],
  checked_in: ['checked_out', 'overstay'],
  overstay: ['checked_out'],
  checked_out: [], // terminal
  no_show: [], // terminal
  cancelled: [], // terminal
  completed: [], // alias legacy — no crear nuevos en este estado
};
```

### `BookingService.transition(bookingId, event, actorId)`

Único punto de entrada para cambios de estado:

```typescript
async transition(
  bookingId: string,
  event: BookingEvent,  // 'payment_approved' | 'check_in' | 'check_out' | 'no_show' | 'cancel'
  actorId: string,      // userId o residentId del actor que provoca el evento
  context?: { plateObserved?: string }
): Promise<Booking>
```

El método:

1. Carga el booking y verifica que la transición es válida.
2. Actualiza `Booking.status` dentro de una transacción Prisma.
3. Crea un `AccessEvent` si el evento es `check_in`, `check_out`, o `no_show`.
4. Publica el evento en el `EventBus` (ADR 0004).
5. Lanza error tipado `InvalidTransitionError` si la transición no está permitida.

No existe ningún otro lugar en el código que asigne `Booking.status` directamente.

### `AccessEvent` model

```prisma
model AccessEvent {
  id            String          @id @default(uuid())
  bookingId     String          @map("booking_id")
  actorId       String          @map("actor_id")   // userId del concierge
  type          AccessEventType
  plateObserved String?         @map("plate_observed")
  notes         String?
  timestamp     DateTime        @default(now())

  booking       Booking         @relation(fields: [bookingId], references: [id])
  @@map("access_events")
}

enum AccessEventType {
  check_in
  check_out
  denied        // visita rechazada (no autorizada, vencida, etc.)
  no_show_marked
}
```

### Integración con concierge verify

El endpoint `POST /api/concierge/verify` actualmente solo lee y retorna. Después de este ADR se implementa así:

1. Primera verificación exitosa de una reserva `confirmed` → llama `transition(bookingId, 'check_in', actorId)`.
2. Segunda verificación de la misma reserva en estado `checked_in` → llama `transition(bookingId, 'check_out', actorId)`.
3. Verificación de una reserva en estado terminal o fuera de ventana → crea `AccessEvent` de tipo `denied` sin transición.

### Limpieza automática de `no_show`

Un cron job (ya existe `reconcile`) o un job separado marca como `no_show` las reservas `confirmed` cuya ventana de tiempo terminó más el grace period configurado por edificio. El grace period por defecto es 30 minutos.

### Estado `completed` legacy

El estado `completed` existe en el schema. Para efectos de este ADR:

- `completed` = equivalente semántico de `checked_out` para reservas pre-existentes.
- No crear nuevas reservas en estado `completed` directamente.
- El cron puede marcar `checked_in` → `completed` para reservas antiguas sin check-out registrado.

---

## Alternativas descartadas

| Alternativa                                | Por qué se descartó                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| Mantener asignaciones directas de `status` | No auditable; permite transiciones inválidas                              |
| State machine en el frontend               | El estado es crítico; solo el backend es fuente de verdad                 |
| `completed` en lugar de `checked_out`      | Semánticamente opaco; no distingue "salió" de "reserva expiró"            |
| No registrar `AccessEvent`                 | Sin evidencia de entrada/salida, la plataforma no puede defender disputas |

---

## Criterios de aceptación (gate para implementación)

- [ ] `BookingStatus` enum incluye `checked_in`, `checked_out`, `overstay`.
- [ ] `AccessEvent` model existe en schema con migración aplicada.
- [ ] `BookingService.transition()` es el único método que modifica `Booking.status`.
- [ ] `InvalidTransitionError` se lanza con el estado actual y el intento de transición.
- [ ] Test: `pending → checked_in` lanza `InvalidTransitionError`.
- [ ] Test: `confirmed → checked_in` crea `AccessEvent` de tipo `check_in`.
- [ ] Test: `checked_in → checked_out` crea `AccessEvent` de tipo `check_out`.
- [ ] Test: doble `check_in` en la misma reserva lanza error.
- [ ] Endpoint concierge verify usa `transition()` y retorna el nuevo estado.

---

## Consecuencias

- Requiere migración Prisma para agregar estados y el modelo `AccessEvent`.
- Los tests de `BookingService` que asignan `status` directamente deben actualizarse a `transition()`.
- El cron de no-show debe llamar `transition()` en lugar de `prisma.booking.update`.
- El frontend de conserjería debe mostrar el resultado de `transition()` (nuevo estado + AccessEvent timestamp).
