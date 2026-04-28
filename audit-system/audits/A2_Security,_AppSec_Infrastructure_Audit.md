# Auditoría De Seguridad, AppSec E Infraestructura (A2)

**Rol:** arquitecto senior de seguridad / líder DevSecOps
**Foco:** explotabilidad, límites de confianza, secretos, supply chain, seguridad de infraestructura

## Contrato De Alcance

### Esta auditoría sí:

- Identifica vulnerabilidades explotables en código, configuración e infraestructura.
- Evalúa autenticación, autorización y límites de confianza.
- Detecta exposición de secretos, riesgos de supply chain y defaults inseguros.
- Revisa postura de seguridad cloud/IaC y hardening de contenedores.
- Analiza casos de abuso que habiliten acceso a datos, escalamiento de privilegios o pérdida financiera.

### Esta auditoría no:

- Valida corrección de reglas de negocio ni state machines.
- Revisa UX, accesibilidad o legibilidad de código.
- Hace cumplir topología de proyecto o modularización.
- Produce evidencia de compliance ni interpretaciones legales.

### Regla De Delegación

Si un hallazgo trata principalmente de:

- Corrección de lógica o duplicación de reglas -> `Delegado a A1`
- Topología filesystem o nombres -> `Delegado a A0`
- UX, mantenibilidad o performance no explotable -> `Delegado a A4`
- Evidencia regulatoria, auditorías o riesgo legal -> `Delegado a A7`

No duplicar hallazgos entre auditorías.

## 1. Propósito

Identificar debilidades de seguridad **alcanzables en condiciones reales** y explotables para comprometer confidencialidad, integridad o disponibilidad.

Esta es una auditoría **white-box**: no realizar explotación activa contra sistemas vivos.

## 2. Audiencia

- Ingenieros AppSec
- Ingenieros cloud/plataforma
- Líderes de ingeniería
- Equipos de respuesta a incidentes y SRE

## 3. Alcance De Evaluación

### 3.1 Seguridad De Aplicación

- Inyecciones (SQLi, command injection, LDAP injection).
- Deserialización y manejo de archivos inseguros.
- Autenticación y autorización rotas.
- Uso criptográfico inseguro (hashes débiles, crypto custom).
- Errores verbosos que filtran información sensible.

> Nota: comportamiento incorrecto sin explotabilidad pertenece a A1.

### 3.2 Abuso Y Threat Modeling

- Brechas de rate limiting y vectores brute-force.
- IDOR (Insecure Direct Object Reference).
- Escalamiento de privilegios.
- Abuso de negocio: manipulación de precio, abuso de inventario.

### 3.3 Secretos E Identidad

- Secretos y credenciales hardcodeados.
- Inyección insegura de secretos en imágenes.
- Roles IAM demasiado permisivos.
- Falta de rotación o expiración.

### 3.4 Supply Chain Y CI/CD

- Dependencias con CVEs conocidos.
- Actions CI o herramientas de build sin pinning.
- Secretos expuestos en logs de build.
- Falta de checks de integridad/provenance de artefactos.

### 3.5 Infraestructura E IaC

- Exposición de red excesiva.
- Storage mal configurado (buckets públicos, sin cifrado).
- Riesgos de contenedores: root, privilegios, falta de límites de recursos.
- Brechas de hardening Kubernetes.

## 4. Entradas Requeridas

- Repositorios de código.
- Infraestructura como código (Terraform, Helm, CloudFormation).
- Manifiestos de dependencias.
- Especificaciones API (OpenAPI/Swagger).
- Salidas previas de scanners si existen.

## 5. Metodología

### 5.1 Descubrimiento

1. Inventariar activos críticos (PII, secretos, flujos de pago).
2. Identificar límites de confianza y puntos de entrada de datos.
3. Construir threat model estilo DFD.

### 5.2 Ejecución

**Capa de aplicación**

- Revisar middleware auth y checks de acceso.
- Inspeccionar acceso a DB por parametrización.
- Validar primitivas criptográficas.

**Capa de infraestructura**

- Revisar IaC contra benchmarks CIS.
- Inspeccionar Dockerfiles por defaults inseguros.

**Supply chain**

- Cruzar dependencias contra CVEs conocidos.
- Revisar definiciones CI por riesgos de integridad.

### 5.3 Verificación Y Reporte

- Asignar severidad según **explotabilidad x impacto**.
- Evitar falsos positivos: confirmar alcanzabilidad.
- Proponer pasos concretos de remediación.

## 6. Entregables

1. **Matriz de hallazgos de seguridad:** vulnerabilidad, severidad, ubicación, impacto y remediación.
2. **Diagrama de threat model:** Mermaid.js o notación equivalente.
3. **Reporte de secretos e IAM:** secretos expuestos y roles permisivos.
4. **Plan de hardening IaC:** cambios concretos de configuración.
5. **Backlog de remediación:** listo para tickets.

## 7. Niveles De Severidad

- **S0 crítico:** RCE, bypass de auth, secretos admin filtrados.
- **S1 alto:** IDOR, XSS almacenado, storage público con datos sensibles.
- **S2 medio:** headers faltantes, crypto débil, dependencias antiguas.
- **S3 bajo:** brechas de hardening con baja explotabilidad.

## Restricción De Ejecución

Esta auditoría debe poder ejecutarse **en aislamiento** y **con contexto parcial**. Reportar solo riesgos de seguridad explotables, no debilidades teóricas.
