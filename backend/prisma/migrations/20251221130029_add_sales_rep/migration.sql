/*
  Warnings:

  - A unique constraint covering the columns `[rut_hash]` on the table `residents` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "BlocklistType" AS ENUM ('EMAIL', 'PHONE', 'RUT', 'PLATE', 'IP');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'sales_rep';

-- DropIndex
DROP INDEX "residents_rut_key";

-- AlterTable
ALTER TABLE "buildings" ADD COLUMN     "sales_rep_commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
ADD COLUMN     "sales_rep_id" TEXT;

-- AlterTable
ALTER TABLE "residents" ADD COLUMN     "rut_hash" VARCHAR(64),
ALTER COLUMN "rut" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "phone" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "phone" SET DATA TYPE VARCHAR(255);

-- CreateTable
CREATE TABLE "blocklist" (
    "id" TEXT NOT NULL,
    "building_id" TEXT,
    "type" "BlocklistType" NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "reason" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" TEXT NOT NULL,
    "building_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_rep_commissions" (
    "id" TEXT NOT NULL,
    "sales_rep_id" TEXT NOT NULL,
    "building_id" TEXT NOT NULL,
    "payout_id" TEXT,
    "amount_clp" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_rep_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blocklist_type_value_idx" ON "blocklist"("type", "value");

-- CreateIndex
CREATE INDEX "blocklist_building_id_idx" ON "blocklist"("building_id");

-- CreateIndex
CREATE INDEX "pricing_rules_building_id_is_active_idx" ON "pricing_rules"("building_id", "is_active");

-- CreateIndex
CREATE INDEX "pricing_rules_start_date_end_date_idx" ON "pricing_rules"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "sales_rep_commissions_sales_rep_id_idx" ON "sales_rep_commissions"("sales_rep_id");

-- CreateIndex
CREATE INDEX "buildings_sales_rep_id_idx" ON "buildings"("sales_rep_id");

-- CreateIndex
CREATE UNIQUE INDEX "residents_rut_hash_key" ON "residents"("rut_hash");

-- AddForeignKey
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocklist" ADD CONSTRAINT "blocklist_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_rep_commissions" ADD CONSTRAINT "sales_rep_commissions_sales_rep_id_fkey" FOREIGN KEY ("sales_rep_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_rep_commissions" ADD CONSTRAINT "sales_rep_commissions_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_rep_commissions" ADD CONSTRAINT "sales_rep_commissions_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
