-- CreateTable
CREATE TABLE "Brand" (
    "brand_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("brand_id")
);

-- CreateTable
CREATE TABLE "Model" (
    "model_id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "body_style" TEXT,
    "year" INTEGER NOT NULL,

    CONSTRAINT "Model_pkey" PRIMARY KEY ("model_id")
);

-- CreateTable
CREATE TABLE "Trim" (
    "trim_id" SERIAL NOT NULL,
    "model_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "msrp" INTEGER NOT NULL,
    "horsepower" INTEGER NOT NULL,
    "torque" INTEGER,
    "zero_to_sixty" DECIMAL(65,30),

    CONSTRAINT "Trim_pkey" PRIMARY KEY ("trim_id")
);

-- CreateTable
CREATE TABLE "Price" (
    "price_id" SERIAL NOT NULL,
    "trim_id" INTEGER NOT NULL,
    "region" TEXT,
    "price" INTEGER NOT NULL,
    "observed_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Price_pkey" PRIMARY KEY ("price_id")
);

-- CreateTable
CREATE TABLE "Dealer" (
    "dealer_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,

    CONSTRAINT "Dealer_pkey" PRIMARY KEY ("dealer_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- CreateIndex
CREATE INDEX "Model_brand_id_year_idx" ON "Model"("brand_id", "year");

-- CreateIndex
CREATE INDEX "Trim_msrp_idx" ON "Trim"("msrp");

-- CreateIndex
CREATE INDEX "Trim_horsepower_idx" ON "Trim"("horsepower");

-- CreateIndex
CREATE INDEX "Price_trim_id_observed_at_idx" ON "Price"("trim_id", "observed_at" DESC);

-- AddForeignKey
ALTER TABLE "Model" ADD CONSTRAINT "Model_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "Brand"("brand_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trim" ADD CONSTRAINT "Trim_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "Model"("model_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Price" ADD CONSTRAINT "Price_trim_id_fkey" FOREIGN KEY ("trim_id") REFERENCES "Trim"("trim_id") ON DELETE RESTRICT ON UPDATE CASCADE;
