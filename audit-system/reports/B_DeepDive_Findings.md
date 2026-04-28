# Auditoría Fase 2: Hallazgos Deep Dive

**Fecha:** 2025-12-23
**Estado:** en progreso

## 1. Resumen Ejecutivo

La auditoría deep dive revela tendencia a "God Functions" en backend, especialmente en rutas críticas como creación de bookings. El schema DB es generalmente robusto, con buenos índices y prácticas de seguridad (blind indexes para PII). El frontend sufre de patrones API inconsistentes: algunos componentes evitan el cliente Axios configurado y usan `fetch` crudo, lo que puede producir errores de auth.

## 2. Hallazgos Backend

### 2.1 Arquitectura Y Separación De Responsabilidades

**Severidad:** alta

- **Violación:** `backend/api/bookings/create.ts` (280 líneas) contiene lógica excesiva:
  - Verificación de blocklist (lógica de base de datos).
  - Motor de pricing rules (lógica de negocio).
  - Detección de doble booking (lógica de negocio).
  - Publicación de eventos (lógica de infraestructura).
  - Lógica de controller (manejo req/res).
- **Impacto:** difícil de probar en aislamiento; la lógica no puede reutilizarse. Si se agrega una funcionalidad "Concierge Booking", se tendería a copiar y pegar esta lógica.
- **Recomendación:** extraer lógica a `BookingService.createBooking(...)`.

### 2.2 Fuga De Lógica De Pagos

**Severidad:** media

- **Violación:** `backend/api/payments/checkout.ts` maneja `db.payment.upsert`.
- **Recomendación:** mover a `PaymentService`.

### 2.3 Schema De Base De Datos (Prisma)

**Severidad:** baja (mayoritariamente bien)

- **Positivo:** tabla `Resident` usa `rutHash` para blind indexing y `rut` cifrado. Buena práctica de seguridad.
- **Positivo:** existen índices en foreign keys (`residentId`, `buildingId`).
- **Observación:** lógica de `PricingRule` está embebida en la query del controller en vez de una función DB o método de servicio.

## 3. Hallazgos Frontend

### 3.1 Patrones API Inconsistentes

**Severidad:** alta

- **Violación:** `frontend/src/lib/api.ts` define una instancia Axios configurada (base URL y cookies).
- **Evidencia:** `frontend/src/pages/Admin/UserManagement.tsx` evita esta instancia y usa `fetch` crudo:
  ```typescript
  fetch(`${import.meta.env.VITE_API_URL}/api/admin/users?${params}`, { credentials: 'include' })
  ```
- **Impacto:** si cambia la lógica de auth (por ejemplo, token en header), estos `fetch` crudos fallarán. También duplican lógica de variables de entorno.

### 3.2 Strings Hardcodeados

**Severidad:** baja

- Páginas de administración usan mezcla de strings hardcodeados en inglés/español.

## 4. Recomendaciones

1. **Refactor del controller de booking:** crear `BookingService`.
2. **Estandarizar API frontend:** reemplazar `fetch` crudo en `UserManagement.tsx` y similares por el cliente `api` de `lib/api.ts`.
