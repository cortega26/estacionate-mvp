# Project Structure & Organization Audit (A0)
**Role:** Senior Software Architect / Tech Lead  
**Focus:** Filesystem Topology • Modularization • Naming • Screaming Architecture

---

## Scope Contract (Hard Boundary)

### This audit DOES:
- Evaluate **filesystem structure**, module boundaries, and dependency direction.
- Assess **Screaming Architecture**: whether the project structure reflects the business domain.
- Enforce **naming conventions**, colocation rules, and root hygiene.

### This audit DOES NOT:
- Evaluate runtime behavior or business logic correctness.
- Report dead code, unused functions, or duplicated rules.
- Review performance, security, UX, or testing quality.

### Delegation Rule
If a finding relates to behavior, logic, security, performance, or UX:
- **Do NOT report it here**.
- Tag it as: `Delegated to A1 / A2 / A4` and move on.

---

## 1. Purpose
Evaluate whether the project structure enables **scalability, discoverability, and clean separation of concerns**.

**Primary heuristic:** A new developer should locate the code for a given business feature in **< 10 seconds without search**.

---

## 2. Audience
- Tech Leads (long-term maintainability)
- Onboarding engineers (cognitive load reduction)
- DevOps (monorepo and build boundaries)

---

## 3. Scope of Evaluation

### 3.1 Architectural Signaling
- Feature-based vs layer-based organization.
- Business concepts visible at the top level (`billing`, `orders`, `auth`).
- Frameworks and tools should not dominate the root structure.

### 3.2 Root Directory Hygiene
- Excessive config sprawl at repo root.
- Clear visibility of documentation and ownership files.
- Separation of app code vs tooling vs infrastructure.

### 3.3 Module Boundaries & Dependencies
- Circular imports between modules.
- Improper cross-feature imports.
- Correct use of public APIs (barrel files).
- Detection of "junk drawer" folders (`utils`, `common`).

### 3.4 Naming & Consistency
- Single casing strategy for folders and files.
- Predictable naming conventions.
- Test colocation policy consistency.

---

## 4. Required Inputs
- Recursive file tree (excluding `node_modules`, `.git`).
- Framework constraints (Next.js, Rails, etc.).
- Monorepo/workspace configuration (if applicable).

---

## 5. Methodology

### 5.1 Discovery
1. Generate an ASCII tree of the top 3–4 levels.
2. Identify directories with abnormal size (file-count heatmap).

### 5.2 Structural Heuristics
- **Deletion Test:** Removing a feature folder should remove the feature.
- **Import Depth:** Excessive relative imports indicate poor boundaries.
- **Depth Rule:** Core logic should not exceed 4 levels deep.

### 5.3 Reporting
- Propose a *target* structure (not just criticism).
- Identify breaking changes caused by moves (imports, CI, dynamic paths).

---

## 6. Deliverables
1. **Proposed Directory Tree (ASCII)**
2. **Refactor Plan:** ordered `git mv` operations
3. **Naming Convention Summary**
4. **Alias / Path Mapping Updates**

---

## 7. Acceptance Criteria
- Structure reflects business domains.
- No circular dependencies between features.
- No unrestricted junk-drawer folders.
- Naming conventions applied consistently.

---

## 8. Severity Levels
- **S0:** Structural blockers (circular deps, unbounded root)
- **S1:** High friction (deep nesting, spaghetti imports)
- **S2:** Inconsistency (mixed casing, unclear ownership)
- **S3:** Cosmetic clutter

---

## Execution Constraint
This audit must be executable **in isolation** and **without full system context**.
Structural findings only. Nothing else.
