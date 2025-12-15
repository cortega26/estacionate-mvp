# Booking Logic & Algorithmic Integrity Audit Findings

**Scope:** `BookingService` (`api/bookings/create.ts`) and `PricingEngine` (Hardcoded).
**Date:** 2025-12-15
**Status:** DRAFT

## 1. 🔴 CRITICAL: Zombie Reservation State (Deadlocks)
**Risk: S0 - Data Corruption / Financial Loss**
*   **Observation:** The system reserves a parking spot (`AvailabilityBlock.status = 'reserved'`) *before* payment is confirmed.
*   **Gap:** There is no visible mechanism (CRON job or timeout logic) to release this reservation if the user abandons the payment flow or if the network fails.
*   **Consequence:** "Zombie" spots that are marked `reserved` but have no active booking or payment, permanently reducing inventory and revenue.
*   **Recommendation:** Implement a 15-minute expiration window. If `Booking.paymentStatus` is not `paid` within 15 mins, a background job must revert `AvailabilityBlock.status` to `available`.

## 2. 🟠 WARN: Binary Floating Point Math on Currency
**Risk: S2 - Precision Error**
*   **Observation:** `commissionClp` is calculated as `Math.floor(block.basePriceClp * APP_CONSTANTS.BOOKING_COMMISSION_RATE)`.
*   **Gap:** `BOOKING_COMMISSION_RATE` is `0.1` (Float). This introduces IEEE 754 floating point arithmetic into monetary calculations. While `Math.floor` mitigates final storage issues, the intermediate calculation is not integer-safe.
*   **Consequence:** Potential off-by-one errors in commission calculations for large amounts.
*   **Recommendation:** Store rates as integers (e.g., `1000` for 10.00%) or use a library like `dinero.js`. For simple percentages, use `(amount * rate_basis_points) / 10000` ensuring strictly integer division.

## 3. 🟡 LOW: Weak Random Number Generation
**Risk: S3 - Edge Case Nuisance**
*   **Observation:** `confirmationCode` uses `Math.random()`.
*   **Gap:** `Math.random()` is not cryptographically secure and has a higher collision probability than `crypto.randomUUID()` or `nanoid`.
*   **Consequence:** Low risk of collision or predictability.
*   **Recommendation:** Use `crypto.randomBytes` or a dedicated library for alphanumeric codes.

## 4. 🟡 LOW: Tight Coupling of Pricing Logic
**Risk: Maintenance Debt**
*   **Observation:** Pricing logic exists directly inside the HTTP handler (`create.ts`).
*   **Gap:** No dedicated `PricingEngine`.
*   **Consequence:** Difficult to test pricing rules changes (e.g., dynamic pricing, discounts) without mocking the entire DB/HTTP layer.
*   **Recommendation:** Extract `calculateBookingPrice(block, user)` into a pure function.

## 5. ✅ PASS: Concurrency Control
*   **Observation:** The code correctly uses `prisma.$transaction` and Optimistic Locking (`updateMany` with `count` check) to prevent double-booking.
