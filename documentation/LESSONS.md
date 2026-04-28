# Lessons Learned & Common Mistakes

> **Instruction:** Read this file before writing code. Check if your task falls into a known pitfall.

## 1. Date Handling

- **Mistake:** Using `new Date()` directly for time zone calculations.
- **Correction:** Always use `date-fns` and explicitly handle the Chile (UTC-3/UTC-4) time zone.

## 2. Database

- **Mistake:** querying `Booking` without including the relation `include: { ParkingSpot: true }`.
- **Correction:** The frontend always expects the Spot Number, so always include the relation.

## 3. Tailwind

- **Mistake:** Using arbitrary values like `w-[350px]`.
- **Correction:** Stick to the design system tokens `w-full max-w-sm`.

## 4. Commercial And Legal Copy

- **Mistake:** Describing Estacionate as a marketplace or using parking
  monetization language as the active product pitch.
- **Correction:** Phase 1 is B2B SaaS for order, rules, concierge validation,
  traceability, and operational reports. Payments, payouts, PSP, and
  resident/community charges are demo/simulator or future blocked until the
  gates in `LEGAL_COMMERCIAL_GUARDRAILS.md` are satisfied.
