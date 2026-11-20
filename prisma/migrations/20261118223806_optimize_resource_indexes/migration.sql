-- CreateIndex
CREATE INDEX "Resource_categoryId_createdAt_idx" ON "Resource"("categoryId", "createdAt");

-- CreateIndex
CREATE INDEX "Resource_price_idx" ON "Resource"("price");

-- CreateIndex
CREATE INDEX "Resource_name_idx" ON "Resource"("name");

-- CreateIndex
CREATE INDEX "Resource_createdAt_idx" ON "Resource"("createdAt");
