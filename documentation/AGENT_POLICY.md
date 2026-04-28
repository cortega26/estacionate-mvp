# Política Para Agentes

Este archivo es la capa canónica de política para agentes de IA que trabajan en este repositorio. Usa `../AGENTS.md` para el inicio rápido y este archivo cuando una regla de flujo necesite interpretación.

## Prioridad De Instrucciones

1. La solicitud actual del usuario.
2. El inicio rápido raíz `AGENTS.md`.
3. `documentation/LEGAL_COMMERCIAL_GUARDRAILS.md` para cualquier tarea que toque pagos, precios, facturación, payouts, monetización, posicionamiento comercial, términos o copy visible que pueda implicar pagos/comportamiento de marketplace; léelo antes de escribir código.
4. Este archivo de política.
5. Recetas específicas en `documentation/TASKS.md` y `documentation/task-recipes/`.
6. Contexto histórico en `documentation/LESSONS.md` y reportes de auditoría.

Si dos documentos del repositorio entran en conflicto, prefiere el documento operativo más específico y reciente; cuando sea práctico, actualiza el documento obsoleto como parte del mismo cambio. Para conflictos de fase legal/comercial, `documentation/LEGAL_COMMERCIAL_GUARDRAILS.md` prevalece sobre roadmap, pitch, UI, términos o material histórico de contexto de proyecto.

## Idioma De Documentación

Toda documentación nueva o modificada debe estar en español neutro, chileno sin modismos. Mantén sin traducir comandos, rutas, nombres de archivos, nombres de librerías, identificadores de código, claves de configuración y términos de dominio cuando sean contratos técnicos o aparezcan en APIs.

## Flujo Por Defecto

1. Explora la porción relevante más pequeña del código.
2. Identifica la receta de tarea o punto de entrada que coincide con el cambio.
3. Haz el cambio completo más pequeño desde el punto de vista de comportamiento.
4. Ejecuta la validación útil más acotada mientras iteras.
5. Ejecuta `npm run check:all` antes de entregar cambios amplios, transversales o visibles para usuarios.

## Alcance Con Reproducción Primero

Para bugs, regresiones y cambios de comportamiento con riesgo, crea una prueba fallida antes de corregir. Para cambios solo de documentación, formato, metadata de dependencias o mantenimiento mecánico, ejecuta directamente el comando de validación relevante.

## Selección De Validación

- Lógica backend: empieza con el objetivo Vitest backend más cercano; para cambios amplios, luego ejecuta `cd backend && npm run check:all`.
- UI frontend o comportamiento del cliente: empieza con `cd frontend && npm test`; agrega Playwright para flujos críticos de usuario.
- Cambios en esquema Prisma: ejecuta comandos de migración/generación antes de las pruebas de aplicación.
- Cambios de documentación y proceso: ejecuta `npm run check:docs` y `npm run format:check`.
- Validación local completa con pruebas que dependen de base de datos: prefiere `npm run check:local` cuando PostgreSQL o Redis podrían no estar corriendo.

## Límites De Edición

- No edites a mano salidas generadas, lockfiles ni migraciones, salvo que la tarea trate específicamente esos archivos.
- Usa `documentation/OWNERSHIP.md` antes de cruzar límites de backend, frontend, Prisma, despliegue o archivos generados.
- Trata `backend/prisma/schema.prisma`, las formas de respuesta API y los tipos frontend como un solo contrato al cambiar modelos de datos.
- Prefiere utilidades y límites de servicio existentes antes de crear nuevas abstracciones.
- Conserva comentarios de usuario y TODOs salvo que el cambio los resuelva.

## Reporte

Termina las entregas con los comandos ejecutados y las revisiones que no pudieron correrse. Mantén breve la salida cruda de comandos e incluye la línea de falla cuando una validación falle.
