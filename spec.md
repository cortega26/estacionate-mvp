# Especificación De Upgrade SaaS Estacionate

## Objetivo

Elevar Estacionate desde calidad MVP a producto de nivel SaaS, mejorando la plataforma end-to-end en reservas de residentes, pagos demo/futuros con guardrails, operaciones admin, validación de conserjería, claridad UX, confiabilidad, performance, soporte y confianza.

> Nota de fase activa: toda mención a pagos en esta especificación debe leerse según `documentation/LEGAL_COMMERCIAL_GUARDRAILS.md`. La fase habilitada es SaaS B2B sin pagos integrados productivos de residentes/comunidades, sin cobros directos a visitantes, sin payouts productivos y sin custodia de fondos comunitarios.

## Metas

1. Mejorar la calidad del journey de reserva de residente para que sea más claro, confiable y recuperable cuando algo falle.
2. Mejorar la experiencia admin para comunicar estado, ocupación, acciones y valor ejecutivo con menos fricción.
3. Mejorar el workflow de conserjería para que estados de validación y decisiones operativas sean más rápidos y menos ambiguos.
4. Mejorar robustez de plataforma con mejor manejo de errores, observabilidad y validación alrededor de flujos críticos.
5. Mejorar disciplina de entrega vinculando cada cambio relevante de producto a una ruta de prueba específica.

## No Metas

1. Replatforming completo o migración mayor de framework.
2. Rediseño amplio de módulos no relacionados sin impacto en calidad de producto.
3. Rediseño profundo de estrategia de pricing más allá de lo necesario para claridad y confianza.
4. Sitio nuevo de marketing salvo que sea directamente necesario para confianza del producto u onboarding.

## Resultados De Producto

1. Los flujos demo centrales pueden ejecutarse consistentemente y explicar valor rápido.
2. Los estados críticos visibles para usuarios tienen mensajes claros y guía de siguientes pasos.
3. Rutas críticas de navegador tienen prueba automatizada, no solo confianza manual.
4. El trabajo de calidad de producto se rastrea como cambios verificables, no como refactors amplios.

## Alcance

### Dentro De Alcance

1. Autenticación, búsqueda, reserva, inicio de flujo de pago demo/futuro y estados posteriores de residente.
2. Dashboards admin y workflows de gestión de usuarios que afectan confianza y claridad operacional.
3. Flujos de validación de conserjería y claridad de estados.
4. Confiabilidad, observabilidad y performance en auth, bookings, payments demo/futuros y métricas admin.
5. Cobertura cross-role y tracking de ejecución a nivel proyecto.

### Fuera De Alcance

1. Nuevas plataformas de infraestructura salvo que un bloqueante actual lo exija.
2. Rebrand visual completo.
3. Collateral comercial sin relación con experiencia de producto o confianza de entrega.

## Anclas Del Sistema

### Frontend

1. `frontend/src/pages/dashboard/SearchPage.tsx`
2. `frontend/src/features/bookings/components/BookingModal.tsx`
3. `frontend/src/features/map/components/ParkingMap.tsx`
4. `frontend/src/pages/checkout/SuccessPage.tsx`
5. `frontend/src/pages/checkout/FailurePage.tsx`
6. `frontend/src/pages/admin/DashboardPage.tsx`
7. `frontend/src/pages/admin/UserManagement.tsx`
8. `frontend/src/pages/gatekeeper/Dashboard.tsx`
9. `frontend/src/routes.config.tsx`

### Backend

1. `backend/src/services/BookingService.ts`
2. `backend/src/services/PaymentService.ts`
3. `backend/src/services/SalesService.ts`
4. `backend/src/api/admin/stats.ts`
5. `backend/src/api/payments/webhook.ts`
6. `backend/src/middleware/auth.ts`
7. `backend/prisma/schema.prisma`

## Estrategia De Implementación

### Fase 0: Bootstrap

