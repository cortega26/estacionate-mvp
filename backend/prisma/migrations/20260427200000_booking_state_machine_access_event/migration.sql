-- CreateEnum
CREATE TYPE "AccessEventType" AS ENUM ('check_in', 'check_out', 'denied', 'no_show_marked');

-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'checked_in';
ALTER TYPE "BookingStatus" ADD VALUE 'checked_out';
ALTER TYPE "BookingStatus" ADD VALUE 'overstay';

-- CreateTable
CREATE TABLE "access_events" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "type" "AccessEventType" NOT NULL,
    "plate_observed" VARCHAR(10),
    "notes" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "access_events_booking_id_idx" ON "access_events"("booking_id");

-- CreateIndex
CREATE INDEX "access_events_timestamp_idx" ON "access_events"("timestamp");

-- AddForeignKey
ALTER TABLE "access_events" ADD CONSTRAINT "access_events_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
