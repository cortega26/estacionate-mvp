/*
  Warnings:

  - A unique constraint covering the columns `[building_id,period_start,period_end]` on the table `payouts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[payout_id]` on the table `sales_rep_commissions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "buildings" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "availability_blocks_spot_id_start_datetime_end_datetime_idx" ON "availability_blocks"("spot_id", "start_datetime", "end_datetime");

-- CreateIndex
CREATE INDEX "bookings_payment_status_idx" ON "bookings"("payment_status");

-- CreateIndex
CREATE INDEX "bookings_created_at_idx" ON "bookings"("created_at");

-- CreateIndex
CREATE INDEX "bookings_availability_block_id_idx" ON "bookings"("availability_block_id");

-- CreateIndex
CREATE INDEX "bookings_visitor_name_idx" ON "bookings"("visitor_name");

-- CreateIndex
CREATE INDEX "bookings_vehicle_plate_idx" ON "bookings"("vehicle_plate");

-- CreateIndex
CREATE INDEX "bookings_confirmation_code_idx" ON "bookings"("confirmation_code");

-- CreateIndex
CREATE INDEX "payments_created_at_idx" ON "payments"("created_at");

-- CreateIndex
CREATE INDEX "payouts_building_id_idx" ON "payouts"("building_id");

-- CreateIndex
CREATE INDEX "payouts_status_idx" ON "payouts"("status");

-- CreateIndex
CREATE INDEX "payouts_created_at_idx" ON "payouts"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_building_id_period_start_period_end_key" ON "payouts"("building_id", "period_start", "period_end");

-- CreateIndex
CREATE INDEX "residents_created_at_idx" ON "residents"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "sales_rep_commissions_payout_id_key" ON "sales_rep_commissions"("payout_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");
