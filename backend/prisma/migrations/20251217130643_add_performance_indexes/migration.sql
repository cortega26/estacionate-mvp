-- CreateIndex
CREATE INDEX "availability_blocks_spot_id_status_idx" ON "availability_blocks"("spot_id", "status");

-- CreateIndex
CREATE INDEX "availability_blocks_start_datetime_end_datetime_idx" ON "availability_blocks"("start_datetime", "end_datetime");

-- CreateIndex
CREATE INDEX "bookings_resident_id_idx" ON "bookings"("resident_id");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "visitor_spots_building_id_idx" ON "visitor_spots"("building_id");
