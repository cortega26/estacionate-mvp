# Finding ID Scheme

## Purpose
Provide a **stable, unique, and traceable identifier** for every audit finding across all audits.

This scheme enables:
- Deduplication across audits
- Historical tracking
- Machine-parseable reporting
- Human-readable context

---

## Format

```
A{AuditID}-S{Severity}-{Sequence}
```

### Example
```
A2-S1-004
```

| Component | Meaning |
|---------|--------|
| `A2` | Audit ID (Security) |
| `S1` | Severity |
| `004` | Sequential number, stable within the audit |

---

## Severity Mapping
| Code | Meaning |
|-----|--------|
| S0 | Critical / Stop-Ship |
| S1 | High |
| S2 | Medium |
| S3 | Low |

---

## Rules
- Sequence numbers **must be stable** once assigned.
- Deleted findings are **never reused**.
- Delegated findings do **not** receive IDs.
- IDs are immutable across reruns.

---

## Valid Usage
- Filenames
- Jira tickets
- CSV exports
- Orchestrator deduplication
