# Receta UI Frontend

Usa esta receta para cambios en rutas, componentes, estado y estilos de la app React/Vite.

## Comienza Con

- `frontend/src/App.tsx` para routing y composición superior.
- `frontend/src/pages/**` para pantallas a nivel de ruta.
- `frontend/src/features/**` para componentes dueños de funcionalidad.
- `frontend/src/components/ui/**` para controles compartidos.
- `frontend/src/lib/api.ts` para llamadas al backend.
- `frontend/src/types/**` para contratos frontend compartidos.

## Notas De Implementación

- Usa React Query para estado de servidor y Zustand solo para estado de cliente transversal a pantallas.
- Mantén primitivas UI reutilizables en `frontend/src/components/ui`.
- Usa utilidades Tailwind y patrones de layout existentes antes de agregar CSS nuevo.
- Actualiza tipos API y fixtures cuando un cambio UI dependa de la forma de respuesta backend.

## Validar Con

```bash
cd frontend && npm run lint && npm test && npm run build
```

Agrega Playwright cuando el cambio afecte flujos de auth, booking, admin, ventas o conserjería:

```bash
cd frontend && npm run test:e2e
```
