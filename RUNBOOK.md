# Runbook Operacional (MVP)

## Cron Jobs Y Tareas Programadas

| Tarea                      | Frecuencia            | Comando                     | Propósito                                                      |
| :------------------------- | :-------------------- | :-------------------------- | :------------------------------------------------------------- |
| **Generar disponibilidad** | Diaria (00:00)        | `npm run cron:availability` | Genera cupos de estacionamiento para los próximos 30 días.     |
| **Reconciliación**         | Semanal (lunes 09:00) | `npm run cron:reconcile`    | Calcula comisiones y totales de payout.                        |
| **Recordatorios**          | Cada hora             | `npm run cron:reminders`    | Envía recordatorios por WhatsApp/email para reservas próximas. |

## Reembolsos Y Pagos

**Plataforma:** MercadoPago / Stripe

1.  **Ubicar transacción:** usa `paymentId` desde Admin Dashboard > Bookings.
2.  **Procesar reembolso:** ejecútalo desde el dashboard del proveedor de pago.
3.  **Actualizar base de datos:** SQL manual requerido para el MVP (funcionalidad pendiente).
    ```sql
    UPDATE "Booking" SET status = 'cancelled', payment_status = 'refunded' WHERE id = '...';
    ```

## Ciclo De Facturación (Modelo De Precios)

**Periodo de prueba:** meses 1-3 (fee $0).
**Facturación activa:** mes 4+ (fee 0,5 UF).

**Activación manual (día 90):**

1.  Conectarse a la base de datos.
2.  Actualizar el registro `Building` para fijar el fee mensual (en CLP equivalente a 0,5 UF).
    _(Ejemplo: 0,5 UF ~= $18.500 CLP)_
    ```sql
    UPDATE buildings
    SET software_monthly_fee_clp = 18500
    WHERE id = 'BUILDING_ID';
    ```
3.  La siguiente ejecución de `cron:reconcile` descontará automáticamente este monto del payout.

## Rotación De Secretos

**Ciclo:** 90 días o ante compromiso.

1.  **Actualizar `.env`** (local) y variables de entorno de Vercel (prod).
    - `JWT_SECRET`: invalida todas las sesiones activas. Requiere nuevo login de usuarios.
    - `ENCRYPTION_KEY`: **crítico**. No rotar sin recifrar `Resident.rut`.
    - `DATABASE_URL`: Supabase/Neon soportan rotación sin downtime.

## Solución De Problemas

### "Login Failed" (Cross-Browser)

- **Síntoma:** 401 al hacer login pese a credenciales correctas.
- **Corrección:** revisar política de cookie `SameSite` versus dominio. Asegurar que la URL backend coincida con el proxy frontend.
- **Corrección rápida:** limpiar cookies y almacenamiento del navegador.

### "Redis Connection Failed"

- **Síntoma:** timeouts de API o login colgado.
- **Corrección:** verificar URL de Redis. La app falla rápido (timeout de 5 s) para evitar cuelgues, pero auth/rate-limiting quedarán degradados.
