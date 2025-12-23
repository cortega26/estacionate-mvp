# Audit A1: Business Logic & Code Health Findings

## 1. Executive Summary
**Score:** B-
The core business logic is relatively clean but lacks robustness in critical financial flows. Specifically, the commission calculation is not idempotent, posing a risk of double-payments. Error handling in services is minimal, often relying on the caller or global handlers without specific error types.

## 2. Findings

### 2.1 Financial Integry (Critical)
- **[S1] Idempotency Failure in Commission Calculation**
    - **Location**: `backend/src/services/SalesService.ts:10` (calculateCommission)
    - **Problem**: The function does not check if a `Commission` record already exists for the given `Payout`.
    - **Impact**: If `calculateCommission` is triggered twice (e.g., retry logic, race condition), the Sales Rep will receive double commission.
    - **Fix**: Add a check at the start:
      ```typescript
      const existing = await prisma.salesRepCommission.findFirst({ where: { payoutId: payout.id } });
      if (existing) return existing;
      ```

### 2.2 Error Handling
- **[S2] Generic Error Handling**
    - **Location**: `backend/src/services/auth.ts:29`
    - **Problem**: `verifyToken` generic `catch` block returns `null` for *any* error (expired, malformed, signing key mismatch).
    - **Impact**: Hard to debug why tokens are rejected.
    - **Fix**: Differentiate TokenExpiredError vs JsonWebTokenError.

### 2.3 State Management
- **[S2] Missing Transactional Boundaries**
    - **Location**: `SalesService.ts`
    - **Problem**: Commission creation is separated from Payout updates. If one fails, data could be inconsistent.
    - **Recommendation**: Use `prisma.$transaction` when linking financial records.

## 3. Recommendations
1.  **Fix Idempotency**: Immediately patch `SalesService.ts` to prevent duplicate commissions.
2.  **Transactions**: Wrap related DB mutations in interactions.

