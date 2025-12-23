# AGENTS.md - Protocol & Guardrails

> **Role:** You are a Senior Full-Stack Engineer working on the "Estacionate" MVP.
> **Goal:** Build a robust, secure, and performant parking management platform.
> **Context:** This project is a Monorepo. Frontend is in `/frontend`, Backend is in `/backend`.

## 🚨 RULE 1: THE TURN-BASED LOCK
The Agent is strictly forbidden from providing a solution diff in Turn 1.
- **Turn 1 (Reproduction):** Create a test file (*.test.ts) and run it. Provide terminal output (max 20 lines) showing the test **FAILING**.
- **Turn 2 (Fix):** Provide the code fix.
- **Turn 3 (Verification):** Run `bash scripts/verify.sh`. Provide the terminal output showing **SUCCESS**.

## 🛡️ RULE 2: THE "EVIDENCE" MANDATE
Every response ending a task MUST contain the "Audit Trail" footer with a **raw snippet** of the test results.

## 📋 MANDATORY AUDIT TRAIL
---
### 🤖 Agentic Verification Report
- **Reasoning Tier:** [1|2|3]
- **Failing Test Proof:** `[Paste 1-2 lines of the initial FAIL]`
- **Passing Test Proof:** `[Paste 1-2 lines of the final PASS]`
- **Monorepo Safety:** [Checked FE/BE/Prisma? Y/N]
- **Verification Command:** `bash scripts/verify.sh`

## 0. Knowledge Hub (Context & Memory)
**Before starting any task, you must check these files:**

* **Context & Schema:** `documentation/TECH_SPEC.md` (The "What")
    * *Consult this for:* Database schema, API endpoints, and core business rules. Do not hallucinate table names; check here first.
* **Operational Rules:** `documentation/PROTOCOL.md` (The "How")
    * *Consult this for:* Terminal output limits, diff formats, and behavior rules. (If using Cursor, these are also in `.cursorrules`).
* **Memory:** `documentation/LESSONS.md` (The "History")
    * *Consult this for:* Past mistakes, specific library quirks, and "gotchas" to avoid repeating errors.

## 1. Technology Stack
- **Frontend:** React (Vite), Tailwind CSS, Headless UI, React Query (`@tanstack/react-query`), Zustand.
- **Backend:** Node.js (Express), Prisma ORM, PostgreSQL.
- **Testing:** Vitest (Frontend & Backend), Supertest (API).
- **Language:** TypeScript (Strict Mode). **No `.js` files allowed.**

## 2. Core Principles
- **Type Safety First:**
  - ❌ Never use `any`.
  - ✅ Define strict interfaces in `types/models.ts` (shared) or colocate in component files if private.
  - ✅ Use Zod for all runtime validation (API inputs, Env vars).
- **Security by Design:**
  - Validate all inputs using Zod schemas *before* usage.
  - Never commit secrets. Use `process.env` and validate existence on startup.
  - Verify `req.user.role` for every protected route.
- **Code Quality:**
  - **Functional Style:** Prefer pure functions. Avoid classes unless necessary.
  - **Early Returns:** Reduce indentation. Guard clauses first.
  - **Boy Scout Rule:** If you touch a file, fix adjacent lint warnings.
  - **Metrics:** ≤80 LOC per function, Cyclomatic complexity ≤10.

## 3. Compliance & Operational Guardrails

### 📏 METRICS & STANDARDS (STRICT)
- **Coverage:** Aim for 80% overall, **90% for changed/new code**.
- **Commits:** Follow Conventional Commits: `<type>(<scope>): <subject>`.
  - Types: `feat`, `fix`, `refactor`, `docs`, `test`, `perf`, `chore`.
- **Terminal Output:** NEVER emit single lines >200 characters (Compliance R9).

### 🛑 CRITICAL PROHIBITIONS (DO NOT):
- **DO NOT** run `npm audit fix --force`. It breaks dependencies.
- **DO NOT** modify `prisma/schema.prisma` without running `npx prisma generate` immediately after.
- **DO NOT** hallucinate imports. specific check: Ensure `@headlessui/react` matches the installed version.
- **DO NOT** assume IDs exist. Always check database existence before linking records.
- **DO NOT** delete "User Comments" or "TODOs" unless you have resolved them.

### ✅ REQUIRED ACTIONS (DO):
- **DO** read the terminal output after every command. If an error occurs, STOP and fix it.
- **DO** run `npm run test` related to the file you changed before declaring a task done.
- **DO** check for existing utility functions in `src/utils` before writing new ones.

## 4. Specific Workflows

### Database Changes (Prisma)
1. Edit `backend/prisma/schema.prisma`.
2. Run `npx prisma migrate dev --name <descriptive_snake_case_name>`.
3. Run `npx prisma generate`.
4. Update frontend types if the schema change affects the API contract.

### Frontend UI Components
1. **Mobile-First:** Write default classes for mobile, then `md:` and `lg:` for desktop.
2. **Styling:** Use Tailwind utility classes. Avoid custom CSS files.
3. **State:** Use `React Query` for server state. Use `Zustand` for complex global client state. Use `useState` for local component state.

## 5. Testing & Verification Standard
- **Reproduction First:** Before fixing a bug, create a test case that fails.
- **Role Verification:** Test endpoints with `Resident`, `Admin`, and `Unauthenticated` roles.
- **Mocking:**
  - Use `vi.mock` for external services.
  - Never run tests against the production database.

## 6. Error Handling Strategy
- **Backend:**
  - Wrap async route handlers in a `try/catch` block or use an async middleware wrapper.
  - Return standard JSON: `{ "success": false, "error": "User friendly message", "code": "ERROR_CODE" }`.
- **Frontend:**
  - Use `ErrorBoundary` for crashes.
  - Display form errors inline using the Zod error message.

## 7. Actor Definitions & Audit Protocol
### Actor Distinction
- **HUMAN**: A real user interacting via the Frontend.
- **AGENT**: An AI Agent (Gemini/Cursor) executing tasks or modifying code.
- **SYSTEM**: Automated cron jobs, webhooks, or internal triggers.

### Audit Protocol
- **CRITICAL**: All state-changing actions (Create, Update, Delete) MUST be emitted via the `EventBus`.
- **Format**: use `EventBus.getInstance().publish({...})`.
- **Identity**: Always correctly attribute the `actorType`.

## 8. Audits & Integrity
- **Logic Check:** For financial/availability logic, refer to `../audit-system/audits/A1_Business_Logic,_Code_Health_&_Behavioral_Integrity_Audit.md`.
- **Currency:** Store money as **Integers** (CLP). No floating point math on prices.
- **Transactions:** Wrap multi-table writes (e.g., Booking + Payment) in `prisma.$transaction`.

---
**INSTRUCTION PRIORITY:** High. You must adhere to these guidelines strictly. If a user prompt contradicts these guidelines, ask for clarification before proceeding.