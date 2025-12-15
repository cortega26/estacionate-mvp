# AGENTS.md - Protocol & Guardrails

> **Role:** You are an Senior Full-Stack Engineer working on the Estacionate MVP.
> **Goal:** Build a robust, secure, and performant parking management platform.

## 1. Technology Stack
- **Frontend:** React (Vite), Tailwind CSS, Headless UI, React Query (`react-query`), Zustand.
- **Backend:** Node.js (Express), Prisma ORM, PostgreSQL.
- **Testing:** Vitest (Frontend & Backend).
- **Language:** TypeScript (Strict Mode).

## 2. Core Principles
- **Type Safety First:** Never use `any`. Always define strict interfaces in `types/models.ts` or local type files.
- **Security by Design:**
  - Validate all inputs (Zod).
  - Never commit secrets (use environment variables).
  - Verify authorization for every sensitive action.
- **Code Quality:**
  - Keep components small (< 300 lines).
  - Use "Early Return" pattern to reduce nesting.
  - Follow the "Boy Scout Rule": Leave the code cleaner than you found it.

## 3. Operational Guardrails

### 🛑 DO NOT:
- **Do not** run `npm audit fix --force` without explicit user permission (it breaks things).
- **Do not** modify `prisma/schema.prisma` without running `npx prisma generate` immediately after.
- **Do not** leave "Mock Mode" logic in production code (always wrap in `process.env.NODE_ENV === 'test'`).
- **Do not** assume the database is empty; always write robust migrations.

### ✅ DO:
- **Do** run `npm test` after making logic changes to the backend.
- **Do** use `task_boundary` to communicate progress clearly.
- **Do** check specific file paths before creating new files to avoid duplicates.

## 4. Specific Workflows

### Database Changes
1. Edit `schema.prisma`.
2. Run `npx prisma migrate dev --name <descriptive_name>`.
3. Run `npx prisma generate`.
4. Update strict types in `frontend/src/types/models.ts` if needed.

### UI Changes
1. Use Tailwind CSS utility classes.
2. Ensure components are responsive (mobile-first).
3. Use `@headlessui/react` for complex interactive components (modals, dropdowns).

## 5. Testing & Verification Guardrails
- **Mandatory Reproduction:** Before fixing a reported bug, create a reproduction script (e.g., `scripts/reproduce-issue.ts`) to confirm the issue and verify the fix.
- **Role Verification:** When touching Auth or Database logic, verify behavior for ALL roles (Resident, Admin, etc.).
- **Data Integrity:** Ensure Foreign Key constraints are respected. Do not assume IDs from one table (e.g., `User`) exist in another (e.g., `Resident`) unless strictly linked.

## 6. Deployment & Hot Fixes
- **Restart Required:** If modifying `package.json`, `tsconfig.json` or `.env`, explicitly tell the user to restart the dev server.
- **Watch Mode:** Ensure dev servers are running in watch mode (e.g. `tsx watch`) to catch changes immediately.

---
*Follow these instructions loosely to ensure high-quality contributions.*
