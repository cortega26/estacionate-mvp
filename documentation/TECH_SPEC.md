# Technical Specification: Estacionate MVP

> **Phase 1 product boundary:** The enabled product is B2B SaaS for Chilean
> communities/administrators. It covers visitor-parking rules, reservations,
> concierge validation, traceability, and operational reporting. It does not
> include integrated payments, payouts, PSP processing, direct visitor charges,
> or custody of community funds.

## 1. Core Domain

Estacionate is a visitor-parking management platform for residential buildings.
It lets residents request/reserve visitor parking under the rules configured by
their community, lets concierge teams validate access by plate/code/QR where
available, and gives administrators operational evidence and reports.

## 2. Database Schema (Simplified Orientation)

The Prisma schema remains the implementation source of truth. At a high level:

- **User:** internal platform/building roles such as `admin`, `support`,
  `building_admin`, `concierge`, and `sales_rep`.
- **Resident:** resident identity associated with a building/unit and used for
  resident-facing reservation flows.
- **VisitorSpot / AvailabilityBlock:** visitor parking inventory and time
  windows controlled by the community/administrator.
- **Booking:** visitor-parking reservation state and audit trail.
- **Payment / Payout / PricingRule:** demo/simulator and future-gated
  infrastructure only. These models must not be treated as enabled production
  payment flows in Phase 1.

## 3. Key Workflows

- **Phase 1 Booking Flow:** resident selects date/building/time -> system checks
  availability -> system creates a reservation record -> reservation is
  validated operationally according to building rules. A confirmed reservation
  in Phase 1 must not depend on a real integrated payment.
- **Concierge Validation:** concierge validates by plate/code/QR where available,
  records operational evidence, and follows the building protocol. Concierge is
  not a payment collection role in Phase 1.
- **Reports:** reports focus on operational activity, occupancy, rule compliance,
  traceability, and incidents. They must not present parking monetization as an
  enabled production feature.

> **Payment / Monetization Constraint:** All payment features are subject to Chilean
> legal restrictions defined in `documentation/LEGAL_COMMERCIAL_GUARDRAILS.md`. The
> existing PaymentService and Payout infrastructure is classified as demo/simulator
> code for future-gated phases. It must not be activated against real communities
> until the gate conditions in §3 of that document are satisfied. If a future
> gated phase is approved, the payer must always be the resident-host, never a
> visiting third party, and Estacionate must not custody community funds.

## 4. API Structure (REST)

- `POST /api/auth/login`
- `GET /api/spots?available=true`
- `POST /api/bookings` (Requires Auth)
