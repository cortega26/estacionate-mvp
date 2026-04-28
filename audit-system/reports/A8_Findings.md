# Auditoría A8: Hallazgos De FinOps Y Eficiencia

## 1. Resumen Ejecutivo

**Puntaje:** C

El proyecto carece de políticas de ciclo de vida de datos, por lo que la base de datos crecerá indefinidamente y aumentará costos. La configuración serverless en `vercel.json` usa memoria por defecto, aceptable para MVP, pero debe ajustarse con el tiempo.

## 2. Hallazgos

### 2.1 Retención De Datos (Costo + Rendimiento)

- **[S1] Crecimiento de datos sin límite**
  - **Ubicación:** tablas `AuditLog`, `Booking`.
  - **Observación:** no se encontró cron job para archivar o eliminar registros antiguos.
  - **Impacto:** costos de almacenamiento DB crecerán linealmente; rendimiento de queries se degradará.
  - **Recomendación:** agregar cron job para eliminar `AuditLog` de más de 90 días, sujeto a requisitos legales de retención.

### 2.2 Eficiencia De Cómputo

- **[S2] Cold starts serverless**
  - **Observación:** `app.ts` importa todos los handlers en top level.
  - **Impacto:** bundle más grande aumenta latencia de cold start y duración facturable.
  - **Corrección:** usar imports dinámicos o lazy loading si está soportado, aunque el patrón Express en Vercel puede ser aceptable.

### 2.3 Conexiones A Base De Datos

- **[S1] Connection pooling**
  - **Ubicación:** `backend/src/lib/db.ts`
  - **Observación:** un comentario indica explícitamente "Use a connection pooler".
  - **Riesgo:** sin pooler transaccional de Supabase o similar, alta concurrencia agotará conexiones y puede botar la app en horas punta.

## 3. Recomendaciones

1. **Implementar limpieza de datos:** agregar `cleanup.ts` en `src/api/cron`.
2. **Habilitar pooling:** configurar `DATABASE_URL` para usar string de pooler (puerto 6543 en Supabase).
