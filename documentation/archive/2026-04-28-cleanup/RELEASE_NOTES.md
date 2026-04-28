> Archived on 2026-04-28 during repository cleanup.
> Historical reference only. This document is not a current source of truth.
> Current authority: see README.md, documentation/AGENT_POLICY.md, documentation/OWNERSHIP.md, documentation/LEGAL_COMMERCIAL_GUARDRAILS.md, and documentation/ROADMAP_SAAS_INDUSTRY_GRADE.md as applicable.

# Notas De Release - v1.0.0-rc.1

**Commit:** 5909717
**Fecha:** 2025-12-24
**Veredicto:** **GO** (listo para producción)

## Nuevas Funcionalidades

- **Dashboard admin:** gestión completa de edificios, unidades y usuarios.
- **Flujo de reserva:** reserva end-to-end de estacionamientos de visita con revisión de disponibilidad.
- **Pagos:** flujo integrado de pago con cálculo de comisiones (fees de plataforma y software).
- **Portal residente:** autogestión de unidades y vehículos.
- **Vista conserjería:** vista optimizada para que conserjes validen accesos.

## Correcciones De Seguridad Y Estabilidad

- **Login cross-browser:** corrección de fallas de login en Firefox/WebKit resolviendo diferencias de dominio de cookies y problemas de accesibilidad del formulario.
- **Guardrails Redis:** timeouts de conexión fail-fast (5 s) para evitar que la aplicación quede colgada ante caídas.
- **Integridad de datos:** constraints únicos en emails de residentes y datos de prueba aleatorizados para asegurar pipelines CI/CD confiables.
- **Seguridad de sesión:** atributos de cookie endurecidos (`SameSite=Lax`, `HttpOnly`, `Secure` en producción).

## Mejoras Operacionales

- **Pruebas E2E:** suite Playwright completa para journeys críticos de usuario (login, dashboard) en Chromium, Firefox y WebKit.
- **Base de datos:** esquema robusto con UUIDs y bloqueo optimista para disponibilidad (implícito por el trabajo de concurrencia).
