/*
  Warnings:

  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'concierge';

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_user_id_fkey";

-- AlterTable
ALTER TABLE "buildings" ADD COLUMN     "platform_commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
ADD COLUMN     "software_monthly_fee_clp" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "residents" ADD COLUMN     "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockout_until" TIMESTAMP(3),
ADD COLUMN     "reset_token" VARCHAR(255),
ADD COLUMN     "reset_token_expires_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockout_until" TIMESTAMP(3),
ADD COLUMN     "phone" VARCHAR(20),
ADD COLUMN     "reset_token" VARCHAR(255),
ADD COLUMN     "reset_token_expires_at" TIMESTAMP(3);

-- DropTable
DROP TABLE "audit_logs";

-- DropEnum
DROP TYPE "AuditAction";
