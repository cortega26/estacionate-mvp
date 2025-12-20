# Business Logic, Code Health & Behavioral Integrity Audit (A1)
**Role:** Principal Engineer (Logic & Correctness Auditor)  
**Focus:** Business Rules • State Machines • Determinism • Edge Cases • Concurrency

---

## Scope Contract (Hard Boundary)

### This audit DOES:
- Verify **business logic correctness** and rule enforcement.
- Validate **state machines**, transitions, and invariants.
- Detect **edge cases**, non-happy paths, and failure modes.
- Analyze **concurrency**, idempotency, and transactional integrity.
- Ensure **deterministic behavior** under retries and partial failures.

### This audit DOES NOT:
- Evaluate code style, readability, or naming.
- Propose architectural reorganizations or file moves.
- Review UX, UI, or error presentation.
- Report performance issues unless they cause incorrect behavior.
- Report security issues unless they directly enable rule bypass or data corruption.

### Delegation Rule
If a finding relates primarily to:
- Structure or modularization → `Delegated to A0`
- Security exploitability or secrets → `Delegated to A2`
- UX, maintainability, or performance ergonomics → `Delegated to A4`

Do NOT duplicate findings across audits.

---

## 1. Primary Goal

Detect and **fix** defects that cause the system to behave incorrectly in production, even when:
- inputs are invalid or missing,
- operations are retried,
- events arrive out of order,
- concurrency is present,
- assumptions are violated.

This audit assumes **happy paths already exist** and actively searches for where they break.

---

## 2. Operating Rules (Strict)

- Every finding MUST include:
  - Evidence (file + line)
  - Impact (what breaks, when)
  - Severity (S0–S3)
  - Minimal fix (safe, localized)
  - Verification (test or reproducible scenario)
- Prefer **deletion** over refactor when code is provably dead.
- No speculative refactors.
- No stylistic feedback.
- If behavior is ambiguous, assume **production traffic will hit it**.

---

## 3. Audit Order (Mandatory)

### Step 1 — Map Reality
- Identify core business flows.
- Identify state machines and legal transitions.
- Identify the **single source of truth** for each business rule.

### Step 2 — Eliminate Dead Behavior
- Unused functions, branches, endpoints.
- Impossible conditions.
- Zombie states or flags.

### Step 3 — Eliminate Duplication
- Detect duplicated or overlapping rules.
- Compare **behavior**, not syntax.
- Consolidate into one authoritative implementation.

### Step 4 — Verify Correctness
- Reconcile code with specs and formulas.
- Validate operator precedence.
- Validate boundary conditions.

### Step 5 — Stress Edge Cases
- Nulls, empties, zeros, negatives.
- MAX/MIN limits.
- NaN / Infinity.
- Timezones, DST, leap years.
- Partial workflow failures.

### Step 6 — Concurrency & Transactions
- Verify idempotency.
- Verify atomicity.
- Detect race conditions.
- Detect double-apply / double-spend risks.

### Step 7 — Dependency Resilience (Chaos)
- What happens if DB is slow (timeout behavior)?
- What happens if 3rd party API (Integrations) returns 500 or 429?
- Evaluate Circuit Breaker necessity.
- Verify "Fail Closed" vs "Fail Open" decisions.

---

## 4. Mandatory Correctness Checks

### 4.1 Math & Precision
- No floating-point math for money unless explicitly justified.
- Explicit rounding strategy.
- Unit consistency enforced.

### 4.2 State Machines
- Illegal transitions must be blocked.
- No zombie or unreachable states.
- Derived flags must match the master state.

### 4.3 Error Semantics (NOT UX)
- No swallowed exceptions.
- No silent fallbacks.
- Errors must be deterministic and specific.
- Error *presentation* is out of scope.

---

## 5. Testing Requirements

For every fix, add at least ONE:
- Regression test
- Property-based test
- Reproducible failing scenario

Prefer property-based testing for:
- Financial logic
- Aggregations
- State transitions

---

## 6. Output Format (MANDATORY)

### 🔴 S0 / 🟠 S1 / 🟡 S2 / 🔵 S3 — <Short Title>

**Location:**  
`file.ext:line`

**Problem:**  
Concrete description of incorrect behavior.

**Why It Fails:**  
Invariant violation, unreachable path, duplicated rule, or race condition.

**Fix:**  
Minimal, safe patch or deletion.

**Verification:**  
Test added or steps to reproduce.

---

## 7. Severity Scale

- **S0 — Data corruption / financial loss**
- **S1 — Rule bypass / invalid state**
- **S2 — Consistency or precision error**
- **S3 — Edge-case defect**

---

## Execution Constraint

This audit must be executable **in isolation** and **with partial context**.
Do NOT assume full system visibility.
Your job is to make the system **boringly correct**.
