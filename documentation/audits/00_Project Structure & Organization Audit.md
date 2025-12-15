# Project Structure & Organization Audit
**Role:** Senior Software Architect / Tech Lead
**(Screaming Architecture • Modularization • Naming Conventions • Root Hygiene)**

## 1. Purpose
Evaluate the filesystem organization to ensure it enables scalability, discoverability, and logical separation of concerns. The structure should reflect the **Business Domain** ("Screaming Architecture"), not just the technical framework.

**Goal:** A new developer should be able to locate the code for a specific feature in <10 seconds without searching.

---

## 2. Audience / Roles
- **Tech Lead:** For long-term maintainability standards.
- **Onboarding Developers:** To reduce "mental mapping" load.
- **DevOps:** For build optimization (monorepo boundaries).

---

## 3. Scope

### 3.1 Architecture Pattern
- **Vertical Slicing (Features) vs. Horizontal (Layers):**
    - *Audit:* Are we grouping by type (`/controllers`, `/views`) or by feature (`/features/auth`, `/features/billing`)?
    - *Preference:* Feature-based grouping (Colocation) for scalable apps.
- **Screaming Architecture:** Does the `src/` folder reveal what the application *does* (e.g., `parking`, `payments`) or just what tools it uses?

### 3.2 Root Directory Hygiene
- **Config Sprawl:** Are there 30+ dotfiles in the root? Can they be moved to `.config/` or consolidated?
- **Documentation:** Are `README.md`, `CONTRIBUTING.md`, and license files obvious?

### 3.3 Dependency & Module Boundaries
- **Circular Dependencies:** Are modules importing from each other in loops?
- **The "Barrel" File Strategy:** proper use of `index.ts` to expose public APIs and hide internal implementation details.
- **The "Utils" Junk Drawer:** Is `src/utils` a dumping ground for unrelated logic? (e.g., Date formatting mixed with API fetchers).

### 3.4 Naming & Consistency
- **Casing:** Enforce one standard (e.g., `kebab-case` for folders, `PascalCase` for Components, `camelCase` for utils).
- **Test Colocation:** Are tests (`.test.ts`) living next to the source file (good) or in a mirrored `__tests__` folder (outdated)?

---

## 4. Required Inputs
- **File Tree:** A recursive list of the current project structure (ignoring `node_modules` and `.git`).
- **Framework Constraints:** (e.g., Next.js App Router forces a specific structure).
- **Monorepo Config:** (If applicable, workspaces setup).

---

## 5. Methodology

### 5.1 Discovery
1.  **Map the Terrain:** Generate an ASCII tree of the top 3 levels of `src`.
2.  **Heatmap:** Identify the largest directories (files count). Large directories often indicate poor modularization.

### 5.2 Execution Rules (The "Better Place" Checks)
* **The "Deletion Test":** If I delete the `/features/bookings` folder, does it cleanly remove the Booking feature, or is logic scattered across 10 other folders?
* **The "Click Distance":** How deep is the core logic? (Goal: Max 4 levels deep).
* **The "Import Hell" Check:** Look for `../../../../../components`. This indicates deep nesting that needs flattening or path aliases (`@/components`).

### 5.3 Verify & Report
1.  **Propose a Migration:** Don't just complain; create a "Before vs. After" tree structure.
2.  **Identify Breaking Changes:** Will moving files break dynamic imports or CI pipelines?

---

## 6. Deliverables

1.  **Proposed Directory Tree (ASCII Format):**
    - Visual representation of the ideal state.
2.  **Refactoring Action Plan:**
    - Step-by-step move commands (e.g., `git mv src/components/Button src/ui/Button`).
3.  **Naming Convention Guide:**
    - "Files shall be named `[Feature][Type].ts`" (or adopted standard).
4.  **Alias Mapping Update:**
    - Updates required for `tsconfig.json` (`paths`) or `vite.config.ts`.

---

## 7. Acceptance Criteria
- **Colocation:** Unit tests, styles, and specific types are located *with* the component/module they serve.
- **No Junk Drawers:** `common` or `shared` folders have strict entry criteria.
- **Flatness:** Project depth does not exceed 4 levels unless strictly necessary for routing.
- **Consistency:** File naming matches the defined casing rule 100%.

---

## 8. Severity Levels (Structural)
- **S0 - Architecturally Blocking:** Circular dependencies causing build failures; 500+ files in a single flat folder.
- **S1 - High Friction:** "Spaghetti imports" (`../../..`); Logic scattered (Feature A logic in Feature B folder).
- **S2 - Inconsistent:** Mixed naming conventions (`userProfile.tsx` vs `UserProfile.tsx`).
- **S3 - Cosmetic:** Root folder clutter (too many config files).