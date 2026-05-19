/*
  Warnings:

  - Added the required column `pinHash` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "pinHash" TEXT NOT NULL,
ADD COLUMN     "seriesId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Booking_seriesId_idx" ON "Booking"("seriesId");
