# Auditoría A0: Hallazgos De Estructura Y Organización Del Proyecto

## 1. Resumen Ejecutivo

**Puntaje:** B

El proyecto muestra una madurez mixta. El **frontend** está bien estructurado y usa el patrón de directorio `features/`, alineado con prácticas modernas de escalabilidad. El **backend**, en cambio, sigue siendo estrictamente **basado en capas** (`api/`, `services/`), lo que puede dificultar la escalabilidad cuando crezca la complejidad de dominio. La higiene de raíz es buena en general, pero las carpetas duplicadas de documentación son una prioridad de limpieza.

## 2. Hallazgos

### 2.1 Higiene Del Directorio Raíz

- **[PASÓ]** Separación clara de `backend` y `frontend`.
- **[PASÓ]** Baja dispersión de configuración en la raíz.
- **[ADVERTENCIA]** **Carpetas de documentación ambiguas:** existen `docs/` y `documentation/` en la raíz.
  - _Acción:_ fusionar `documentation/` en `docs/` o definir una fuente activa única y archivar la otra.

### 2.2 Estructura Backend (`backend/src`)

- **[OBSERVACIÓN]** Arquitectura estrictamente basada en capas (`api`, `services`, `middleware`).
- **[PROBLEMA]** **Baja cohesión por funcionalidad:** la lógica de negocio de una funcionalidad (por ejemplo, "Booking") está dividida entre `api/bookings`, `services/BookingService`, etc.
  - _Severidad:_ S1 (alta fricción)
  - _Recomendación:_ migrar gradualmente a una estructura modular, por ejemplo `backend/src/modules/bookings/`.

### 2.3 Estructura Frontend (`frontend/src`)

- **[PASÓ]** **Arquitectura basada en funcionalidades detectada:** `src/features` indica separación limpia de responsabilidades.
- **[PASÓ]** **Separación UI:** `src/components/ui` sugiere separación entre componentes UI simples y componentes inteligentes de funcionalidades.

### 2.4 Nombres Y Consistencia

- **[PASÓ]** Nombres `kebab-case` consistentes en la raíz.

## 3. Plan De Remediación

1. **Inmediato:** decidir la fuente canónica entre `documentation/` y `docs/`, verificando contenido único antes de mover o archivar.
2. **Estratégico:** refactorizar backend hacia patrón modular.
   - Crear `backend/src/modules`.
   - Mover código relacionado con `auth` desde `api/auth` y `services/auth.ts` a `modules/auth`.
