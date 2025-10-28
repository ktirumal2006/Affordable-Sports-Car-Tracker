/*
  Warnings:

  - You are about to drop the `Brand` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Dealer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Model` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Price` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Trim` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Model" DROP CONSTRAINT "Model_brand_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Price" DROP CONSTRAINT "Price_trim_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Trim" DROP CONSTRAINT "Trim_model_id_fkey";

-- DropTable
DROP TABLE "public"."Brand";

-- DropTable
DROP TABLE "public"."Dealer";

-- DropTable
DROP TABLE "public"."Model";

-- DropTable
DROP TABLE "public"."Price";

-- DropTable
DROP TABLE "public"."Trim";

-- CreateTable
CREATE TABLE "Car" (
    "id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "priceUSD" INTEGER NOT NULL,
    "horsepower" INTEGER,
    "zeroTo60" DOUBLE PRECISION,
    "imageUrl" TEXT,
    "listedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Car_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Car_make_priceUSD_idx" ON "Car"("make", "priceUSD");

-- CreateIndex
CREATE INDEX "Car_year_idx" ON "Car"("year");

-- CreateIndex
CREATE UNIQUE INDEX "Car_make_model_year_key" ON "Car"("make", "model", "year");
