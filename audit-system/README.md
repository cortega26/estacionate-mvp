# Sistema Modular De Auditoría

## Visión General

Este repositorio define un **sistema de auditoría modular, ejecutable por IA** para proyectos de software.

Está diseñado para ser:

- Determinístico
- Sin solapamientos
- Consciente de ventana de contexto
- Extensible

## Módulos De Auditoría

| ID  | Nombre                     |
| --- | -------------------------- |
| A0  | Estructura                 |
| A1  | Lógica de negocio          |
| A2  | Seguridad                  |
| A3  | Datos e IA                 |
| A4  | Calidad de código/producto |
| A5  | Proceso y DevEx            |
| A6  | Release y entorno          |
| A7  | Cumplimiento               |
| A8  | FinOps y eficiencia        |

## Principios De Diseño

- SOLID
- DRY
- Zen of Python
- Una auditoría = una responsabilidad

## Cómo Usarlo

1. Ejecutar auditorías individualmente, o
2. Usar el orquestador maestro

## Extender El Sistema

Las auditorías nuevas deben definir:

- Contrato de alcance
- Reglas de delegación
- Modelo de severidad

Los IDs deben seguir el esquema global.

## No Objetivos

- Sin recomendaciones especulativas
- Sin hallazgos duplicados
- Sin opiniones de estilo fuera de alcance
