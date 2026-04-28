# Auditoría A2: Hallazgos De Seguridad Y AppSec (Revisado)

## 1. Resumen Ejecutivo

**Puntaje:** B-

La aplicación tiene una base de seguridad razonable con Helmet y rate limiting basado en Redis. Sin embargo, **CORS aparece comentado en código**, aparentemente dependiendo de `vercel.json` o del proxy frontend, lo que puede ser frágil.

## 2. Hallazgos

### 2.1 Seguridad De Red

- **[S1] CORS deshabilitado en código**
  - **Ubicación:** `backend/app.ts:55` (`// app.use(cors({...}));`)
  - **Contexto:** `backend/src/lib/cors.ts` existe y define una política robusta, pero **no se usa**.
  - **Riesgo:** si falla la configuración Vercel o la app se despliega en otro entorno, la API puede rechazar requests cross-origin o quedar demasiado abierta según defaults.
  - **Recomendación:** habilitar `app.use(cors(corsOptions))` en `app.ts`.

### 2.2 Seguridad De Aplicación

- **[PASÓ] Headers de seguridad:** `helmet` está configurado correctamente en `app.ts`.
- **[PASÓ] Rate limiting:** `rateLimiter.ts` usa Redis (Upstash), correcto para Vercel.
  - _Nota:_ falla abierto (`next()`) si Redis cae. Es aceptable para disponibilidad, pero aumenta riesgo de bots durante caídas de Redis.

### 2.3 Autenticación

- **[S1] Manejo de secreto JWT**
  - **Ubicación:** `backend/src/services/auth.ts`
  - **Problema:** cae a `default-dev-secret` si falta ENV, aunque registra un error FATAL.
  - **Corrección:** cambiar a `process.exit(1)` en producción para impedir iniciar con secreto débil.

### 2.4 Infraestructura

- **[S2] Configuración Vercel**
  - **Ubicación:** `backend/vercel.json`
  - **Observación:** define `Access-Control-Allow-Origin: *` en headers. Esto sobreescribe CORS a nivel de código y permite cualquier origen.
  - **Impacto:** riesgo de seguridad. La API puede ser llamada desde sitios maliciosos (CSRF/extracción de datos si se usan cookies).
  - **Corrección:** restringir `Access-Control-Allow-Origin` en `vercel.json` o delegar al middleware `cors`.

## 3. Recomendaciones

1. **Forzar CORS en código:** habilitar `cors` en `app.ts`.
2. **Restringir headers Vercel:** remover wildcard `*` de `vercel.json` o fijarlo al dominio frontend específico.
3. **Falla dura ante secretos faltantes:** `process.exit(1)` si falta `JWT_SECRET`.
