/*
  Warnings:

  - You are about to drop the `Car` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."Car";

-- CreateTable
CREATE TABLE "Make" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Make_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Model" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "makeId" INTEGER NOT NULL,

    CONSTRAINT "Model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trim" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT,
    "engine" TEXT,
    "horsepower" INTEGER,
    "torque" INTEGER,
    "zeroToSixty" DECIMAL(4,2),
    "msrp" INTEGER,
    "mpgCity" INTEGER,
    "mpgHwy" INTEGER,
    "modelId" INTEGER NOT NULL,

    CONSTRAINT "Trim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "image" TEXT,
    "location" TEXT,
    "postedAt" TIMESTAMP(3),
    "trimId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceIngest" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "SourceIngest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Make_name_key" ON "Make"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Model_name_makeId_key" ON "Model"("name", "makeId");

-- CreateIndex
CREATE UNIQUE INDEX "Trim_year_name_modelId_key" ON "Trim"("year", "name", "modelId");

-- AddForeignKey
ALTER TABLE "Model" ADD CONSTRAINT "Model_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "Make"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trim" ADD CONSTRAINT "Trim_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_trimId_fkey" FOREIGN KEY ("trimId") REFERENCES "Trim"("id") ON DELETE SET NULL ON UPDATE CASCADE;
