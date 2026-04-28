# Auditoría De Seguridad De Release Y Entorno (A6)

**Rol:** release manager / auditor de seguridad DevOps
**Foco:** seguridad de deploy, rollbacks, paridad de entorno, configuración y secretos

## Contrato De Alcance

### Esta auditoría sí:

- Evalúa **mecanismos de seguridad de release** y preparación de rollback.
- Evalúa **paridad de entorno** entre dev, staging y producción.
- Revisa **gestión de configuración** y estrategias de inyección de secretos.
- Valida ciclo de vida de **feature flags** y efectividad de kill switches.
- Detecta **drift de configuración** e intervenciones manuales inseguras.

### Esta auditoría no:

- Optimiza pipelines CI ni experiencia inner-loop.
- Revisa calidad de código, UX o corrección de negocio.
- Detecta vulnerabilidades más allá de exposición de release/configuración.
- Produce evidencia legal o de compliance.

### Regla De Delegación

Si un hallazgo trata principalmente de:

- Velocidad CI, DevEx o flujo operacional -> `Delegado a A5`
- Explotabilidad de seguridad o diseño IAM -> `Delegado a A2`
- Mantenibilidad de código o UX -> `Delegado a A4`
- Compliance, aprobaciones o audit trails -> `Delegado a A7`

No duplicar hallazgos entre auditorías.

## 1. Propósito

Asegurar que **los cambios puedan enviarse y retirarse con seguridad**.

Esta auditoría responde:

- ¿Podemos desplegar sin miedo?
- ¿Podemos detener o rollbackear instantáneamente?
- ¿Los entornos se comportan igual?
- ¿Las configuraciones están controladas y son reversibles?

## 2. Audiencia

- Release managers
- DevOps / plataforma
- Leads QA
- Product owners

## 3. Alcance De Evaluación

### 3.1 Estrategia De Release

- Separación entre deploy (código presente) y release (tráfico expuesto).
- Mecanismos de rollout: blue/green, canary, rolling updates.
- Nivel de automatización; pasos manuales son riesgo.
- Tiempo medio a rollback.

### 3.2 Feature Flags Y Kill Switches

- Cobertura de rutas críticas.
- Gestión de ciclo de vida y flags obsoletas.
- Latencia de toggle en runtime.
- Ownership y documentación de flags.

### 3.3 Paridad De Entorno

- Versiones runtime (lenguaje, OS, base container).
- Parámetros de infraestructura (memoria, límites, escalamiento).
- Integraciones y credenciales de terceros.
- Realismo de datos en no-prod.

### 3.4 Configuración Y Secretos

- Estrategia de inyección (env vars versus secret manager).
- Versionado de configuración junto con código.
- Capacidad de rollback de configuración independiente.
- Detección de secretos hardcodeados o baked-in.

### 3.5 Drift Y Control De Cambios

- Detección de cambios manuales en producción (ClickOps).
- Alertas de drift de infraestructura.
- Guardrails que previenen hot fixes inseguros.

## 4. Entradas Requeridas

- Pipelines y scripts de despliegue.
- Manifiestos y variables de entorno.
- Configuraciones de feature flags.
- Acceso a entornos no productivos.

## 5. Metodología

### 5.1 Descubrimiento

1. Inventariar entornos y rutas de release.
2. Mapear pasos deploy versus release.
3. Identificar fuentes de verdad de configuración.

### 5.2 Ejecución

**Preparación de rollback**

- Simular deploy malo.
- Medir tiempo de restauración de servicio.

**Flags y toggles**

- Deshabilitar una funcionalidad no crítica en prod.
- Medir latencia de propagación.

**Paridad y drift**

- Comparar configuraciones entre entornos.
- Inspeccionar cambios manuales.

### 5.3 Verificación Y Reporte

- Validar que hallazgos sean reproducibles.
- Priorizar por **radio de impacto x tiempo de recuperación**.
- Recomendar mejoras concretas de seguridad de cambio.

## 6. Entregables

1. **Reporte de drift de entorno**
2. **Puntaje de madurez de rollback**
3. **Reporte de salud de feature flags**
4. **Resumen de higiene de configuración y secretos**

## 7. Niveles De Severidad

- **S0:** irrecuperable
- **S1:** alto riesgo
- **S2:** riesgo medio
- **S3:** bajo riesgo

## Restricción De Ejecución

Esta auditoría debe ejecutarse **en aislamiento** y **con contexto parcial**. Enfocarse en seguridad del cambio, no en velocidad o calidad de código.
