// prisma/seed.ts
import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const brand = await prisma.brand.upsert({
    where: { name: "Porsche" },
    update: {},
    create: { name: "Porsche" },
  });

  const model = await prisma.model.create({
    data: {
      brand_id: brand.brand_id,
      name: "911 Carrera",
      body_style: "Coupe",
      year: 2024,
    },
  });

  const trim = await prisma.trim.create({
    data: {
      model_id: model.model_id,
      name: "Carrera Base",
      msrp: 119_900_00,      // cents
      horsepower: 379,
      torque: 331,
      // EITHER of these is fine for Decimal:
      // zero_to_sixty: new Prisma.Decimal(4.0),
      zero_to_sixty: new Prisma.Decimal("4.0"),
    },
  });

  await prisma.price.create({
    data: {
      trim_id: trim.trim_id,
      region: "US",
      price: 114_000_00,
      observed_at: new Date(),
    },
  });

  console.log("✅ Seeded Porsche 911 Carrera Base");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