1. Crear esta especificación y mantenerla actualizada.
2. Crear `todo.md` y usarlo como checklist vivo de ejecución.
3. Crear una capa E2E raíz `tests/` que reutilice el entorno Playwright frontend y deje explícitas las rutas de prueba.

### Fase 1: Calidad Base Y Prueba

1. Establecer cobertura estable de navegador para login/búsqueda residente, gestión admin de usuarios y puntos críticos smoke.
2. Auditar brechas de experiencia contra los flujos principales.
3. Priorizar las primeras slices que mejoren claridad, comunicación de estado y confianza operacional.

### Fase 2: Fixes De Producto De Alto Valor

1. Claridad de booking y checkout.
2. Recuperación de estados de éxito/falla de pago demo/futuro.
3. Claridad de reportes y workflows admin.
4. Claridad de validación conserjería.
5. Mejoras de confiabilidad y observabilidad en rutas backend críticas.

### Fase 3: Endurecimiento

1. Expandir cobertura E2E para cubrir mejoras completadas.
2. Cerrar brechas spec-implementación encontradas en revisiones periódicas.
3. Ejecutar validación más amplia antes de entregar.

## Orden Actual De Ejecución

Todas las slices de calidad previas (Slices 1-10d) están completas. El proyecto pivoteó a **Fase 0 Fundacional**: decisiones de arquitectura que deben quedar bloqueadas antes de desarrollar nuevas funcionalidades.

1. Escribir ADRs P0: Tenancy (0007), RBAC (0008), identidad User/Resident (0009), state machine Booking (0010), estados de Payment (0011). Son el piso: no empieza feature work hasta registrarlas.
2. Implementar middleware de aislamiento de tenant: todo endpoint backend deriva scope de edificio desde membership autenticada, nunca solo desde params del request.
3. Implementar state machine de booking con `checked_in`, `checked_out`, `overstay`, `no_show` y `AccessEvent` para check-in/out de conserjería.
4. Exigir `CRON_SECRET` en todos los endpoints cron.
5. Estabilizar Playwright E2E: redirect de login admin y configuración CI de navegadores.

## Detalle De Implementación Por Slice

### Slices Previas Completadas

Las slices 1-10d ya cerraron mejoras de claridad en reporting admin, journey residente booking-to-payment, observabilidad backend, validación conserjería, confirmaciones in-app para settings, users, buildings y sales reps, eliminación de edificios demo, resiliencia CORS local y consistencia de logging en event-bus/auth recovery/spot search.

El detalle histórico de estas slices queda reflejado en `todo.md`; para nuevas tareas, el foco activo es Fase 0.

### Slice F0.1: ADRs P0

1. Escribir cinco ADRs en `documentation/adr/`: 0007 (Tenancy), 0008 (RBAC), 0009 (User vs Resident), 0010 (state machine Booking), 0011 (estados Payment).
2. Cada ADR debe definir decisión, alternativas rechazadas y criterios concretos de aceptación.
3. Esta slice no incluye migraciones ni cambios de código; solo decisiones.

### Slice F0.2: Middleware De Aislamiento De Tenant

1. Agregar helper `requireBuildingScope(req)` en `backend/src/middleware/` que resuelva scope de edificio desde rol/membership del JWT y retorne 403 si el recurso solicitado está fuera de ese scope.
2. Aplicarlo a todo endpoint admin, conserjería y booking que hoy filtre por `buildingId` desde parámetros de request.
3. Probar con casos negativos: usuario autenticado para Edificio A debe recibir 403 al pedir recursos del Edificio B en al menos tres endpoints distintos.

### Slice F0.3: State Machine Booking + AccessEvent Check-In/Out

