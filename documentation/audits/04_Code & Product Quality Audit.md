# Code & Product Quality Audit
**Focus:** Application Health, Maintainability, & User Experience
**(Architecture • Maintainability • Performance • UX/UI • Testing)**

## 1. Purpose
Assess the health of the application code and user experience, strictly separating concerns from Security/Compliance/Infra. The goal is to ensure the codebase is a joy to work in and the product is a joy to use.

**Out of Scope:**
* Security Penetration Testing (handled in Security Audit)
* Regulatory Compliance (GDPR/HIPAA - handled in Compliance Audit)
* CI/CD Pipeline & Infra Configuration (handled in Release Audit)

---

## 2. Audience / Roles
* **Engineering Lead:** Focus on technical debt and velocity blockers.
* **Front-end Lead:** Focus on component purity, bundle size, and UI consistency.
* **Back-end Lead:** Focus on API contracts, database query efficiency, and data modeling.
* **QA / Test Lead:** Focus on test stability and coverage gaps.
* **Product Owner:** Focus on UX friction points and prioritization.

---

## 3. Scope

### 3.1 Code Maintainability & Developer Experience (DevEx)
* **Readability:** Naming conventions, function size, and "code smell" detection.
* **Modularity:** Component/Service reuse vs. copy-paste duplication.
* **Local Setup:** Time-to-Hello-World (how hard is it to run the app locally?).
* **Dependency Hygiene:** Circular dependencies, unused packages, and version drift.
* **Dead Code:** Unused exports, commented-out blocks, and "zombie" features.

### 3.2 Architecture & Data Strategy
* **State Management:**
    * *Frontend:* Abuse of global state (Redux/Context) vs. local state. Prop drilling.
    * *Backend:* Service statelessness.
* **Data Flow:** Unidirectional flow vs. chaotic mutation.
* **Database Interaction:**
    * N+1 query detection.
    * Inefficient fetching (over-fetching fields vs. under-fetching).
    * Transaction boundaries (data integrity during failures).
* **Contracts:** Strict typing (TypeScript/Pydantic) between Frontend and Backend.

### 3.3 Performance (Application Level)
* **Runtime Efficiency:**
    * *Frontend:* Wasted re-renders, large synchronous tasks blocking the main thread.
    * *Backend:* Slow API endpoints, lack of application-level caching (Redis/Memcached).
* **Asset Delivery:** Image optimization (WebP/AVIF), font loading strategies, lazy-loading of routes/components.
* **Core Web Vitals:** LCP, INP, CLS (specifically focusing on code-driven impacts, not network latency).

### 3.4 UX/UI & Accessibility
* **Visual Integrity:** Alignment with design tokens (spacing, typography, color).
* **Feedback Loops:** Loading skeletons, optimistic UI updates, clear error messages (no generic "Something went wrong").
* **Accessibility (a11y):**
    * Semantic HTML (headings, buttons vs. divs).
    * Keyboard navigation (focus traps, logical tab order).
    * Screen reader compatibility (ARIA labels where needed).
* **Responsiveness:** Layout stability across standard breakpoints (Mobile, Tablet, Desktop).

### 3.5 Testing Quality
* **Pyramid Shape:** Is it inverted? (Too many slow E2E tests, too few fast Unit tests).
* **Test Value:** Do tests document behavior or just implementation details? (Snapshot fatigue).
* **Flakiness:** Identification of non-deterministic tests.
* **Mocking:** Over-mocking (testing the mock instead of the code) vs. Under-mocking (brittle network dependencies).

---

## 4. Required Inputs
* Source Code Access (Repositories)
* API Documentation (Swagger/OpenAPI)
* Design Files (Figma/Sketch) for UI comparison
* Access to a populated Staging/Dev environment (with realistic data volume)
* Lighthouse/Performance Reports

---

## 5. Methodology

### 5.1 Discovery & Mapping
1.  **Critical Path Walkthrough:** Manually trace the "Money Flows" (e.g., Checkout, Signup, Core Feature).
2.  **Static Analysis:** Run tools like SonarQube, ESLint (strict), or Knip (for dead code).
3.  **Complexity Heatmap:** Identify the top 10 most complex files/functions.

### 5.2 Execution Strategy

**Code & Architecture**
* Review abstraction levels: Are business rules leaking into UI components?
* Check for "God Objects" or massive controllers/components (>500 lines).
* Validate strict typing coverage (no `any` types).

**Performance**
* **Profile** the application during heavy usage (Chrome DevTools Performance tab / Backend APM).
* Identify layout thrashing or forced reflows.
* Check for memory leaks (detached DOM nodes or unclosed subscriptions).

**UX & Accessibility**
* **Tab Test:** Navigate the critical path using *only* the keyboard.
* **Zoom Test:** Zoom browser to 200%—does the layout break?
* **Heuristic Evaluation:** Check for consistency in buttons, inputs, and modals.

**Testing**
* Run the full suite locally. Measure execution time.
* Randomly break code in a critical path—does a test fail? (Mutation testing).

---

## 6. Deliverables

1.  **Refactoring Roadmap:**
    * List of modules requiring rewrite vs. refactor.
    * "Low hanging fruit" list (high impact, low effort fixes).
2.  **Performance Baseline & Targets:**
    * Current vs. Target metrics for Web Vitals and API response times.
3.  **UX Gap Analysis:**
    * Screenshots of UI vs. Figma discrepancies.
    * Accessibility violation report (Critical/Serious only).
4.  **Remediation Backlog (CSV/Jira Import):**
    * `Type` (Bug/Debt/Story), `Priority` (P0-P3), `Component`, `Description`, `Proposed Fix`.

---

## 7. Acceptance Criteria
* Top 3 "Architecture Hotspots" are identified with diagrams on how to decouple them.
* A plan to reduce technical debt is prioritized against business value.
* All P0 (Critical) UX and Performance issues have an assigned owner.
* Audit findings are presented to the team with a Q&A session.

---

## 8. Severity Levels (Quality Focused)
* **S0 - Blocker:** App crashes, core feature unusable, data corruption logic.
* **S1 - Critical Debt:** Code is unmaintainable/fragile; modifying it causes regressions; significant performance drag.
* **S2 - Major Friction:** UX is confusing, UI is inconsistent, dev setup is painful.
* **S3 - Minor:** Code style inconsistencies, slight visual misalignments, sparse comments.