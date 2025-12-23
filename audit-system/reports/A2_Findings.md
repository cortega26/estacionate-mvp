# Audit A2: Security & AppSec Findings (REVISED)

## 1. Executive Summary
**Score:** B-
The application has good baseline security with Helmet and proper Redis-based Rate Limiting. However, **CORS is commented out in code**, seemingly relying on `vercel.json` or frontend proxying, which can be fragile.

## 2. Findings

### 2.1 Network Security
- **[S1] CORS Disabled in Code**
    - **Location**: `backend/app.ts:55` (`// app.use(cors({...}));`)
    - **Context**: `backend/src/lib/cors.ts` exists and defines a robust policy, but it is **not used**.
    - **Risk**: If the Vercel config fails or if the app is deployed elsewhere (e.g., rigid container), the API will reject cross-origin requests or be wide open (depending on default).
    - **Recommendation**: Uncomment `app.use(cors(corsOptions))` in `app.ts`.

### 2.2 Application Security
- **[PASSED] Security Headers**: `helmet` is correctly configured in `app.ts`.
- **[PASSED] Rate Limiting**: `rateLimiter.ts` uses Redis (Upstash) which is correct for Vercel.
    - *Note*: It fails open (`next()`) if Redis is down. This is acceptable for availability but be aware of bot risks during Redis outages.

### 2.3 Authentication
- **[S1] JWT Secret Handling**
    - **Location**: `backend/src/services/auth.ts`
    - **Problem**: Falls back to `default-dev-secret` if ENV is missing, but logs a FATAL error (good).
    - **Fix**: Change the log to `process.exit(1)` in production to prevent starting with a weak secret.

### 2.4 Infrastructure
- **[S2] Vercel Config**
    - **Location**: `backend/vercel.json`
    - **Observation**: Defines `Access-Control-Allow-Origin: *` in headers. This overrides code-level CORS and allows ANY origin.
    - **Impact**: **Security Risk**. API is open to being called from malicious sites (CSRF/Data theft if cookies are used).
    - **Fix**: Restrict `Access-Control-Allow-Origin` in `vercel.json` or defer to `cors` middleware.

## 3. Recommendations
1.  **Enforce CORS in Code**: Uncomment `cors` in `app.ts`.
2.  **Restrict Vercel Headers**: Remove wildcard `*` from `vercel.json` or set to specific frontend domain.
3.  **Hard Fail Secrets**: `process.exit(1)` on missing JWT_SECRET.