1. Extender enum `BookingStatus` con `checked_in`, `checked_out`, `overstay`, `no_show`.
2. Definir transiciones válidas como mapa en `BookingService`; no permitir asignaciones directas a `status` fuera de `transition(bookingId, event)`.
3. Agregar modelo `AccessEvent` a Prisma: `id`, `bookingId`, `actorId` (usuario conserjería), `type` (`check_in` | `check_out` | `denied`), `plateObserved`, `timestamp`.
4. Conectar endpoint de verificación de conserjería para crear `AccessEvent` y transicionar booking a `checked_in` en la primera verificación exitosa, y a `checked_out` en segunda verificación del mismo booking.
5. Probar con tests backend que transiciones inválidas se rechazan y que se crean filas `AccessEvent` por transición.

### Slice F0.4: Enforcement De `CRON_SECRET`

1. Todas las rutas bajo `backend/src/api/cron/` deben rechazar requests sin header válido `Authorization: Bearer <CRON_SECRET>` con 401.
2. El secreto debe venir de env; el servidor debe negarse a iniciar sin él.
3. Probar con test backend acotado que reconcile y cualquier otro endpoint cron retorna 401 sin el secreto correcto.

### Slice F0.5: Estabilización Playwright E2E

1. Corregir falla de redirect de login admin para que `tests/admin-dashboard.spec.ts` y suite smoke auth pasen confiablemente en Chromium.
2. Actualizar `playwright.ts` o configuración raíz para que CI no intente Firefox/WebKit salvo que esos navegadores estén instalados explícitamente.
3. Ejecutar `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-dashboard.spec.ts` y confirmar cero fallas antes de cerrar la slice.

## Reglas De Ejecución

1. Consultar esta spec antes de cada cambio significativo.
2. Actualizar `todo.md` cuando tareas pasen de planificadas a completas.
3. Ejecutar la prueba relevante más acotada tras cada cambio significativo y ampliar solo cuando corresponda.
4. Cada aproximadamente 20 iteraciones, correr una revisión fresca contra esta spec y la implementación actual.
5. No marcar tareas completas sin prueba.
6. Mantener `tests/` raíz alineado con el orden actual para que cada slice completa tenga prueba browser explícita cuando aplique.

## Matriz De Verificación

### Precondiciones De Entorno

1. Pruebas E2E críticas de navegador requieren backend alcanzable y datos seed de auth.
2. La ruta local por defecto usa Postgres y Redis con Docker vía `backend/.env.local.example`.
3. Este entorno está configurado para la ruta local por defecto, incluyendo Docker, Postgres, Redis, migraciones y cuentas demo seed.

