# Modular Audit System

## Overview
This repository defines a **modular, AI-executable audit system** for software projects.

It is designed to be:
- Deterministic
- Non-overlapping
- Context-window aware
- Extensible

---

## Audit Modules
| ID | Name |
|----|-----|
| A0 | Structure |
| A1 | Business Logic |
| A2 | Security |
| A3 | Data & AI |
| A4 | Code & Product Quality |
| A5 | Process & DevEx |
| A6 | Release & Environment |
| A7 | Compliance |
| A8 | FinOps & Efficiency |

---

## Design Principles
- SOLID
- DRY
- Zen of Python
- One audit = one responsibility

---

## How to Use
1. Run audits individually, or
2. Use the Master Orchestrator

---

## Extending the System
- New audits must define:
  - Scope Contract
  - Delegation Rules
  - Severity Model
- IDs must follow the global scheme

---

## Non-Goals
- No speculative advice
- No duplicated findings
- No stylistic opinions outside scope
