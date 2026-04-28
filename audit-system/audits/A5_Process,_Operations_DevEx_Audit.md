# Auditoría De Proceso, Operaciones Y DevEx (A5)

**Rol:** asesor VP Engineering / auditor de plataforma y confiabilidad
**Foco:** velocidad de entrega, confiabilidad, observabilidad, experiencia de desarrollo

## Contrato De Alcance

### Esta auditoría sí:

- Evalúa **velocidad de entrega de software** y eficiencia de flujo.
- Evalúa **experiencia de desarrollo** (fricción del inner loop).
- Revisa **confiabilidad CI**, flakiness y velocidad de feedback.
- Analiza **preparación operacional**: observabilidad, respuesta a incidentes y recuperación.
- Mide señales de confiabilidad del sistema (DORA, MTTR, calidad de alertas).

### Esta auditoría no:

- Revisa mecánicas de release, estrategias de rollout o feature flags.
- Evalúa calidad de código de aplicación o UX.
- Detecta vulnerabilidades de seguridad ni brechas de compliance.
- Valida corrección de lógica de negocio.

### Regla De Delegación

Si un hallazgo trata principalmente de:

- Seguridad de release, rollbacks o paridad de entorno -> `Delegado a A6`
- Mantenibilidad de código o UX -> `Delegado a A4`
- Controles de seguridad o explotabilidad -> `Delegado a A2`
- Evidencia o política de compliance -> `Delegado a A7`

No duplicar hallazgos entre auditorías.

## 1. Propósito

Evaluar la **máquina que construye y opera el software**.

Esta auditoría responde:

- ¿Qué tan rápido podemos entregar?
- ¿Con qué frecuencia rompemos cosas?
- ¿Qué tan rápido podemos recuperarnos?
- ¿Cuánta fricción enfrentan los desarrolladores diariamente?

## 2. Audiencia

- VP Engineering / CTO
- Leads plataforma y DevOps
- Tech leads
- Equipos SRE / on-call

## 3. Alcance De Evaluación

### 3.1 Experiencia De Desarrollo (Inner Loop)

- Tiempo hasta primer commit para nuevas personas.
- Paridad de entorno local con CI.
- Latencia de feedback para pruebas, linters y builds.
- Frecuencia de problemas "funciona en mi máquina".

### 3.2 Confiabilidad CI/CD (Outer Loop)

- Tiempos de build y ejecución de pruebas.
- Efectividad de caché.
- Flakiness de pipeline y tasas de retry.
- Reproducibilidad de artefactos.

> La estrategia de release queda fuera de alcance (A6).

### 3.3 Observabilidad Y Prácticas SRE

- Cobertura de señales doradas (latencia, tráfico, errores, saturación).
- Correlación de logs, métricas y traces.
- Fatiga de alertas y relación señal/ruido.
- Salud on-call y rutas de escalamiento.

### 3.4 Preparación De Incidentes Y Recuperación

- Tendencias MTTR.
- Calidad de post-mortems (sin culpa, accionables).
- Ejecución de backup y restore, no solo documentación.
- Resultados de ensayos de disaster recovery.

## 4. Entradas Requeridas

- Logs y métricas CI/CD.
- Calendarios on-call y definiciones de alertas.
- Reportes de incidentes y post-mortems.
- Acceso a staging o sandbox.

## 5. Metodología

### 5.1 Descubrimiento

1. Medir métricas DORA cuando sea posible.
2. Identificar principales dolores de desarrolladores.
3. Inventariar tooling operacional.

### 5.2 Ejecución

**DevEx**

- Medir setup local desde cero.
- Ejecutar suite completa y medir latencia de feedback.

**CI**

- Perfilar pipelines para encontrar cuellos de botella.
- Identificar jobs flaky.

**Confiabilidad**

- Revisar incidentes recientes.
- Simular una falla controlada en no-prod.

### 5.3 Verificación Y Reporte

- Correlacionar hallazgos con resultados de entrega.
- Priorizar por **impacto en velocidad x riesgo de confiabilidad**.
- Recomendar mejoras acotadas, no proliferación de herramientas.

## 6. Entregables

1. **Reporte de fricción DevEx**
2. **Snapshot de métricas DORA**
3. **Evaluación de preparación de confiabilidad**

## 7. Niveles De Severidad

- **S0:** parálisis operacional
- **S1:** bloqueante de velocidad
- **S2:** riesgo de confiabilidad
- **S3:** fricción menor

## Restricción De Ejecución

Esta auditoría debe ejecutarse **en aislamiento** y **con contexto parcial**. Enfocarse en flujo, confiabilidad y fricción de desarrollo, no en código ni mecánicas de release.
