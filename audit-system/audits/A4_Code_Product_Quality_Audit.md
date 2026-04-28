# Auditoría De Calidad De Código Y Producto (A4)

**Rol:** ingeniero senior / auditor de calidad de producto
**Foco:** mantenibilidad, ergonomía de performance, UX/UI, accesibilidad, calidad de pruebas

## Contrato De Alcance

### Esta auditoría sí:

- Evalúa **mantenibilidad y legibilidad de código**.
- Evalúa **modularidad, calidad de abstracción y ergonomía de desarrollo**.
- Identifica problemas de **performance que afectan experiencia de usuario**, no corrección o seguridad.
- Revisa **consistencia UX/UI, accesibilidad y mecanismos de feedback**.
- Evalúa **calidad, valor y estabilidad de pruebas**.

### Esta auditoría no:

- Verifica corrección de lógica de negocio ni enforcement de reglas.
- Detecta vulnerabilidades de seguridad o abuso.
- Hace cumplir topología arquitectónica o movimientos de archivos.
- Valida requisitos regulatorios o de compliance.

### Regla De Delegación

Si un hallazgo trata principalmente de:

- Corrección de negocio, state machines o edge cases -> `Delegado a A1`
- Explotabilidad, secretos, auth o abuso -> `Delegado a A2`
- Topología filesystem o límites de módulos -> `Delegado a A0`
- Evidencia legal, regulatoria o de auditoría -> `Delegado a A7`

No duplicar hallazgos entre auditorías.

## 1. Propósito

Asegurar que el codebase sea **agradable de trabajar**, **seguro de evolucionar** y **agradable de usar**, sin reabrir corrección o seguridad.

Esta auditoría se enfoca en fricción para desarrolladores y usuarios.

## 2. Audiencia

- Líderes de ingeniería
- Leads frontend/backend
- QA / test engineers
- Product owners

## 3. Alcance De Evaluación

### 3.1 Mantenibilidad Y DevEx

- Tamaño de funciones y clases, evitando god objects/components.
- Legibilidad y nombres que revelen intención.
- Duplicación a nivel de implementación, no de reglas de negocio.
- Higiene de dependencias (deps no usadas, drift de versiones).
- Fricción de setup local (time-to-hello-world).

> La duplicación lógica de reglas de negocio queda explícitamente fuera de alcance (A1).

### 3.2 Arquitectura (Vista Ergonómica)

- Abstracciones que filtran detalles.
- Módulos demasiado acoplados que dificultan cambios.
- Uso excesivo de estado global.
- Statelessness de servicios backend.

> Esta sección evalúa ergonomía, no corrección ni topología.

### 3.3 Performance Percibida Por Usuario

- Frontend: renders innecesarios, tareas síncronas largas en main thread.
- Backend: ineficiencias obvias con latencia visible para usuario.
- Assets: formatos de imagen, lazy-loading, señales de bundle grande.

Problemas de performance que causen comportamiento incorrecto van a A1; los que habiliten explotación van a A2.

### 3.4 UX/UI Y Accesibilidad

- Consistencia visual (tokens, spacing, tipografía).
- Feedback loops (loading, empty states, claridad de errores).
- Accesibilidad: HTML semántico, navegación por teclado, soporte screen reader.
- Responsividad entre breakpoints.

La semántica de errores queda fuera de alcance; aquí solo se evalúa presentación y claridad.

### 3.5 Calidad De Pruebas

- Forma de la pirámide de pruebas.
- Intención de pruebas: comportamiento versus detalle de implementación.
- Flakiness y no determinismo.
- Estrategia de mocks.
- Resistencia a mutación: si el comportamiento se rompe, las pruebas deben fallar.

## 4. Entradas Requeridas

- Repositorios de código fuente.
- Documentación API (OpenAPI/Swagger).
- Referencias de diseño (Figma/Sketch).
- Acceso a staging o dev con datos realistas.
- Reportes de performance (Lighthouse, snapshots APM).

## 5. Metodología

### 5.1 Descubrimiento

1. Identificar los 10 archivos/componentes más complejos.
2. Recorrer rutas críticas de usuario end-to-end.
3. Ejecutar herramientas estáticas (ESLint, Sonar, Knip, etc.).

### 5.2 Ejecución

**Mantenibilidad**

- Marcar archivos/componentes que excedan tamaños razonables.
- Identificar abstracciones que oscurezcan intención.

**Performance**

- Perfilar con uso realista.
- Identificar renders desperdiciados, reflows forzados y operaciones bloqueantes.

**UX y a11y**

- Navegación solo teclado en rutas críticas.
- Prueba de zoom 200%.
- Revisión heurística de consistencia.

**Pruebas**

- Ejecutar suite completa y medir tiempo.
- Romper intencionalmente una ruta crítica y verificar que las pruebas fallen.

## 6. Entregables

1. **Roadmap de refactor:** reescritura versus refactor y fixes de alto impacto/bajo esfuerzo.
2. **Baseline de performance:** métricas actuales versus objetivo.
3. **Reporte de brechas UX y accesibilidad:** screenshots y violaciones concretas.
4. **Reporte de calidad de pruebas:** brechas, riesgos de flakiness y recomendaciones de pirámide.

## 7. Niveles De Severidad

- **S0:** bloqueante de producto
- **S1:** fricción crítica
- **S2:** molestia mayor
- **S3:** pulido menor

## Restricción De Ejecución

Esta auditoría debe ejecutarse **en aislamiento** y **con contexto parcial**. Enfocarse en ergonomía y experiencia, no en corrección o seguridad.
