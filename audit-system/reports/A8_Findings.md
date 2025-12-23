# Audit A8: FinOps & Efficiency Findings

## 1. Executive Summary
**Score:** C
The project lacks Data Lifecycle Management policies, meaning the database will grow indefinitely (increasing costs). Serverless configuration in `vercel.json` uses default memory settings which is acceptable for MVP but should be tuned.

## 2. Findings

### 2.1 Data Retention (Cost + Performance)
- **[S1] Unbounded Data Growth**
    - **Location**: `AuditLog`, `Booking` tables.
    - **Observation**: No cron job found to archive or delete old records.
    - **Impact**: Database storage costs will rise linearly; query performance will degrade.
    - **Recommendation**: Add a cron job to delete `AuditLog` > 90 days.

### 2.2 Compute Efficiency
- **[S2] Serverless Cold Starts**
    - **Observation**: `app.ts` imports all handlers at the top level.
    - **Impact**: Larger bundle size increases cold start latency and billing duration.
    - **Fix**: Use dynamic imports or lazy loading if supported, though standard for Express apps on Vercel is acceptable.

### 2.3 Database Connections
- **[S1] Connection Pooling**
    - **Location**: `backend/src/lib/db.ts`
    - **Observation**: Comment explicitly states "Use a connection pooler".
    - **Risk**: Without Supabase transaction pooler or similar, high concurrency will exhaust connections and crash the app during peak hours.

## 3. Recommendations
1.  **Implement Data Pruning**: Add a `cleanup.ts` cron to `src/api/cron`.
2.  **Enable Pooling**: Configure `DATABASE_URL` to use the pooler string (port 6543 for Supabase).
