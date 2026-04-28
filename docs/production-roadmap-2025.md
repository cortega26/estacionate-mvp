# Roadmap Histórico De Preparación Productiva 2025

**Autor:** Antigravity (arquitecto SaaS senior)
**Fecha:** 2025-12-19
**Alcance:** análisis de brecha para preparación tipo marketplace nivel 1

## Resumen Ejecutivo

El codebase actual `estacionate-mvp` es una base sólida con buenas prácticas iniciales (TypeScript, Prisma, Sentry, rate limiting basado en Redis). Sin embargo, para alcanzar una preparación tipo "marketplace nivel 1", con cientos de miles de usuarios, alta concurrencia y cumplimiento estricto, se requieren mejoras de arquitectura. El foco debe pasar de "funcionalidad" a "confiabilidad, cumplimiento y escalabilidad".

Este documento es histórico. Las decisiones activas de monetización y pagos deben leerse siempre junto con `documentation/LEGAL_COMMERCIAL_GUARDRAILS.md`.

## Top 10 Roadmap

### 1. Event Bus Distribuido (Escalabilidad Crítica)

- **Qué:** reemplazar el `EventBus` actual en memoria (basado en `Map`) por un broker distribuido como **Redis Pub/Sub** o **AWS EventBridge**.
- **Por qué:** el bus actual funciona solo dentro de un proceso Node.js. En un cluster productivo, un evento emitido en el servidor A (por ejemplo, `BOOKING_CREATED`) es invisible para el servidor B. Esto impide procesamiento async escalable (notificaciones, webhooks).
- **Plan de implementación agentic:**
  1. Crear `RedisEventBus` implementando la interfaz `EventBus`.
  2. Usar `ioredis` para publicar/suscribirse a canales.
  3. Actualizar `audit-system/core/EventBus.ts` para cambiar estrategia según `NODE_ENV`.
- **Verificación:** levantar dos procesos worker locales. Disparar un evento en Worker A y verificar que Worker B lo registre/reciba.

### 2. Control De Concurrencia Optimista (Integridad De Datos)

- **Qué:** agregar un campo entero `@version` a modelos `AvailabilityBlock` y `Booking` en Prisma.
- **Por qué:** intentos de reserva con alta concurrencia provocarán race conditions. El sistema actual depende del aislamiento de transacciones, que puede ir desde bloqueos seriales lentos hasta race conditions según la configuración DB. El optimistic locking previene doble reserva eficientemente a nivel de aplicación.
- **Plan de implementación agentic:**
  1. Agregar `version Int @default(0)` a modelos de alto uso en `schema.prisma`.
  2. Actualizar lógica `createBooking` para usar `increment: version` y checks asociados.
- **Verificación:** ejecutar un script de carga `tests/race-condition.ts` con 50 reservas concurrentes para el mismo estacionamiento. Asegurar exactamente 1 éxito y 49 fallas.

### 3. Capa Multi-Tenant "Organization"

- **Qué:** introducir un modelo `Organization` u `Operator` por encima de `Building`.
- **Por qué:** plataformas B2B interactúan con operadores que gestionan carteras de edificios. El string actual `adminCompany` en `Building` es insuficiente para RBAC y agregación financiera correcta.
- **Plan de implementación agentic:**
  1. Crear modelo `Organization`.
  2. Vincular `Building` a `Organization`.
  3. Crear rol/relación `OrganizationUser`.
- **Verificación:** crear una `Organization` con 2 edificios. Crear un admin de organización. Verificar que ve estadísticas de ambos edificios, pero no de un edificio competidor.

### 4. Cifrado De PII En Reposo (Cumplimiento SOC2)

- **Qué:** implementar cifrado a nivel de aplicación para campos sensibles (`rut`, `phone`, `email`) o usar TDE de Postgres.
- **Por qué:** si se filtra un dump de base de datos, datos crudos de usuarios quedan expuestos. SOC2 y GDPR exigen protección de datos personales.
- **Plan de implementación agentic:**
  1. Crear `lib/crypto.ts` con helpers AES-256-GCM.
  2. Agregar middleware o Prisma middleware para cifrar al escribir y descifrar al leer campos específicos.
- **Verificación:** inspeccionar filas SQL crudas vía `psql` o servicio Prisma. Los campos deben verse como texto cifrado (`iv:ciphertext`). Las requests API deben seguir devolviendo texto claro a usuarios autorizados.

