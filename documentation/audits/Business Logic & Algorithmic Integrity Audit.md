# Business Logic & Algorithmic Integrity Audit

**Role:** Systems Architect / Data Engineer
**(Mathematical Correctness • State Machines • Concurrency • Data Integrity)**

## 1. Purpose

Verify the **correctness** and **determinism** of the application's core logic. This audit validates that the software behaves exactly according to mathematical formulas and business specifications, regardless of load or edge cases.

**Distinction:**

* *Code Audit* checks if code is clean/readable.
* *Logic Audit* checks if code calculates the correct number and transitions to the valid state.

---

## 2. Audience / Roles

* **Domain Expert / PM:** To verify the "Source of Truth" (formulas/rules).
* **Backend Lead:** Focus on implementation of algorithms and database transactions.
* **Data Scientist:** Focus on statistical models or complex aggregation logic.
* **QA / SDET:** Focus on property-based testing and edge case generation.

---

## 3. Scope

### 3.1 Mathematical Precision & Types

* **Floating Point Handling:** Detection of binary floating-point errors (IEEE 754).
  * *Check:* Are financial calculations using `Double/Float` instead of `Decimal/BigDecimal`?
* **Rounding Strategies:** Verification of consistent rounding modes (Round Half Up vs. Bankers Rounding).
* **Unit Conversions:** Consistency in time (UTC vs. Local), currency, or metric/imperial usage across modules.

### 3.2 Algorithmic Correctness

* **Formula Implementation:** Line-by-line comparison of code against the mathematical spec (e.g., Tax = `(Subtotal - Discount) * Rate`).
* **Order of Operations:** Parentheses logic and operator precedence in complex conditionals.
* **Boundary Analysis:** Behavior at exact thresholds (e.g., if Free Shipping is > $50, what happens at exactly $50.00?).

### 3.3 State Machine Logic

* **Transition Validity:** Can an entity jump from State A to State C illegally? (e.g., Order `Cancelled` -> `Shipped`).
* **Deadlocks/Zombies:** Are there states from which an entity can never exit?
* **Status Consistency:** Do derived flags match the master status? (e.g., `is_active=True` but `status=DELETED`).

### 3.4 Concurrency & Race Conditions

* **Idempotency:** What happens if the same API request is retried 3 times rapidly?
* **Atomic Transactions:** If a multi-step logic flow fails halfway (e.g., deduct inventory -> charge card), does it roll back cleanly or leave corrupted data?
* **Double Spending:** Checks for locking mechanisms on shared counters.

### 3.5 "The Null Problem"

* **Implicit vs. Explicit Null:** How does logic handle missing values? (Is `null` treated as `0`? Should it throw an error?).
* **Empty Sets:** Logic behavior when iterating over empty arrays (e.g., Average calculation dividing by zero count).

---

## 4. Required Inputs

* **The "Source of Truth":** Spreadsheet models, Business Requirement Documents (BRD), or whitepapers containing the raw formulas.
* **Source Code:** specifically Domain Services and Calculation Engines.
* **Database Schema:** To review constraints and data types.
* **Access to Logs:** To see historical logic failures.

---

## 5. Methodology

### 5.1 Static Analysis (Logic Focused)

* **Type Sniffing:** Grep for dangerous type coercion (e.g., Javascript `==` instead of `===`, or casting `int` to `float` prematurely).
* **State Mapping:** Create a diagram of all possible states and verify code handles every transition.
* **Hardcoded Constants:** Flag "Magic Numbers" buried in logic (e.g., `if total > 99.99`) instead of config files.

### 5.2 Verification Strategy

**The "Excel" Reconciliation Test**

1. Take 5 complex scenarios.
2. Calculate expected results manually (or in Excel).
3. Feed inputs to the code.
4. Compare output to the 10th decimal place.

**Property-Based Testing (Hypothesis/FastCheck)**

* Instead of `assert add(2, 2) == 4`, use an Agent to generate 1,000 random integers to prove `add(a, b) == add(b, a)` (Commutative property).
* Fuzz inputs with `MAX_INT`, `MIN_INT`, `NaN`, and `Infinity`.

**Transaction Tracing**

* Review database transaction logs for a complex flow. Ensure `BEGIN TRANSACTION` and `COMMIT/ROLLBACK` wrap the *entire* logical unit of work.

### 5.3 Reviewing Logic "Smells"

* **Deep Nesting:** Logic nested 5+ levels deep (Arrow code) usually hides edge case bugs.
* **Boolean Blindness:** Functions taking multiple booleans (`process(true, false, true)`)—verify arguments aren't swapped.

---

## 6. Deliverables

1. **Logic Divergence Report:**
    * "Spec says X, Code does Y."
    * "Rounding method inconsistent between Frontend (Display) and Backend (Charge)."
2. **Precision Audit:** List of variables at risk of floating-point drift.
3. **State Transition Matrix:** Validated map of allowed vs. blocked status changes.
4. **Edge Case Suite:** A list of inputs that cause logic failures (e.g., Negative Quantities, Leap Years).
5. **Remediation Backlog:**
    * `ID`, `Severity`, `Logic Area`, `Expected Formula`, `Actual Code Behavior`.

---

## 7. Acceptance Criteria

* Zero occurrences of binary floating-point math on monetary values.
* All State Machines have defined "Illegal Transition" guards.
* Top 5 critical business formulas are verified via Property-Based Testing inputs.
* Idempotency confirmed for critical POST/PUT endpoints.

---

## 8. Severity Levels (Logic Focused)

* **S0 - Data Corruption / Financial Loss:** Wrong math on money, race conditions causing inventory drift, unrecoverable data states.
* **S1 - Logic Breach:** User can bypass rules (e.g., access content without paying, skip workflow steps).
* **S2 - Precision Error:** Rounding discrepancies (off by 1 cent), display vs. storage mismatches.
* **S3 - Edge Case Nuisance:** Weird behavior on obscure inputs (e.g., negative age) that doesn't crash the system but looks bad.
