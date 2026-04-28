# Auditoría FinOps Y Eficiencia De Recursos (A8)

**Rol:** practitioner FinOps / arquitecto cloud
**Foco:** eficiencia de costos, utilización de recursos, unit economics, desperdicio cloud

## Contrato De Alcance

### Esta auditoría sí:

- Evalúa **utilización de recursos cloud** (CPU, RAM, storage, red).
- Identifica **ineficiencias de costo** y recursos zombie.
- Evalúa **unit economics** (costo por transacción, costo por usuario).
- Revisa **políticas de escalamiento** por costo-efectividad.
- Analiza costos de licencias y SaaS en relación con valor.

### Esta auditoría no:

- Revisa estilo o mantenibilidad de código.
- Valida corrección de lógica de negocio.
- Audita permisos de seguridad, salvo roles costosos sobreaprovisionados.
- Produce reportes contables ni tributarios.

### Regla De Delegación

Si un hallazgo trata principalmente de:

- Latencia de performance percibida por usuario -> `Delegado a A4`
- Seguridad de recursos -> `Delegado a A2`
- Entornos de release -> `Delegado a A6`

No duplicar hallazgos entre auditorías.

## 1. Propósito

Asegurar que el sistema **genere más valor que costo**.

Esta auditoría responde:

- ¿Estamos quemando dinero?
- ¿Sabemos cuánto cuesta un nuevo usuario?
- ¿Los recursos están dimensionados para peak o promedio?

## 2. Audiencia

- CTO / VP Engineering
- Finanzas / CFO
- Leads de plataforma

## 3. Alcance De Evaluación

### 3.1 Desperdicio Cloud E Higiene

- Volúmenes sin adjuntar.
- Snapshots y artefactos antiguos.
- Instancias o DBs ociosas en no-prod.
- Costos de transferencia de datos (NAT Gateways, cross-zone).

### 3.2 Eficiencia De Cómputo

- Rightsizing: uso real versus tamaño provisionado.
- Uso de spot instances para workloads tolerantes a fallas.
- Agresividad de auto-scaling, especialmente velocidad de scale-down.

### 3.3 Datos Y Niveles De Storage

- Políticas hot versus cold storage.
- IOPS provisionadas versus uso real.
- Periodos de retención de logs.

### 3.4 Unit Economics

- Trazabilidad de costo a métricas de negocio (bookings, usuarios activos).
- Monitoreo de COGS.

## 4. Entradas Requeridas

- Billing del cloud provider / Cost Explorer.
- Monitoreo de infraestructura (gráficos CPU/RAM).
- Patrones de tráfico.
- Dashboards de métricas de negocio.

## 5. Metodología

### 5.1 Descubrimiento

1. **Higiene de tagging:** revisar si recursos están etiquetados por owner/env.
2. **Mayores costos:** identificar los 5 principales drivers de costo.

### 5.2 Ejecución

**Búsqueda de desperdicio**

- Escanear recursos con menos de 5% de utilización por 30 días.
- Identificar recursos no-prod corriendo 24/7.

**Revisión de arquitectura**

- Cuestionar elecciones always-on versus serverless.
- Evaluar rutas de data transfer, por ejemplo IP pública versus Private Link.

### 5.3 Verificación

- Calcular ahorros potenciales por hallazgo.
- Verificar riesgo de reducir tamaño, por ejemplo OOM.

## 6. Entregables

1. **Plan de optimización de costos:** quick wins inmediatos y cambios arquitectónicos.
2. **Reporte de unit economics:** costo por métrica clave.
3. **Reporte de brechas de tagging y presupuestos**

## 7. Niveles De Severidad

- **S0:** quema de caja masiva
- **S1:** ineficiencia relevante
- **S2:** oportunidad de optimización
- **S3:** brecha contable o de tags

## Restricción De Ejecución

Esta auditoría debe ejecutarse **en aislamiento** y **con contexto parcial**. Enfocarse en ingeniería de valor, no solo en recortar costos.
