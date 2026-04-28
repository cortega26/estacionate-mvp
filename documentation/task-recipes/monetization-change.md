# Task Recipe: Monetization Change Checklist

**Aplica a:** Cualquier cambio en archivos de pagos, precios, facturación, modelos de transacciones económicas, o features de cobro.
También aplica a README, términos, documentación comercial y copy visible que
pueda sugerir marketplace, cobro a visitantes, payouts, PSP productivo o
monetización habilitada.

**Antes de escribir código, completa este checklist en orden.**

---

## Gate 0 — Lectura Obligatoria

- [ ] Leer `documentation/LEGAL_COMMERCIAL_GUARDRAILS.md` completo.
- [ ] Leer `documentation/adr/0006-legal-commercial-monetization-architecture.md`.
- [ ] Confirmar que el cambio no viola ninguna prohibición de §2 del guardrail.

---

## Gate 1 — Clasificación del Cambio

Identifica en cuál categoría cae el cambio:

| Categoría                           | Ejemplo                                                                                                   | Gate adicional         |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------- |
| A — Demo/simulador                  | Extender tests, mejorar mock de MercadoPago, refactorizar PaymentService internamente                     | Solo Gate 0            |
| B — Feature Fase 1                  | Mejorar dashboard admin, agregar notificaciones, reportes operacionales de ocupación sin pagos integrados | Solo Gate 0            |
| C — Feature Fase 2                  | Cualquier cobro de residente integrado a Gastos Comunes                                                   | Gates 0 + 2            |
| D — Feature Fase 3                  | PSP real, Split Payment, webhooks contra comunidades reales                                               | Gates 0 + 2 + 3        |
| E — Cambio de arquitectura de datos | Nuevo modelo billing/pago en Prisma                                                                       | Gates 0 + arquitectura |

- [ ] Categoría seleccionada: **\_\_**

---

## Gate 2 — Verificación de Fase (solo categorías C y D)

Antes de implementar cualquier feature de Fase 2 o Fase 3:

- [ ] Confirmar que Gate G2.1 está satisfecho: ¿existe memo legal firmado archivado? (Verificar con responsable legal/CTO)
- [ ] Confirmar que Gate G2.2 está satisfecho: ¿existe acta de asamblea piloto archivada?
- [ ] Si cualquiera de los anteriores no está satisfecho: **detener implementación**. Reportar al usuario que el gate no está abierto y especificar qué falta.

---

## Gate 3 — Verificación de Arquitectura de Pagos (solo categorías D y E con billing)

- [ ] El PSP propuesto tiene arquitectura Split Payment certificada (fondos comunidad nunca tocan ledger Estacionate).
- [ ] `Payment.payerId` es siempre un `userId` con `role = RESIDENT`. No hay flujo sin autenticación de residente.
- [ ] No se agrega campo `visitorId` como pagador en ningún modelo.
- [ ] No se agrega campo de balance o custodia en modelos de Estacionate.
- [ ] `Payout` apunta a cuenta RUT de comunidad, no a cuenta interna de Estacionate.

---

## Gate 4 — Verificación de Vocabulario (todas las categorías con UI o copy)

- [ ] No aparece la palabra "arriendo", "arrendamiento", "renta", o "alquiler" en ningún texto de UI, notificación, email, o contrato generado.
- [ ] El vocabulario activo de Fase 1 usa: "reserva", "reglas", "validación",
      "trazabilidad", "reportes operacionales" y "contrato SaaS B2B".
- [ ] Cualquier mención de "tarifa de uso", "aporte al Fondo de Reserva" u
      "obligación económica por uso de área común" queda marcada como Fase 2/Fase 3
      bloqueada o simulador, no como feature disponible.

---

## Gate 5 — Privacidad (si el cambio toca datos de residentes o visitantes)

- [ ] El cambio no procesa patentes vehiculares de comunidades sin DPA firmado registrado.
- [ ] Si se agrega nuevo tipo de dato personal, verificar si la finalidad está cubierta por el DPA existente.
- [ ] Retención de datos de visitas no supera 24 meses.

---

## Después del Cambio

- [ ] Ejecutar `cd backend && npm run check:all`.
- [ ] Si el cambio modifica schema Prisma: `npx prisma migrate dev && npx prisma generate`.
- [ ] Confirmar que ningún test de PaymentService nuevo asume que los gates de Fase 2/3 están abiertos (usar flags/mocks explícitos).
- [ ] Si el cambio es categoría C, D, o E: mencionar explícitamente en el PR description qué gate condition se cumplió o si es solo infraestructura de demo.

---

## Si Detectas una Violación

Si durante tu trabajo encuentras que el código existente viola una prohibición de §2 del guardrail, o que hay features de Fase 2/3 activas sin gates cumplidos:

1. **No corrijas silenciosamente** — el riesgo legal requiere revisión humana.
2. Reporta al usuario con: archivo afectado, línea aproximada, prohibición específica de §2 que viola, y riesgo legal asociado.
3. Espera instrucción explícita antes de continuar.
