# Todo Autopilot

## Fase 0 Fundacional - Ahora

- [ ] Escribir ADR 0007: modelo de tenancy (`Building` como tenant operacional; `ManagementCompany` como agrupador multi-edificio).
- [ ] Escribir ADR 0008: RBAC (roles, permisos por entidad, enforcement con scope por membership).
- [ ] Escribir ADR 0009: contrato de identidad User vs Resident (quién puede autenticarse y con qué scope).
- [ ] Escribir ADR 0010: state machine de booking (`pending` -> `confirmed` -> `checked_in` -> `checked_out` | `overstay` | `no_show`).
- [ ] Escribir ADR 0011: estados de pago (enums y transiciones de `PaymentIntent`, `Payment`, `Refund`, `Payout`).
- [ ] Agregar `backend/tests/tenant-isolation.test.ts` con pruebas negativas para usuario de Edificio A accediendo a recursos de Edificio B.
- [ ] Agregar `backend/src/middleware/requireBuildingScope.ts` y aplicarlo a rutas admin, conserjería y booking.
- [ ] Probar aislamiento de tenant con `cd backend && npm test -- tenant-isolation.test.ts`.
- [ ] Extender enum `BookingStatus` con `checked_in`, `checked_out`, `overstay`, `no_show`.
- [ ] Agregar modelo `AccessEvent` al schema Prisma y crear migración.
- [ ] Implementar `BookingService.transition(bookingId, event)`; solo se permiten transiciones válidas.
- [ ] Conectar endpoint de verificación de conserjería para crear `AccessEvent` y llamar `transition()`.
- [ ] Agregar `backend/tests/booking-state-machine.test.ts` y probar con `cd backend && npm test -- booking-state-machine.test.ts`.
- [ ] Agregar guard `CRON_SECRET` a todas las rutas en `backend/src/api/cron/`; rechazar con 401 si falta.
- [ ] Agregar validación fail-fast de startup que impida iniciar sin `CRON_SECRET` en env.
- [ ] Agregar `backend/tests/cron-auth.test.ts` y probar con `cd backend && npm test -- cron-auth.test.ts`.
- [ ] Diagnosticar y corregir falla de redirect de login admin Playwright en `tests/admin-dashboard.spec.ts`.
- [ ] Ejecutar `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-dashboard.spec.ts` hasta cero fallas.
- [ ] Ejecutar `npm run check:all` cuando todas las slices de Fase 0 estén verdes.

## Slices De Calidad Previas - Completadas

- [x] Actualizar `spec.md` para dejar explícitos el orden de ejecución y comandos de prueba exactos.
- [x] Actualizar `todo.md` y `tests/` para rastrear el trabajo pendiente como slices verificables.
- [x] Reemplazar `confirm()` crudo por confirmación in-app en cambios de precio de `frontend/src/pages/admin/SettingsPage.tsx`.
- [x] Agregar prueba Playwright determinística en `tests/admin-settings.spec.ts` para cancelar/confirmar actualizaciones masivas de precio.
- [x] Probar la slice de confirmación de settings con Playwright focalizado y lint frontend.
- [x] Reemplazar confirmación de navegador en `frontend/src/pages/admin/UserManagement.tsx` por confirmación in-app para ban/unban.
- [x] Extender `tests/admin-user-management.spec.ts` para probar cancelar/confirmar antes de cambios de estado.
- [x] Probar la slice de confirmación de usuarios con Playwright focalizado y lint frontend.
- [x] Identificar la siguiente brecha pequeña de confirmación en gestión de edificios y agregar prueba Playwright raíz.
- [x] Agregar prueba Playwright en `tests/admin-buildings.spec.ts` para cancelar/confirmar archive/delete de edificios.
- [x] Reemplazar confirmaciones crudas en `frontend/src/pages/admin/BuildingsPage.tsx` para archive/restore/delete.
- [x] Probar la slice de edificios con Playwright focalizado y lint frontend.
- [x] Actualizar `spec.md` y `todo.md` para la slice de eliminación de edificio demo.
- [x] Agregar prueba backend focalizada de eliminación de edificio demo con residente, booking y payment sin `force=true`.
- [x] Marcar edificios demo explícitamente en Prisma y seed data.
- [x] Pasar delete admin estándar por limpieza demo automática y conservar guard `force-delete` para edificios no demo con relaciones.
- [x] Mostrar guía de eliminación demo en `tests/admin-buildings.spec.ts` y `frontend/src/pages/admin/BuildingsPage.tsx`.
- [x] Probar eliminación demo con backend test, Playwright y lint/build focalizado.
- [x] Actualizar `spec.md` y `todo.md` para la falla de carga de dashboard/analytics.
- [x] Agregar prueba backend de CORS para orígenes locales fallback como `http://localhost:5174`.
- [x] Relajar CORS local en `backend/src/lib/cors.ts` sin abrirlo a orígenes arbitrarios.
- [x] Reproducir `/admin` y `/admin/analytics` en vivo tras fix CORS y capturar brechas restantes.
- [x] Actualizar `tests/admin-dashboard.spec.ts` con login/data mockeados y prueba de dashboard + analytics.
- [x] Corregir fallas restantes de carga/render admin dashboard o analytics.
- [x] Probar slice de dashboard/analytics con Playwright focalizado y lint/build si aplica.
- [x] Actualizar `spec.md`, `todo.md` y `tests/` para confirmación de remoción de edificio en sales rep.
- [x] Agregar prueba Playwright de cancelar/confirmar remoción de sales rep.
- [x] Reemplazar `confirm()` restante de remoción sales-rep por confirmación in-app.
- [x] Probar slice sales-rep con Playwright focalizado y lint frontend.
- [x] Actualizar `spec.md`, `todo.md` y `tests/` para consistencia de observabilidad backend.
- [x] Agregar prueba backend de logging en rutas analytics y conserjería conservando contratos de respuesta.
- [x] Reemplazar `console.error` en handlers tocados por llamadas a logger estructurado.
- [x] Probar slice de observabilidad con tests backend focalizados y build backend.
- [x] Actualizar tracking para sub-slice de observabilidad en admin buildings y payments webhook.
- [x] Agregar pruebas backend de error-path logging para admin-buildings y payments-webhook.
- [x] Reemplazar `console.error` en `backend/src/api/admin/buildings.ts` y `backend/src/api/payments/webhook.ts`.
- [x] Probar sub-slice admin-buildings/webhook con tests backend focalizados y build backend.
- [x] Actualizar tracking para sub-slice de observabilidad en admin users y admin bookings.
- [x] Agregar pruebas backend de logging para admin-users y admin-bookings.
- [x] Reemplazar `console.error` en `backend/src/api/admin/users.ts` y `backend/src/api/admin/bookings.ts`.
- [x] Probar sub-slice admin-users/bookings con tests backend focalizados y build backend.
- [x] Actualizar tracking para sub-slice de observabilidad event-bus.
- [x] Agregar prueba backend de logging event-bus en fallas redis init/parse/publish y persistencia audit.
- [x] Reemplazar `console.error` en `backend/src/lib/event-bus.ts`.
- [x] Probar sub-slice event-bus con tests backend focalizados y build backend.
- [x] Actualizar tracking para sub-slice auth recovery y spot search.
- [x] Agregar pruebas backend para forgot-password, reset-password y spot-search en error paths.
- [x] Reemplazar `console.error` en handlers auth recovery y spots search.
- [x] Probar sub-slice auth-recovery/spot-search con tests backend focalizados y build backend.

