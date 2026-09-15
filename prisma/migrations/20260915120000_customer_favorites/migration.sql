-- CreateTable
CREATE TABLE "CustomerFavorite" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerFavorite_customerId_idx" ON "CustomerFavorite"("customerId");

-- CreateIndex
CREATE INDEX "CustomerFavorite_inventoryId_idx" ON "CustomerFavorite"("inventoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerFavorite_customerId_inventoryId_key" ON "CustomerFavorite"("customerId", "inventoryId");

-- AddForeignKey
ALTER TABLE "CustomerFavorite" ADD CONSTRAINT "CustomerFavorite_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerFavorite" ADD CONSTRAINT "CustomerFavorite_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
