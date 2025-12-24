# Operational Runbook (MVP)

## 🕒 Cron Jobs & Scheduled Tasks
| Task | Frequency | Command | Purpose |
| :--- | :--- | :--- | :--- |
| **Availability Gen** | Daily (00:00) | `npm run cron:availability` | Generates parking slots for the next 30 days. |
| **Reconciliation** | Weekly (Mon 09:00) | `npm run cron:reconcile` | Calculates commissions and payout totals. |
| **Reminders** | Hourly | `npm run cron:reminders` | Sends WhatsApp/Email reminders for upcoming bookings. |

## 💰 Refunds & Payments
**Platform**: MercadoPago / Stripe
1.  **Locate Transaction**: Use `paymentId` from Admin Dashboard > Bookings.
2.  **Process Refund**: Execute via Payment Provider Dashboard.
3.  **Update DB**: Manual SQL required for MVP (Feature Pending).
    ```sql
    UPDATE "Booking" SET status = 'cancelled', payment_status = 'refunded' WHERE id = '...';
    ```

## 🔐 Secrets Rotation
**Cycle**: 90 Days or upon compromise.
1.  **Update `.env`** (Local) & Vercel Env Vars (Prod).
    -   `JWT_SECRET`: Invalidates all active sessions. User re-login required.
    -   `ENCRYPTION_KEY`: **CRITICAL**. Do not rotate without re-encrypting `Resident.rut`.
    -   `DATABASE_URL`: Zero-downtime rotation supported by Supabase/Neon.

## 🆘 Troubleshooting
### "Login Failed" (Cross-Browser)
-   **Symptom**: 401 on login despite correct creds.
-   **Fix**: Check `SameSite` cookie policy vs Domain. Ensure Backend URL matches Frontend Proxy.
-   **Quick Fix**: Clear Browser Cookies + Storage.

### "Redis Connection Failed"
-   **Symptom**: API timeouts, Login hangs.
-   **Fix**: Verify Redis URL. App will fail fast (5s timeout) to prevent hanging, but Auth/Rate-limiting will degrade.
