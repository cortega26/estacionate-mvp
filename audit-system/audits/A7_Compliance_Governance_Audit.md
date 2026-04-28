# Auditoría De Cumplimiento Y Gobernanza (A7)

**Rol:** compliance officer / líder de gobernanza y evidencia de auditoría
**Foco:** obligaciones regulatorias, riesgo legal, auditabilidad, gobernanza de acceso

## Contrato De Alcance

### Esta auditoría sí:

- Verifica requisitos de **cumplimiento regulatorio y contractual**.
- Evalúa **controles de gobernanza** y segregación de funciones.
- Valida **audit trails y evidencia** para auditorías internas/externas.
- Revisa obligaciones de protección de datos desde perspectiva de compliance.
- Produce documentación y matrices defendibles para auditores.

### Esta auditoría no:

- Evalúa explotabilidad técnica ni controles AppSec.
- Revisa corrección de lógica de negocio o comportamiento del sistema.
- Optimiza DevEx, CI/CD o mecánicas de release.
- Evalúa UX, performance o mantenibilidad de código.

### Regla De Delegación

Si un hallazgo trata principalmente de:

- Vulnerabilidades técnicas de seguridad -> `Delegado a A2`
- Integridad de datos o comportamiento IA -> `Delegado a A3`
- Mecánicas de release o paridad de entorno -> `Delegado a A6`
- Calidad de código o UX -> `Delegado a A4`

No duplicar hallazgos entre auditorías.

## 1. Propósito

Asegurar que la organización pueda **probar** que sigue las reglas que declara seguir.

Esta auditoría responde:

- ¿Estamos cumpliendo?
- ¿Podemos demostrarlo con evidencia?
- ¿Un auditor externo aprobaría hoy?

## 2. Audiencia

- Equipos legal y compliance
- CTO / liderazgo ejecutivo
- Auditores externos
- Seguridad y plataforma como apoyo para obtener evidencia

## 3. Alcance De Evaluación

### 3.1 Cumplimiento Legal Y Regulatorio

- Regulaciones de privacidad (GDPR, CCPA y equivalentes locales).
- Estándares sectoriales (SOC 2, ISO 27001, HIPAA, PCI-DSS si aplica).
- Regulaciones IA, por ejemplo EU AI Act, desde perspectiva de gobernanza.

> Esta auditoría verifica existencia y evidencia, no corrección técnica de implementación.

### 3.2 Propiedad Intelectual Y Licenciamiento

- Cumplimiento de licencias open-source.
- Presencia de SBOMs.
- Cesión de propiedad intelectual de empleados y contratistas.
- Obligaciones contractuales de terceros (DPAs, SLAs).

### 3.3 Controles De Gobernanza

- Gestión de cambios y trazas de aprobación.
- Segregación de funciones, sin acceso unilateral a producción.
- Plazos de alta, cambio y baja de accesos.
- Evidencia de revisiones periódicas de acceso.

### 3.4 Protección De Datos Y Derechos De Usuarios

- Workflows DSAR (acceso, eliminación, corrección).
- Políticas de retención y eliminación.
- Evidencia de ejecución (logs, tickets, timestamps).

## 4. Entradas Requeridas

- Documentos de políticas.
- Logs de control de acceso y reportes IAM.
- Registros de gestión de cambios (PRs, tickets, aprobaciones).
- Listas de proveedores y DPAs.
- Reportes de auditoría si existen.

## 5. Metodología

### 5.1 Descubrimiento

1. Inventariar regulaciones y estándares aplicables.
2. Identificar controles requeridos y tipos de evidencia.
3. Mapear sistemas a obligaciones de compliance.

### 5.2 Ejecución

**Validación de paper trail**

- Seleccionar cambios productivos al azar.
- Trazarlos a tickets y revisiones aprobadas.

**Gobernanza de acceso**

- Muestrear eventos joiner/mover/leaver.
- Verificar tiempos de revocación de acceso.

**Derechos de privacidad**

- Simular solicitud DSAR.
- Medir tiempo de finalización y calidad de evidencia.

### 5.3 Verificación Y Reporte

- Marcar brechas donde **la evidencia falta o es débil**.
- No inferir cumplimiento desde intención.
- Priorizar por riesgo **legal y financiero**.

## 6. Entregables

1. **Matriz de brechas de compliance:** requisito, estado, evidencia, riesgo.
2. **Reporte SBOM y riesgo de licencias**
3. **Evaluación de controles de gobernanza**
4. **Registro de actividades de tratamiento (ROPA)**

## 7. Niveles De Severidad

- **S0:** riesgo legal activo
- **S1:** falla de auditoría
- **S2:** debilidad de gobernanza
- **S3:** brecha documental

## Restricción De Ejecución

Esta auditoría debe ejecutarse **en aislamiento** y **con contexto parcial**. Enfocarse en evidencia y gobernanza, no implementación técnica.
