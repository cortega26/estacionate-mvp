# Auditoría A9: Estrategia De Pruebas Y Cobertura

## 1. Resumen Ejecutivo

**Estado actual:** falsa confianza detectada
**Puntaje:** C+

El proyecto depende fuertemente de tres capas:

1. **Pruebas unitarias (mocks):** `BookingService.test.ts` verifica lógica (refunds), pero mockea DB completamente.
2. **Pruebas de integración (DB real):** `bookings.test.ts` es robusta, pero carece de aislamiento fuerte de limpieza.
3. **E2E (Playwright):** mínimo (smoke login solamente).

**Riesgo:** los flujos centrales de dinero (payments, payouts, commissions) tienen la menor cobertura realista, mientras el happy path de booking está bien cubierto.

## 2. Brechas De Cobertura Por Riesgo

### Alto Riesgo (Dinero/Legal)

| Funcionalidad        | Estado actual                                                       | Riesgo       | Recomendación                                                                                 |
| :------------------- | :------------------------------------------------------------------ | :----------- | :-------------------------------------------------------------------------------------------- |
| **Payment webhooks** | Parcialmente mockeados en unit tests; flujo real no simulado en E2E | **Crítico**  | Crear `verified-payouts.test.ts` de integración que simule verificación completa de firma.     |
| **Admin payouts**    | No se encontraron pruebas automatizadas                             | **Alto**     | Agregar prueba de integración para lógica de script `generate-payouts.ts`.                    |
| **Yield management** | Mockeado como `[]` en unit tests                                    | **Alto**     | Agregar `pricing-rules.test.ts` de integración con queries reales.                            |
| **Commissions**      | Existe `fix-s1-commission.test.ts` como repro                       | **Medio**    | Formalizar en `commissions.test.ts`.                                                          |

### Riesgo Medio (UX/Operaciones)

| Funcionalidad             | Estado actual                                                                 | Riesgo    | Recomendación                                                                  |
| :------------------------ | :---------------------------------------------------------------------------- | :-------- | :----------------------------------------------------------------------------- |
| **Admin dashboard**       | Solo pruebas manuales                                                         | **Medio** | Agregar E2E para aprobar residente y cancelar booking.                         |
| **Availability sync**     | `bookings.test.ts` cubre overrides, pero CRON de generación requiere solapes   | **Medio** | Refactorizar `cron-availability.test.ts` para mayor robustez.                  |

## 3. Detectores De Falsa Confianza

Estas pruebas pasan fácilmente, pero pueden ocultar bugs reales:

1. **`backend/tests/unit/BookingService.test.ts`:**
   - **Por qué:** mockea manualmente `db.availabilityBlock.findUniqueOrThrow`. Si cambia la relación del schema (por ejemplo, `spot` pasa a ser opcional), esta prueba suele seguir pasando mientras la app falla.
   - **Veredicto:** buena para probar matemática de refunds; débil para integridad de datos.
2. **Consumidores de `backend/tests/singleton.ts`:**
   - Cualquier prueba basada solo en `prismaMock` para queries complejas (joins/transacciones) es sospechosa. Las transacciones Prisma son difíciles de mockear correctamente.

## 4. Escenarios E2E Faltantes (Playwright)

El `frontend/e2e` actual solo tiene dos archivos. Falta:

1. **Flujo admin:** login como admin -> ir a residentes -> click en verificar -> logout -> login como residente -> verificar acceso.
2. **Flujo mis reservas:** login -> ver reserva futura -> cancelar -> verificar toast.
3. **Actualización de perfil:** actualizar patente -> verificar reflejo en siguiente intento de reserva.

## 5. Matriz Mínima Propuesta De Pruebas

Optimizar por **confianza**, no por porcentaje de cobertura.

| Capa                         | Foco                                      | Casos objetivo                                                                                                        |
| :--------------------------- | :---------------------------------------- | :-------------------------------------------------------------------------------------------------------------------- |
| **E2E (Playwright)**         | ¿Puede un usuario completar el flujo?     | 1. **Flujo de booking** completo con pago fake<br>2. **Flujo de verificación admin**<br>3. **Botón de emergencia**   |
| **Integración (Vitest + DB)**| Invariantes de negocio y matemática       | 1. **`BookingService`** con DB real<br>2. **`PaymentService`** con API MP mockeada y DB real<br>3. **`PricingRules`** |
| **Unit (Vitest + mocks)**    | Funciones puras y bordes                  | 1. **Calculadora de refund**<br>2. **Audit logging**<br>3. **Validación de input**                                    |

## 6. Plan De Acción

1. Dejar de escribir unit tests para servicios acoplados a DB; escribir pruebas de integración con DB Docker.
2. Crear `admin.spec.ts` en Playwright.
3. Formalizar `payouts.test.ts`.
