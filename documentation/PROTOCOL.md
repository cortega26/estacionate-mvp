# AGENT BEHAVIOR & OUTPUT PROTOCOL
# (These rules govern HOW you work, not just WHAT you code.)

## 🛑 CRITICAL RULES (ZERO TOLERANCE)
1.  **Bias for Action:** Your first response MUST include a diff or a shell command. Do not ask "Should I do this?"—just do it.
2.  **No Binary/Large Files:** Never output binary blobs or full file contents of lockfiles/minified code.
3.  **State Assumptions:** If you must assume a library version or business logic, explicitly state: "Assuming [X] because [Y]."
4.  **Model Selection:**
    * *Low Risk (Docs/Typos):* Use fast/cheaper models.
    * *High Risk (Auth/Payment/Architecture):* Use smartest available model.

## 🔄 WORKFLOW LOOP
1.  **EXPLORE (With R9 Limits):**
    * Use `ls -F`, `grep`, or `find` to locate files.
    * *Constraint:* Never output more than 50 lines of search results.
2.  **EDIT (Minimal Diffs):**
    * Apply changes using `sed` or code block replacements.
    * Keep changes atomic. Don't refactor unrelated code.
3.  **TEST (Verification):**
    * Run the specific test for the file you changed.
    * *If no test exists:* Create a `repro_script.ts` to verify the fix.
4.  **COMMIT (Conventional):**
    * Format: `<type>(<scope>): <subject>` (e.g., `fix(auth): handle null token`).

## 🛡️ STANDARDS (The "Definition of Done")
* **Code (R1):** Max 80 LOC/function. Cyclomatic complexity < 10. SOLID principles.
* **Security (R2):** No hardcoded secrets. No shell injection (`exec` must use array args).
* **Testing (R3):** Coverage targets: 80% Project, 90% Changed Files.
* **Docs (R4):** If you change a generic function, update its JSDoc/TSDoc.

## 🚫 TERMINAL / OUTPUT POLICY (R9) - VITAL
**Goal:** Prevent session crashes and token waste.
**Hard Limits:**
* **Line Length:** < 200 chars. (Use `cut -c1-200`).
* **Output Height:** < 50 lines. (Use `head -n 50`).
* **No Color:** Use `--color=never` or `NO_COLOR=1`.

**Safe Command Patterns (Use these):**
* `grep -rn "Pattern" src --color=never | cut -c1-200 | head -n 20`
* `npm test 2>&1 | cut -c1-200 | head -n 50`
* `cat src/file.ts | head -n 100` (Only if you are sure it is small)

**Strict Ban:**
* `cat package-lock.json`
* `npm install` (without `--silent`)
* `cat dist/bundle.js`

## 📝 REPORTING FORMAT (End of Task)
Chat (One-liner): ✅ 8/9 rules met (R5 deferred - no benchmark tooling)

**PR Body Template:**
> 🤖 Model: gpt-5.2-codex (High)
> ✅ Compat: Compatible
> 🧪 Tests: `src/auth.test.ts` passed (95% cov)
> 🔐 Security: No secrets found
> 📝 Commits: `feat(auth): add login retry limit`