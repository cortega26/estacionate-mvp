# Auditoría De Estructura Y Organización Del Proyecto (A0)

**Rol:** arquitecto senior de software / tech lead
**Foco:** topología de filesystem, modularización, nombres, screaming architecture

## Contrato De Alcance

### Esta auditoría sí:

- Evalúa **estructura de filesystem**, límites de módulos y dirección de dependencias.
- Evalúa **screaming architecture**: si la estructura refleja el dominio de negocio.
- Hace cumplir **convenciones de nombres**, reglas de colocación e higiene de raíz.

### Esta auditoría no:

- Evalúa comportamiento en runtime ni corrección de lógica de negocio.
- Reporta código muerto, funciones no usadas o reglas duplicadas.
- Revisa performance, seguridad, UX o calidad de pruebas.

### Regla De Delegación

Si un hallazgo trata de comportamiento, lógica, seguridad, performance o UX:

- **No reportarlo aquí**.
- Etiquetarlo como `Delegado a A1 / A2 / A4` y continuar.

## 1. Propósito

Evaluar si la estructura del proyecto permite **escalabilidad, descubribilidad y separación limpia de responsabilidades**.

**Heurística principal:** una persona nueva debe ubicar el código de una funcionalidad de negocio en **menos de 10 segundos sin búsqueda**.

## 2. Audiencia

- Tech leads
- Ingenieros en onboarding
- DevOps

## 3. Alcance De Evaluación

### 3.1 Señalización Arquitectónica

- Organización por funcionalidad versus por capa.
- Conceptos de negocio visibles en el nivel superior (`billing`, `orders`, `auth`).
- Frameworks y herramientas no deben dominar la raíz.

### 3.2 Higiene Del Directorio Raíz

- Dispersión excesiva de configuración.
- Visibilidad clara de documentación y archivos de ownership.
- Separación de código de app, tooling e infraestructura.

### 3.3 Límites De Módulos Y Dependencias

- Imports circulares entre módulos.
- Imports impropios entre funcionalidades.
- Uso correcto de APIs públicas (barrel files).
- Detección de carpetas "cajón de sastre" (`utils`, `common`).

### 3.4 Nombres Y Consistencia

- Estrategia única de casing para carpetas y archivos.
- Convenciones de nombres predecibles.
- Consistencia de política de colocación de tests.

## 4. Entradas Requeridas

- Árbol recursivo de archivos, excluyendo `node_modules` y `.git`.
- Restricciones del framework (Next.js, Rails, etc.).
- Configuración monorepo/workspace si aplica.

## 5. Metodología

### 5.1 Descubrimiento

1. Generar árbol ASCII de los 3-4 niveles superiores.
2. Identificar directorios de tamaño anormal mediante conteo de archivos.

### 5.2 Heurísticas Estructurales

- **Deletion test:** eliminar una carpeta de funcionalidad debería eliminar la funcionalidad.
- **Profundidad de imports:** demasiados imports relativos indican límites débiles.
- **Regla de profundidad:** lógica central no debe superar 4 niveles.

### 5.3 Reporte

- Proponer una estructura objetivo, no solo críticas.
- Identificar cambios rompientes causados por movimientos (imports, CI, rutas dinámicas).

## 6. Entregables

1. **Árbol de directorios propuesto (ASCII)**
2. **Plan de refactor:** operaciones `git mv` ordenadas
3. **Resumen de convenciones de nombres**
4. **Actualizaciones de alias / path mapping**

## 7. Criterios De Aceptación

- La estructura refleja dominios de negocio.
- No hay dependencias circulares entre funcionalidades.
- No hay carpetas cajón de sastre sin restricciones.
- Las convenciones de nombres se aplican consistentemente.

## 8. Niveles De Severidad

- **S0:** bloqueantes estructurales (deps circulares, raíz sin límites)
- **S1:** fricción alta (anidación profunda, imports spaghetti)
- **S2:** inconsistencia (casing mezclado, ownership poco claro)
- **S3:** desorden cosmético

## Restricción De Ejecución

Esta auditoría debe poder ejecutarse **en aislamiento** y **sin contexto completo del sistema**. Solo hallazgos estructurales.
