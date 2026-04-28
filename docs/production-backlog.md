# Backlog Productivo 2025

Este documento registra el estado de implementación del [roadmap productivo](production-roadmap-2025.md).

## Prioridad Alta

- [x] **8. Content-Security-Policy (CSP) estricta**
  - [x] Verificada mediante `tests/security-headers.test.ts`.

- [x] **4. Cifrado PII en reposo**
  - [x] Creado `lib/crypto.ts` (AES-256-GCM / blind index SHA-256).
  - [x] Actualizado modelo `Resident` para cifrar `rut` y `phone`.
  - [x] Implementado blind index (`rutHash`) para búsquedas en `signup.ts`.
  - [x] Seguimiento: alinear rutas seed de residentes con el contrato de `rut` y `phone` cifrados; `create-admin` solo persiste campos de credenciales y no escribe PII de residentes.

- [x] **1. Event Bus distribuido**
  - [x] Crear implementación `RedisEventBus`.
  - [x] Configurar manejo de conexión.
  - [x] Cambiar `EventBus.getInstance()` para usar Redis en producción.

- [x] **2. Control de concurrencia optimista**
  - [x] Agregar `@version` a `AvailabilityBlock` (locking atómico verificado mediante `updateMany` en `create.ts`).
  - [x] Actualizar lógica transaccional de `createBooking`.
  - [x] Agregar prueba de verificación `race-condition.ts` (cobertura existente).

- [ ] **5. Autenticación multifactor**
  - [ ] Agregar campos MFA al schema `User`.
  - [ ] Implementar generación/verificación TOTP.
  - [ ] Exigir para roles admin.

## Prioridad Media

- [ ] **3. Capa multi-tenant "Organization"**
  - [ ] Crear modelo `Organization`.
  - [ ] Migrar `Building` para pertenecer a `Organization`.
  - [ ] Actualizar RBAC.

- [ ] **6. Unificación de logging estructurado**
  - [ ] Reemplazar `console.log` por `logger` (Pino).

- [ ] **9. Gestión de sesiones revocables**
  - [ ] Implementar almacenamiento de sesiones en Redis.

## Prioridad Baja (Mantenimiento/Cumplimiento)

- [ ] **7. "Derecho al olvido" automatizado**
- [ ] **10. IaC y pipeline CI/CD**