### 5. Autenticación Multifactor (MFA)

- **Qué:** integrar TOTP o SMS/WhatsApp OTP para login.
- **Por qué:** las contraseñas suelen verse comprometidas. Seguridad nivel 1 exige MFA, especialmente para roles admin y conserjería.
- **Plan de implementación agentic:**
  1. Agregar `mfaSecret` y `mfaEnabled` al modelo `User`.
  2. Implementar `speakeasy` u `otplib` para generar/verificar TOTP.
  3. Exigir MFA para `Role.ADMIN`.
- **Verificación:** intentar login como admin. Debe requerir un segundo paso. Verificar token usando Google Authenticator.

### 6. Unificación De Logging Estructurado

- **Qué:** refactorizar `EventBus` y handlers globales de error para usar `lib/logger.ts` (Pino) en vez de `console.log`.
- **Por qué:** `console.log` sirve para desarrollo local, pero en producción los logs deben ser JSON estructurado para ingesta en Datadog/Splunk/CloudWatch, consultas, alertas y correlación.
- **Plan de implementación agentic:**
  1. Buscar y reemplazar `console.log`, `console.error` en backend por `logger.info`, `logger.error`.
  2. Asegurar que el contexto `traceId` se propague a todos los logs.
- **Verificación:** ejecutar la app, disparar un flujo e inspeccionar stdout. La salida debe ser líneas JSON puras.

### 7. "Derecho Al Olvido" Automatizado

- **Qué:** crear un workflow de sistema para anonimizar datos de usuario a solicitud.
- **Por qué:** requisito legal en la UE (GDPR) y crecientemente en LatAm (LGPD/LPDP). Eliminar un usuario es riesgoso porque rompe foreign keys; anonimizar datos personales es el estándar.
- **Plan de implementación agentic:**
  1. Crear método de servicio `User.anonymize()`.
  2. Reemplazar nombre por "Anónimo", email por `deleted-uuid@placeholder.com` y limpiar teléfonos.
  3. Mantener historial transaccional para contabilidad.
- **Verificación:** crear usuario, hacer una reserva, ejecutar anonimización. Verificar que el usuario no puede hacer login, pero las estadísticas de reserva siguen correctas.

### 8. Content-Security-Policy (CSP) Estricta

- **Qué:** pasar desde CSP débil o solo reporte a una CSP estricta que prevenga XSS e inyección de scripts no autorizados.
- **Por qué:** mitiga Cross-Site Scripting (XSS). Plataformas que procesan pagos deben asegurar que ningún script malicioso capture datos de tarjeta.
- **Plan de implementación agentic:**
  1. Configurar `helmet.contentSecurityPolicy`.
  2. Permitir solo dominios conocidos (`self`, MercadoPago, Google Maps).
- **Verificación:** inyectar un `<script>alert(1)</script>` dummy en un campo de descripción si se refleja. El navegador debe bloquear la ejecución y registrar un error.

### 9. Gestión De Sesiones Revocables

- **Qué:** mover control de sesiones con estado a Redis. Guardar `sessionId` en JWT y verificar validez en Redis en cada request.
- **Por qué:** JWTs stateless no pueden revocarse si un usuario ejecuta "logout en todos los dispositivos" o si un admin bloquea a un usuario comprometido.
- **Plan de implementación agentic:**
  1. En login, guardar `session:{userId}:{sessionId}` en Redis con TTL.
  2. Middleware revisa existencia en Redis.
  3. Limitar sesiones activas por usuario para prevenir uso compartido de cuentas.
- **Verificación:** hacer login. Eliminar manualmente la key en Redis. La siguiente request con JWT válido debe fallar con 401.

### 10. Infraestructura Como Código (IaC) Y Pipeline CI/CD

- **Qué:** definir el stack completo (Postgres, Redis, Node.js, configuración Vercel) en Terraform o Docker Compose estricto para producción.
- **Por qué:** "funciona en mi máquina" no es aceptable para nivel 1. Los entornos deben tener paridad determinística.
- **Plan de implementación agentic:**
  1. Formalizar `docker-compose.prod.yml`.
  2. Escribir GitHub Actions para build, pruebas, migraciones y despliegue.
- **Verificación:** eliminar `node_modules` y DB local. Ejecutar un solo comando de despliegue "one-click". El sistema debe quedar completamente operativo.
