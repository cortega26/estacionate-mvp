# Especificación Técnica: Estacionate MVP

> **Límite de producto Fase 1:** el producto habilitado es SaaS B2B para comunidades/administradoras chilenas. Cubre reglas de estacionamiento de visita, reservas, validación de conserjería, trazabilidad y reportes operativos. No incluye pagos integrados, payouts, procesamiento PSP, cobros directos a visitantes ni custodia de fondos comunitarios.

## 1. Dominio Central

Estacionate es una plataforma de gestión de estacionamientos de visita para edificios residenciales. Permite que residentes soliciten/reserven estacionamientos de visita bajo las reglas configuradas por su comunidad, que equipos de conserjería validen acceso por patente/código/QR cuando esté disponible, y que administradores obtengan evidencia y reportes operativos.

## 2. Esquema De Base De Datos (Orientación Simplificada)

El esquema Prisma sigue siendo la fuente de verdad de implementación. A alto nivel:

- **User:** roles internos de plataforma/edificio como `admin`, `support`, `building_admin`, `concierge` y `sales_rep`.
- **Resident:** identidad de residente asociada a edificio/unidad y usada para flujos de reserva orientados a residentes.
- **VisitorSpot / AvailabilityBlock:** inventario de estacionamientos de visita y ventanas horarias controladas por la comunidad/administradora.
- **Booking:** estado de reserva de estacionamiento de visita y trazabilidad de auditoría.
- **Payment / Payout / PricingRule:** infraestructura solo demo/simulador y futura con guardrails. Estos modelos no deben tratarse como flujos de pago productivos habilitados en Fase 1.

## 3. Flujos Clave

- **Flujo de reserva Fase 1:** residente selecciona fecha/edificio/hora -> el sistema revisa disponibilidad -> el sistema crea un registro de reserva -> la reserva se valida operacionalmente según reglas del edificio. Una reserva confirmada en Fase 1 no debe depender de un pago integrado real.
- **Validación de conserjería:** conserjería valida por patente/código/QR cuando esté disponible, registra evidencia operativa y sigue el protocolo del edificio. Conserjería no es un rol de cobranza en Fase 1.
- **Reportes:** los reportes se enfocan en actividad operativa, ocupación, cumplimiento de reglas, trazabilidad e incidentes. No deben presentar monetización de estacionamientos como funcionalidad productiva habilitada.

> **Restricción de pagos/monetización:** todas las funcionalidades de pago están sujetas a las restricciones legales chilenas definidas en `documentation/LEGAL_COMMERCIAL_GUARDRAILS.md`. La infraestructura existente de `PaymentService` y `Payout` está clasificada como código demo/simulador para fases futuras con guardrails. No debe activarse con comunidades reales hasta cumplir las condiciones de gate de la sección 3 de ese documento. Si una fase futura con gate se aprueba, el pagador siempre debe ser el residente anfitrión, nunca un tercero visitante, y Estacionate no debe custodiar fondos comunitarios.

## 4. Estructura API (REST)

- `POST /api/auth/login`
- `GET /api/spots?available=true`
- `POST /api/bookings` (requiere auth)
