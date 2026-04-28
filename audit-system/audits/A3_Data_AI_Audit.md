# Auditoría De Integridad De Datos E IA (A3)

**Rol:** head of data / auditor de seguridad IA
**Foco:** integridad de datos, lineage, privacidad por diseño, seguridad ML/LLM, reproducibilidad

## Contrato De Alcance

### Esta auditoría sí:

- Verifica **corrección, integridad y trazabilidad de datos** en pipelines.
- Evalúa **data lineage** desde fuente hasta consumo (KPIs, modelos, reportes).
- Evalúa **controles técnicos de privacidad** (masking, hashing, minimización).
- Audita sistemas **ML y LLM** por seguridad, drift, reproducibilidad y resistencia al abuso.
- Identifica **riesgos sistémicos de datos** que pueden corromper salidas o decisiones silenciosamente.

### Esta auditoría no:

- Valida lógica de negocio de aplicación o state machines.
- Revisa UX/UI, performance de aplicación o legibilidad de código.
- Detecta vulnerabilidades AppSec clásicas ni malas configuraciones de infraestructura.
- Produce evidencia legal/compliance; eso pertenece a A7.

### Regla De Delegación

Si un hallazgo trata principalmente de:

- Corrección de reglas o comportamiento transaccional -> `Delegado a A1`
- Explotabilidad de seguridad, secretos o IAM -> `Delegado a A2`
- UX, mantenibilidad o performance de app -> `Delegado a A4`
- Obligaciones legales o interpretación regulatoria -> `Delegado a A7`

No duplicar hallazgos entre auditorías.

## 1. Propósito

Asegurar que **datos y sistemas IA sean confiables de manera aburrida**:

- los números significan lo que las personas creen,
- los modelos se comportan consistentemente en el tiempo,
- la privacidad se fuerza técnicamente, no solo por documentos,
- las fallas son detectables antes de tomar decisiones.

## 2. Audiencia

- Head of Data / Analytics
- Data engineers
- Ingenieros ML / IA
- Seguridad como audiencia secundaria para exposición PII

## 3. Alcance De Evaluación

### 3.1 Base Y Calidad De Datos

- Contratos de schema y validación.
- Nullability, freshness y anomalías de volumen.
- Fallas silenciosas versus quiebres explícitos de pipeline.
- Consistencia entre capas raw, intermedias y curadas.

### 3.2 Lineage Y Observabilidad

- Trazabilidad end-to-end desde eventos fuente a KPIs.
- Reproducibilidad de reportes y dashboards.
- Capacidad de responder: "¿de dónde salió este número?"

### 3.3 Controles Técnicos De Privacidad

- Detección de PII en stores y logs.
- Estrategias de masking, hashing y tokenización.
- Acceso least-privilege a datasets sensibles.
- Minimización de datos en analytics y pipelines IA.

> Compliance de políticas queda fuera de alcance; solo se evalúa enforcement técnico.

### 3.4 Machine Learning Clásico

- Leakage entre train/test.
- Versionado y reproducibilidad de features.
- Drift de modelos y cobertura de monitoreo.
- Inferencia determinística ante inputs idénticos.

### 3.5 IA Generativa Y Riesgos LLM

- Resistencia a prompt injection y jailbreak.
- Filtración de datos mediante prompts o capas retrieval.
- Detección de alucinaciones y frameworks de evaluación.
- Control de costos y observabilidad de uso de tokens.

## 4. Entradas Requeridas

- Definiciones de pipelines de datos (SQL, DAGs, dbt, Airflow, etc.).
- Schemas y contratos de datos.
- Acceso read-only a warehouses/lakes.
- Código de entrenamiento e inferencia de modelos.
- Prompts de sistema y lógica retrieval si aplica.

## 5. Metodología

### 5.1 Descubrimiento

1. Identificar datasets y KPIs críticos.
2. Mapear flujos y transformaciones de datos.
3. Inventariar modelos y endpoints IA.

### 5.2 Ejecución

**Integridad de datos**

- Inyectar datos malformados o stale en staging.
- Verificar detección y alertas.

**Lineage**

- Trazar KPIs seleccionados hasta ingesta raw.
- Validar reproducibilidad.

**Privacidad**

- Escanear PII sin masking en datos y logs.

**ML / IA**

- Simular escenarios de drift.
- Intentar prompt injection o exfiltración de datos de forma segura y no destructiva.

### 5.3 Verificación Y Reporte

- Confirmar que hallazgos son sistémicos, no cosméticos.
- Priorizar por **radio de impacto** y **detectabilidad**.
- Entregar pasos concretos de remediación.

## 6. Entregables

1. **Mapa de data lineage**
2. **Scorecard de calidad de datos**
3. **Evaluación de riesgos IA/ML**
4. **Reporte de exposición de privacidad**

## 7. Niveles De Severidad

- **S0:** corrupción silenciosa / brecha de datos
- **S1:** ceguera ante drift o falla de pipeline
- **S2:** garantías débiles o reproducibilidad inconsistente
- **S3:** brechas de observabilidad o documentación de lineage

## Restricción De Ejecución

Esta auditoría debe ejecutarse **en aislamiento** y **con contexto parcial**. Enfocarse en riesgos sistémicos de datos e IA, no lógica de aplicación ni papeleo de compliance.
