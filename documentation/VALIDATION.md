# Guía De Validación

Ejecuta la revisión relevante más acotada mientras trabajas; luego ejecuta el comando más amplio antes de entregar cambios grandes o transversales.

## Repositorio Completo

```bash
npm run check:all
```

Wrapper equivalente de shell:

```bash
npm run verify
```

Wrapper local consciente del entorno:

```bash
npm run check:local
```

`check:local` crea archivos de entorno locales faltantes, inicia PostgreSQL y Redis con Docker, y luego ejecuta `npm run check:all`.

## Solo Backend

```bash
cd backend && npm run check:all
```

Las revisiones backend con base de datos requieren PostgreSQL, Redis y variables de entorno de prueba backend. Usa `backend/.env.test.example` como plantilla de prueba, o ejecuta `npm run check:local` desde la raíz del repositorio para iniciar primero la infraestructura local.

Loop backend más rápido:

```bash
cd backend && npm run lint && npm run build && npm test
```

## Solo Frontend

```bash
cd frontend && npm run lint && npm test && npm run build
```

## Flujos Frontend Críticos En Navegador

```bash
cd frontend && npm run test:e2e
```

Ejecuta una sola spec Playwright mientras iteras:

```bash
cd frontend && npm run test:e2e -- booking.spec.ts
```

## Cambios De Base De Datos

```bash
cd backend
npx prisma migrate dev
npx prisma generate
npm run check:all
```

Actualiza también respuestas API, tipos frontend y datos seed afectados cuando el cambio de esquema toque contratos visibles para usuarios.

## Cambios De Dependencias

Después de agregar, quitar o actualizar paquetes:

```bash
npm run install:all
npm run check:all
```

Usa `npm audit` para visibilidad, pero no ejecutes `npm audit fix --force`.

## Cambios Solo De Documentación

Para ediciones solo de Markdown o proceso, ejecuta una revisión liviana:

```bash
npm run check:docs
npm run format:check
```

Si la documentación cambió comandos o scripts, ejecuta también el parser de comandos o revisión de sintaxis shell para esos archivos.

Para cambios comerciales, legales, de pricing, payment, payout o copy visible, repite además el escaneo de vocabulario de guardrails desde la tarea o descripción del PR y clasifica las coincidencias restantes como contexto de política negativa, demo/simulador, fase futura bloqueada, corregido o riesgo pendiente.

## Formato

Revisar formato sin cambiar archivos:

```bash
npm run format:check
```

Aplicar formato a fuentes y documentación soportadas:

```bash
npm run format
```
