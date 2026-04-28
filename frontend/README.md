# Frontend De Estacionate

Aplicación React, Vite, TypeScript, TailwindCSS, React Query y Playwright para la plataforma de gestión de estacionamientos de visita Estacionate.

## Desarrollo Local

Desde la raíz del repositorio:

```bash
npm run dev:frontend
```

O desde este directorio:

```bash
npm run dev
```

La URL local por defecto es `http://localhost:5173`.

## Entorno

Crea `frontend/.env` desde el ejemplo versionado:

```bash
cp .env.example .env
```

La variable principal es:

- `VITE_API_URL`: URL base de la API backend, usualmente `http://localhost:3000`.

## Validación

Ejecuta las revisiones solo del frontend:

```bash
npm run lint
npm test
npm run build
```

Ejecuta flujos de navegador cuando cambies reservas, administración, autenticación, ventas o comportamiento de conserjería:

```bash
npm run test:e2e
```

Para validación de todo el repositorio, ejecuta `npm run check:all` desde la raíz.

## Puntos De Entrada

- `src/App.tsx`: composición de rutas.
- `src/pages/**`: páginas a nivel de ruta.
- `src/features/**`: componentes de funcionalidades.
- `src/components/ui/**`: primitivas UI reutilizables.
- `src/lib/api.ts`: cliente API backend.
- `src/types/**`: tipos de dominio frontend.
- `e2e/**`: pruebas de navegador Playwright.
