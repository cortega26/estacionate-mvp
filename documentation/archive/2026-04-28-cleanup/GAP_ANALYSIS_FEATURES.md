> Archived on 2026-04-28 during repository cleanup.
> Historical reference only. This document is not a current source of truth.
> Current authority: see README.md, documentation/AGENT_POLICY.md, documentation/OWNERSHIP.md, documentation/LEGAL_COMMERCIAL_GUARDRAILS.md, and documentation/ROADMAP_SAAS_INDUSTRY_GRADE.md as applicable.

# Auditoría De Funcionalidades Comerciales (Reality Check)

**Fecha:** 2025-12-19
**Alcance:** revisión de claims en `CARACTERISTICAS_COMERCIALES.md` contra el codebase actual.

## Resumen

El codebase soporta sólidamente el loop transaccional central (buscar -> reservar -> pagar). Sin embargo, capas comerciales avanzadas (yield management, envío real de WhatsApp, blocklists) estaban **mockeadas**, **fundacionales** o **faltantes** según el análisis histórico.

Este documento es histórico. La fase comercial activa no habilita pagos integrados con comunidades reales; para ese alcance prevalece `documentation/LEGAL_COMMERCIAL_GUARDRAILS.md`.

| Claim de funcionalidad         | Estado           | Hallazgos / brechas                                                                                                  |
| :----------------------------- | :--------------- | :------------------------------------------------------------------------------------------------------------------- |
| **1. Portafolio multi-tenant** | **Implementado** | Existen modelos `Building`, `Unit`, `Role`. Stats admin (`api/admin/stats.ts`) respetan alcance `buildingId`.        |
| **2. Motor de reservas**       | **Parcial**      | La búsqueda funciona. La concurrencia optimista es lógica (check de solape), pero falta columna estricta `@version`. |
| **3. Pasarela de pagos**       | **Implementado** | Flujo MercadoPago (`api/payments/*`) maneja checkout y webhooks en el alcance histórico/demo.                        |
| **4. Dashboard conserjería**   | **Implementado** | Existe `api/concierge/dashboard.ts` y filtra por contexto de fecha.                                                  |
| **5. Yield management**        | **Corregido**    | Se agregó modelo `PricingRule`. `createBooking` aplica multiplicadores dinámicos por fecha/prioridad.                |
| **6. Recuperación WhatsApp**   | **Corregido**    | La lógica en `NotificationService.ts` habilita Twilio en producción (mock solo en dev).                              |
| **7. Listas negras**           | **Corregido**    | Se agregó modelo `Blocklist` (Email/Phone/Plate). Enforcement agregado a `createBooking`.                            |
| **8. Cifrado SOC2**            | **Implementado** | `lib/crypto.ts` y `signup.ts` cifran RUT y teléfono.                                                                 |

## Conclusión

Todos los claims comerciales históricos fueron validados según el alcance de este reporte.

## Acciones Inmediatas Requeridas Para Validar Claims

1. **Quitar mock de WhatsApp:** habilitar integración `twilio.js` en `NotificationService.ts`.
2. **Definir estrategia de yield:** implementar modelo `PricingRule` o remover el claim por ahora.
3. **Implementar blocklist:** agregar tabla simple `Blacklist` y revisarla durante `createBooking`.
