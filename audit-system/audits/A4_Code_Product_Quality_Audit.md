# Code & Product Quality Audit (A4)
**Role:** Senior Software Engineer / Product Quality Auditor  
**Focus:** Maintainability • Performance Ergonomics • UX/UI • Accessibility • Testing Quality

---

## Scope Contract (Hard Boundary)

### This audit DOES:
- Evaluate **code maintainability and readability**.
- Assess **modularity, abstraction quality, and developer ergonomics**.
- Identify **performance issues that affect user experience** (not correctness or security).
- Review **UX/UI consistency, accessibility, and feedback mechanisms**.
- Evaluate **test quality, value, and stability**.

### This audit DOES NOT:
- Verify business logic correctness or rule enforcement.
- Detect security vulnerabilities or abuse cases.
- Enforce architectural topology or file structure changes.
- Validate regulatory or compliance requirements.

### Delegation Rule
If a finding relates primarily to:
- Business correctness, state machines, or edge cases → `Delegated to A1`
- Exploitability, secrets, auth, or abuse scenarios → `Delegated to A2`
- Filesystem topology or module boundaries → `Delegated to A0`
- Legal, regulatory, or audit evidence → `Delegated to A7`

Do NOT duplicate findings across audits.

---

## 1. Purpose

Ensure the codebase is **pleasant to work in**, **safe to evolve**, and **pleasant to use**,
without re-litigating correctness or security.

This audit focuses on *friction*: for developers and for users.

---

## 2. Audience
- Engineering Leads (technical debt & velocity)
- Frontend / Backend Leads
- QA / Test Engineers
- Product Owners (UX prioritization)

---

## 3. Scope of Evaluation

### 3.1 Maintainability & Developer Experience
- Function and class size (avoid God objects/components).
- Readability and naming clarity (intent-revealing code).
- Duplication at the **implementation level** (not business rules).
- Dependency hygiene (unused deps, version drift).
- Local setup friction (Time-to-Hello-World).

> Note: Logical duplication of business rules is **explicitly out of scope** (A1).

---

### 3.2 Architecture (Ergonomic View Only)
- Abstraction leaks (business logic inside UI layers).
- Overly coupled modules hindering change.
- Excessive global state usage.
- Statelessness of backend services.

> This section evaluates *ergonomics*, not correctness or topology.

---

### 3.3 Performance (User-Perceived)
- Frontend:
  - Unnecessary re-renders.
  - Large synchronous tasks blocking the main thread.
- Backend:
  - Obvious inefficiencies causing user-visible latency.
- Asset delivery:
  - Image formats, lazy-loading, bundle size red flags.

> Performance issues that cause **incorrect behavior** are delegated to A1.  
> Performance issues that enable **exploitation** are delegated to A2.

---

### 3.4 UX / UI & Accessibility
- Visual consistency (design tokens, spacing, typography).
- Feedback loops (loading states, empty states, error clarity).
- Accessibility:
  - Semantic HTML
  - Keyboard navigation
  - Screen reader compatibility
- Responsiveness across breakpoints.

> Error *semantics* are out of scope. Only presentation and clarity are evaluated here.

---

### 3.5 Testing Quality
- Test pyramid shape (unit vs integration vs E2E).
- Test intent: behavior vs implementation detail.
- Flakiness and non-determinism.
- Mocking strategy (over- vs under-mocking).
- Mutation resistance (do tests actually fail when behavior breaks?).

---

## 4. Required Inputs
- Source code repositories
- API documentation (OpenAPI/Swagger)
- Design references (Figma/Sketch)
- Staging or Dev environment access (realistic data)
- Performance reports (Lighthouse, APM snapshots)

---

## 5. Methodology

### 5.1 Discovery
1. Identify top 10 most complex files/components.
2. Walk critical user paths end-to-end.
3. Run static analysis tools (ESLint, Sonar, Knip, etc.).

---

### 5.2 Execution

**Maintainability**
- Flag files/components exceeding reasonable size thresholds.
- Identify abstractions that obscure intent.

**Performance**
- Profile under realistic usage.
- Identify wasted renders, forced reflows, blocking operations.

**UX & a11y**
- Keyboard-only navigation of critical paths.
- 200% zoom test.
- Heuristic consistency review.

**Testing**
- Run full test suite and measure time.
- Break a critical path intentionally—verify tests fail.

---

## 6. Deliverables

1. **Refactoring Roadmap**
   - Rewrite vs refactor recommendations.
   - High-impact / low-effort fixes.

2. **Performance Baseline**
   - Current vs target metrics (user-visible only).

3. **UX & Accessibility Gap Report**
   - Screenshots and concrete violations.

4. **Testing Quality Report**
   - Coverage gaps.
   - Flakiness risks.
   - Recommendations for pyramid rebalance.

---

## 7. Severity Levels

- **S0 — Product Blocker:** App unusable, crashes, severe UX failure.
- **S1 — Critical Friction:** Codebase hard to change safely; major UX confusion.
- **S2 — Major Annoyance:** Inconsistent UI, sluggish interactions.
- **S3 — Minor Polish:** Small readability or visual issues.

---

## Execution Constraint

This audit must be executable **in isolation** and **with partial context**.
Focus on **ergonomics and experience**, not correctness or security.
