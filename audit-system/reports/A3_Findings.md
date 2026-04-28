# Auditoría A3: Hallazgos De Datos E IA

## 1. Resumen Ejecutivo

**Puntaje:** B

El modelo de datos es sólido y usa bien funcionalidades de integridad relacional (enums, foreign keys). Sin embargo, faltan índices en campos consultados con frecuencia (por ejemplo, `createdAt`), lo que afectará rendimiento de reportes. La preparación para IA es baja (sin pgvector ni soporte de embeddings), aunque campos JSONB permiten flexibilidad.

## 2. Hallazgos

### 2.1 Esquema De Base De Datos

- **[S2] Índices faltantes en timestamps**
  - **Ubicación:** `AuditLog`, `Booking`, `Payout`
  - **Problema:** consultas por rango de fechas (por ejemplo, ingresos del mes) escanearán la tabla completa.
  - **Corrección:** agregar `@@index([createdAt])` o `@@index([periodStart, periodEnd])` a modelos relevantes.
- **[PASÓ] Foreign keys:** Prisma agrega índices en relaciones automáticamente o la DB los exige. Índices explícitos siguen siendo mejores para filtros.
- **[S3] Uso de enums:** buen uso de enums `Role` y `BookingStatus`.

### 2.2 Preparación De IA Y Datos

- **[S2] Sin soporte de vector store**
  - **Observación:** no se encontró tipo o campo `vector` en el schema.
  - **Impacto:** no se puede implementar búsqueda semántica o RAG sin cambios de esquema.
  - **Recomendación:** agregar modelo `DocumentEmbedding` si se planifican funcionalidades IA.
- **[PASÓ] Soporte de metadata:** `AuditLog` tiene `metadata Json?`, excelente para logging extensible de contexto IA.

### 2.3 Integridad De Datos

- **[S1] Precisión financiera:** `amountClp` es `Int`, correcto para CLP sin decimales.

## 3. Recomendaciones

1. **Agregar índices:** enfocarse en `createdAt` para `Booking`, `Payout` y `AuditLog`.
2. **Habilitar pgvector:** si se usa Postgres, preparar una migración para habilitar la extensión.