| Área                                      | Prueba requerida                | Comando/check inicial                                                                                                                                                                         | Señal de salida                                                                          |
| ----------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Artefactos bootstrap                      | Archivos creados y consistentes | Inspeccionar `spec.md`, `todo.md`, `tests/`; correr docs checks si se tocaron                                                                                                                 | Archivos existen y son coherentes                                                        |
| Smoke auth/búsqueda residente             | Prueba browser                  | `cd frontend && npx playwright test -c playwright.autopilot.config.ts resident-search.spec.ts`                                                                                                | Usuario puede entrar y usar búsqueda tras login                                          |
| Gestión admin de usuarios                 | Prueba browser                  | `cd frontend && npx playwright test -c playwright.autopilot.config.ts admin-user-management.spec.ts`                                                                                          | Admin puede ban/unban de usuario seed                                                    |
| Confirmación admin user-management        | Prueba browser                  | `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-user-management.spec.ts`                                                                                 | Admin revisa, cancela y confirma ban/unban antes de cambio de estado                     |
| Login crítico                             | Prueba browser                  | `cd frontend && npx playwright test -c playwright.autopilot.config.ts auth.smoke.spec.ts`                                                                                                     | Login inválido falla y login admin seed funciona                                         |
| Estados de resultado de pago              | Prueba browser                  | `cd frontend && npx playwright test -c playwright.autopilot.config.ts payment-result-pages.spec.ts`                                                                                           | Páginas aprobado, pendiente y rechazado muestran guía clara                              |
| Dashboard admin y analytics               | Prueba browser                  | `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-dashboard.spec.ts`                                                                                       | Ambas páginas cargan tras login y renderizan contenido determinístico                    |
| Alcance dashboard building-admin          | Prueba browser                  | `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-dashboard.spec.ts`                                                                                       | Administradores de edificio ven mensajería con alcance y no piden stats de otro edificio |
| Confirmación booking residente            | Prueba browser                  | `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/resident-search.spec.ts`                                                                                       | Residente revisa detalles antes de ir a pago                                             |
| Journey booking-to-payment residente      | Prueba browser                  | `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/resident-booking-journey.spec.ts`                                                                              | Residente avanza desde búsqueda a confirmación y resultado de pago                       |
| Claridad validación conserjería           | Browser + test backend acotado  | `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/guard-validation.spec.ts`, `cd backend && npm test -- concierge-verify.test.ts`, `cd frontend && npm run lint` | Guardia verifica patentes/códigos sin ambigüedad y backend conserva scope/ventana        |
| Confirmación settings admin               | Browser + lint frontend         | `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-settings.spec.ts`, `cd frontend && npm run lint`                                                         | Admin ve resumen in-app antes de cambios masivos de precio                               |
| Confirmación buildings admin              | Browser + lint frontend         | `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-buildings.spec.ts`, `cd frontend && npm run lint`                                                        | Admin puede cancelar y confirmar acciones destructivas antes de request                  |
| Eliminación edificio demo                 | Test backend + browser          | `cd backend && npm test -- admin-buildings.test.ts`, `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-buildings.spec.ts`, `cd frontend && npm run lint`   | Edificios demo se eliminan limpiamente desde flujo admin estándar                        |
| Resiliencia CORS admin local              | Integración backend + browser   | `cd backend && npm test -- integration/cors.test.ts`, `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-dashboard.spec.ts`                                 | Login/dashboard/analytics funcionan con puertos localhost fallback aprobados             |
| Confirmación remoción sales-rep           | Prueba browser                  | `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-sales-reps.spec.ts`                                                                                      | Admin cancela sin mutation y confirma antes de persistir desasignación                   |
| Observabilidad backend                    | Tests backend acotados + build  | `cd backend && npm test -- admin-analytics.observability.test.ts concierge-observability.test.ts`, `cd backend && npm run build`                                                              | Error paths conservan contratos HTTP y emiten logs estructurados                         |
| Admin buildings + webhook observability   | Tests backend acotados + build  | `cd backend && npm test -- admin-buildings.observability.test.ts payments-webhook.observability.test.ts`, `cd backend && npm run build`                                                       | Fallas preservan contratos y emiten logs estructurados                                   |
| Admin users + bookings observability      | Tests backend acotados + build  | `cd backend && npm test -- admin-users.observability.test.ts admin-bookings.observability.test.ts`, `cd backend && npm run build`                                                             | Fallas preservan contratos y emiten logs estructurados                                   |
| Event bus observability                   | Test backend acotado + build    | `cd backend && npm test -- event-bus.observability.test.ts`, `cd backend && npm run build`                                                                                                    | Fallas event-bus preservan publish behavior y emiten logs                                |
| Auth recovery + spot search observability | Tests backend acotados + build  | `cd backend && npm test -- auth-recovery.observability.test.ts spots-search.observability.test.ts`, `cd backend && npm run build`                                                             | Fallas forgot/reset/search preservan contratos y emiten logs                             |
| Cambios frontend tocados                  | Checks frontend acotados        | `cd frontend && npm run lint`, `cd frontend && npm test`, spec Playwright dirigida                                                                                                            | Sin regresiones en flujo tocado                                                          |
| Cambios backend tocados                   | Checks backend acotados         | `cd backend && npm run lint`, `cd backend && npm run build`, `cd backend && npm test`                                                                                                         | Sin regresiones en slice backend tocada                                                  |
| ADRs P0                                   | Revisión documental             | Inspeccionar `documentation/adr/0007` a `0011`                                                                                                                                                | Cinco ADRs con decisión, alternativas y criterios de aceptación                          |
| Middleware aislamiento tenant             | Tests negativos backend         | `cd backend && npm test -- tenant-isolation.test.ts`                                                                                                                                          | Usuario edificio A recibe 403 al pedir recursos de edificio B                            |
| Booking state machine + AccessEvent       | Tests backend de estado         | `cd backend && npm test -- booking-state-machine.test.ts`                                                                                                                                     | Transiciones inválidas rechazadas; AccessEvent creado en check-in/out                    |
| Enforcement `CRON_SECRET`                 | Test backend acotado            | `cd backend && npm test -- cron-auth.test.ts`                                                                                                                                                 | Endpoints cron retornan 401 sin secreto correcto                                         |
| Estabilización Playwright E2E             | Prueba browser                  | `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-dashboard.spec.ts`                                                                                       | Spec admin dashboard pasa en Chromium con cero fallas                                    |
| Entrega transversal                       | Validación amplia               | `npm run check:all`                                                                                                                                                                           | Checks pasan o bloqueantes quedan documentados                                           |

