# Contribuir A Estacionate MVP

## Inicio

Para un entorno local limpio, ejecuta:

```bash
npm run bootstrap
```

Esto aprovisiona el entorno local e inicia los servidores de desarrollo de frontend/backend. Para aprovisionar solamente, ejecuta `npm run bootstrap -- --no-start`.

Equivalente manual:

1.  **Instalar dependencias:**
    ```bash
    npm run install:all
    ```
2.  **Entorno:** copia los ejemplos de entorno local a `.env`:
    ```bash
    cp backend/.env.local.example backend/.env
    cp frontend/.env.example frontend/.env
    ```
3.  **Servicios locales:** inicia Postgres y Redis:
    ```bash
    docker compose up -d postgres redis
    ```

## Flujo De Desarrollo

### Estrategia De Ramas

- `feat/descripcion`: nuevas funcionalidades.
- `fix/descripcion`: correcciones de bugs.
- `chore/descripcion`: mantenimiento, documentación o refactor.

### Mensajes De Commit

Usa [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add booking cron`
- `fix: resolve race condition in payments`
- `docs: add privacy policy`

### Requisitos De Pull Request

Antes de hacer push, **debes** ejecutar la revisión completa de regresión desde la raíz del repositorio:

```bash
npm run check:all
```

Este script ejecuta:

1.  Lint de backend y frontend (`eslint`)
2.  Builds de backend y frontend
3.  Pruebas de backend y frontend (`vitest`)
4.  Auditoría de arquitectura backend (`dependency-cruiser`)

**Si `check:all` falla, no abras un PR.**

## Arquitectura

- **Backend:** Node.js/Express + Prisma. Lógica en `services/`.
- **Frontend:** React + Tailwind.
- **Base de datos:** PostgreSQL.

## Principios

- **Type safety:** no usar `any`. Usa Zod para validación.
- **Seguridad:** PII hasheada (RUT).
- **Idempotencia:** todos los cron jobs y webhooks deben ser idempotentes.
- **Documentación:** escribir y mantener documentación en español neutro, chileno sin modismos.