## Siguiente

- [x] Cerrar brecha de verificación dashboard building-admin con prueba navegador explícita de comportamiento scoped por edificio.
- [x] Expandir cobertura de validación conserjería con prueba navegador determinística para ruteo patente-versus-código.
- [x] Agregar prueba backend focalizada de que verificación conserjería sigue scoped por edificio y solo acepta bookings activos.
- [x] Remover confirmación cruda restante de remoción sales-rep cuando dashboard/analytics esté verde.

## Bloqueado

- [ ] Sin ítems bloqueados actuales.

## Hecho

- [x] Agregar prueba backend de que login exitoso limpia intentos Redis acumulados antes de bloqueo.
- [x] Agregar prueba browser de feedback para cuentas bloqueadas, inactivas y no verificadas.
- [x] Mostrar feedback de login específico para cuentas bloqueadas, inactivas y no verificadas con Vitest focalizado.
- [x] Ejecutar nueva revisión de auditoría para identificar la siguiente brecha pequeña de calidad de producto.
- [x] Crear `todo.md` como checklist de ejecución.
- [x] Crear harness Playwright raíz en `tests/` reutilizando tooling frontend.
- [x] Levantar Postgres/Redis con Docker, aplicar migraciones y cargar demo accounts.
- [x] Suite backend completa verde tras estabilizar pruebas con DB compartida y cobertura reconcile.
- [x] Extender gestión admin de usuarios para listar residentes seed y habilitar ban/unban end-to-end.
- [x] Mejorar páginas de resultado de pago con guía clara para aprobado, pendiente y rechazado.
- [x] Mejorar claridad de confirmación de booking residente y probar detalle modal pre-pago.
- [x] Enrutar usuarios support a experiencia admin read-only coherente y ampliar auth smoke por roles.
- [x] Reparar y habilitar pruebas reconcile unitarias/integración.
- [x] Endurecer storage de auth persistido para Vitest.
- [x] Expandir prueba browser a journey determinístico resident booking-to-payment.
- [x] Fortalecer observabilidad backend en admin reporting y payment-init de booking.
- [x] Hacer determinístico el ruteo de input conserjería para patentes versus códigos.
- [x] Corregir contrato de payload de login para que backend coincida con auth store frontend.
- [x] Remover drift de normalización de roles auth frontend y probar persistencia login resident/admin.
- [x] Enrutar representantes de ventas al dashboard correcto tras login.
- [x] Alinear signup y seeds de residentes con contrato PII cifrado y agregar prueba crypto focalizada.
- [x] Reemplazar confirmación de precio admin cruda por resumen in-app y prueba browser.
- [x] Reemplazar confirmación cruda de user-management admin por resumen in-app y prueba browser.
