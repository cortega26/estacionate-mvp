# Auditoría A6: Hallazgos De Release Y Entorno

## 1. Resumen Ejecutivo

**Puntaje:** B-

El despliegue se maneja mediante scripts estándar (`npm run deploy:production`), probablemente envolviendo Vercel CLI. Sin embargo, la **paridad de entorno** es débil por la ausencia histórica de archivos `.env.example` en backend. Esto obliga a depender de documentación externa o conocimiento tribal.

## 2. Hallazgos

### 2.1 Configuración De Entorno

- **[S2] `.env.example` faltante**
  - **Ubicación:** `backend/`
  - **Problema:** no existe archivo de entorno de ejemplo.
  - **Impacto:** fricción de onboarding y riesgo de claves faltantes en producción si no están documentadas.
  - **Recomendación:** crear `backend/.env.example` con claves y valores dummy.

### 2.2 Gestión De Secretos

- **[PASÓ] Gitignore:** `.gitignore` excluye correctamente `.env` y `.env.local`.
- **[S1] Secretos en código:** repetido desde A2. Fallback a secretos por defecto en `auth.ts` es riesgoso para release si fallan envs.

### 2.3 Despliegue

- **[PASÓ] Scripts de build:** `package.json` contiene scripts estándar de build.
- **[S2] Sin entorno staging dedicado:** los scripts mencionan `deploy:staging`, pero se debe confirmar si existe una URL staging persistente. Vercel entrega Preview URLs, lo que ayuda, pero un entorno staging dedicado con rama `staging` es preferible para pruebas de integración.

## 3. Recomendaciones

1. **Crear `.env.example`:** acción inmediata.
2. **Formalizar staging:** asegurar que `deploy:staging` mapee a una URL no productiva consistente.
