# Technical Specification: Estacionate MVP

## 1. Core Domain

A parking management platform for residential buildings allowing residents to book visitor parking spots.

## 2. Database Schema (Simplified Source of Truth)

- **User:** `id`, `email`, `role` (ADMIN, RESIDENT, GUARD), `apartmentUnit`.
- **ParkingSpot:** `id`, `number`, `type` (VISITOR, OWNER), `isOccupied`.
- **Booking:** `id`, `userId`, `spotId`, `startTime`, `endTime`, `status` (PENDING, ACTIVE, COMPLETED, CANCELLED).
- **Payment:** `id`, `bookingId`, `amount` (Integer CLP), `status` (PAID, REFUNDED).

## 3. Key Workflows

- **Booking Flow:** User selects time -> System checks availability (no overlap) -> System creates PENDING booking -> User pays -> Booking becomes CONFIRMED.
- **Validation:** Guards scan a QR code (Booking ID) to verify entry.

> **Payment / Monetization Constraint:** All payment features are subject to Chilean
> legal restrictions defined in `documentation/LEGAL_COMMERCIAL_GUARDRAILS.md`. The
> existing PaymentService and Payout infrastructure is classified as demo/simulator
> code (Fase 1). It must not be activated against real communities until the gate
> conditions in §3 of that document are satisfied. The payer must always be the
> resident-host (`role = RESIDENT`), never a visiting third party.

## 4. API Structure (REST)

- `POST /api/auth/login`
- `GET /api/spots?available=true`
- `POST /api/bookings` (Requires Auth)