## Plan De Prueba Por Slice Activa

### Fase 0 - ADRs P0

1. Escribir `documentation/adr/0007` a `0011` cubriendo Tenancy, RBAC, User/Resident, state machine Booking y estados Payment.
2. Cada ADR debe incluir contexto, decisión, consecuencias y criterios de aceptación que habilitan implementación.
3. No iniciar implementación hasta que el ADR de esa slice esté listo.

### Fase 0 - Middleware De Aislamiento De Tenant

1. Agregar `backend/tests/tenant-isolation.test.ts` con pruebas negativas para bookings, admin/stats y endpoints conserjería usando dos identidades de edificio.
2. Ejecutar `cd backend && npm test -- tenant-isolation.test.ts` tras cada edición relevante.
3. Ejecutar `cd backend && npm run build` cuando los tests negativos estén verdes.

### Fase 0 - Booking State Machine + AccessEvent

1. Agregar `backend/tests/booking-state-machine.test.ts` cubriendo transiciones válidas, transiciones inválidas y creación `AccessEvent`.
2. Ejecutar `cd backend && npm test -- booking-state-machine.test.ts` tras cada cambio de `BookingService` o schema.
3. Ejecutar `cd backend && npm run build` cuando los tests estén verdes.

### Fase 0 - Enforcement `CRON_SECRET`

1. Agregar `backend/tests/cron-auth.test.ts` que postee a `/api/cron/reconcile` sin secreto (espera 401) y con secreto correcto (espera 200 o respuesta normal de reconcile).
2. Ejecutar `cd backend && npm test -- cron-auth.test.ts` inmediatamente después de agregar el guard.

### Fase 0 - Estabilización Playwright E2E

1. Diagnosticar falla de redirect admin ejecutando `cd frontend && npx playwright test -c playwright.autopilot.config.ts ../tests/admin-dashboard.spec.ts --headed`.
2. Corregir causa raíz (probable desalineación seed o timing de route guard), no agregar retries como sustituto.
3. Re-ejecutar la spec dirigida hasta que pase consistentemente; luego ejecutar `npm run check:all`.

## Riesgos Iniciales

1. La cobertura browser existente es delgada y puede no ser suficientemente determinística para iteración rápida.
2. Algunos flujos cross-role pueden requerir control de test data más fuerte que el seed actual.
3. La cobertura end-to-end de pagos demo/futuros puede requerir simulador o harness determinístico para evitar ruido externo.
4. La suite backend amplia tuvo fallas no relacionadas de reconcile; por eso la prueba de entrega full-repo no siempre equivale a prueba por slice.

## Diferido Hasta Que Sea Necesario

1. Reestructuración amplia del framework de pruebas más allá de lo mínimo para una capa raíz `tests/` confiable.
2. Nuevo sitio público.
3. Refactors arquitectónicos amplios no ligados a calidad visible para usuario o riesgo operacional.
