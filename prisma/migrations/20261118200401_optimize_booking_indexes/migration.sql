-- CreateIndex
CREATE INDEX "Booking_userId_createdAt_idx" ON "Booking"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_resourceId_status_startTime_idx" ON "Booking"("resourceId", "status", "startTime");
