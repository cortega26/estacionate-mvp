# Auditoría Fase 1: Escaneos Automatizados Y Quick Wins

**Fecha:** 2025-12-23
**Estado:** en progreso

## 1. Resumen Ejecutivo

El escaneo automatizado inicial identificó varios elementos de bajo esfuerzo que pueden mejorar de inmediato limpieza de código y reducir ruido. Los hallazgos clave incluyen logs de debug en código productivo, diferencias de versiones de dependencias entre frontend y backend, y TODOs críticos en manejo de pagos.

## 2. Hallazgos

### 2.1 Limpieza De Código (Console Logs)

**Severidad:** baja (ruido) / media (filtración de información)

Se encontró uso de `console.log` y `console.error` en rutas que parecen productivas:

- `backend/api/index.ts`: logs de debug de inicio.
- `backend/app.ts`: logs de debug de inicio.
- `frontend/src/main.tsx`: `console.log('Main app starting...')`
- `frontend/src/pages/dashboard/SearchPage.tsx`: uso de debug `console.log('Checkout Init:', res.data)` y `console.error`.

**Recomendación:** remover estos logs o reemplazarlos por un logger adecuado, como `pino`, que ya está instalado en backend.

### 2.2 Deuda Técnica (TODOs/FIXMEs)

**Severidad:** media / alta

- **Crítico:** `backend/src/api/payments/webhook.ts`: `// TODO: Fetch payment from MP API using paymentId`. Esto sugiere que el webhook podría confiar en el body entrante sin verificación, lo que es un riesgo de seguridad.
- **UX:** `frontend/src/pages/admin/SettingsPage.tsx`: strings en español hardcodeados en llamadas `confirm()`. Deben ser componentes UI o al menos strings centralizados.

### 2.3 Gestión De Dependencias (`package.json`)

**Severidad:** media

- **Inconsistencia:** `date-fns` está en v3.6.0 en backend y v2.30.0 en frontend.
- **Versiones sospechosas:**
  - Frontend lista `zod` como `^4.1.13`.
  - Backend lista `zod` como `^3.25.76`.
- **¿Scripts muertos?:** frontend tiene `deploy`: `gh-pages -d dist`, pero el proyecto parece apuntar a Vercel.

### 2.4 Type Safety

**Severidad:** baja por ahora

- Uso extensivo de `any` en archivos de prueba (`backend/tests/**`). Hace que refactors de pruebas sean frágiles, aunque no afecta directamente runtime productivo.

## 3. Plan De Acción Inmediato (Quick Wins)

1. **Limpieza:** remover `console.log` de `frontend/src/main.tsx`, `frontend/src/pages/dashboard/SearchPage.tsx`, `backend/api/index.ts` y `backend/app.ts`.
2. **Investigación:** verificar si versiones de `zod` son válidas o errores tipográficos.
3. **Refactor:** agregar check `verifyPayment` en `webhook.ts` (movido a deep dive, pero anotado aquí).
