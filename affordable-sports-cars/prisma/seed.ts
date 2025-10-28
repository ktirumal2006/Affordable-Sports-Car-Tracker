import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with sports car examples...");

  // Create makes
  const porsche = await prisma.make.upsert({
    where: { name: "Porsche" },
    update: {},
    create: { name: "Porsche" },
  });

  const toyota = await prisma.make.upsert({
    where: { name: "Toyota" },
    update: {},
    create: { name: "Toyota" },
  });

  const bmw = await prisma.make.upsert({
    where: { name: "BMW" },
    update: {},
    create: { name: "BMW" },
  });

  const mazda = await prisma.make.upsert({
    where: { name: "Mazda" },
    update: {},
    create: { name: "Mazda" },
  });

  // Create models
  const caymanModel = await prisma.model.upsert({
    where: { 
      name_makeId: {
        name: "718 Cayman",
        makeId: porsche.id,
      }
    },
    update: {},
    create: {
      name: "718 Cayman",
      makeId: porsche.id,
    },
  });

  const supraModel = await prisma.model.upsert({
    where: { 
      name_makeId: {
        name: "GR Supra",
        makeId: toyota.id,
      }
    },
    update: {},
    create: {
      name: "GR Supra",
      makeId: toyota.id,
    },
  });

  const m2Model = await prisma.model.upsert({
    where: { 
      name_makeId: {
        name: "M2",
        makeId: bmw.id,
      }
    },
    update: {},
    create: {
      name: "M2",
      makeId: bmw.id,
    },
  });

  const miataModel = await prisma.model.upsert({
    where: { 
      name_makeId: {
        name: "MX-5 Miata",
        makeId: mazda.id,
      }
    },
    update: {},
    create: {
      name: "MX-5 Miata",
      makeId: mazda.id,
    },
  });

  // Create trims with detailed specs
  const caymanTrim = await prisma.trim.upsert({
    where: {
      year_name_modelId: {
        year: 2021,
        name: "Base",
        modelId: caymanModel.id,
      }
    },
    update: {},
    create: {
      year: 2021,
      name: "Base",
      body: "Coupe",
      engine: "4 cyl Turbo",
      horsepower: 300,
      torque: 280,
      zeroToSixty: 4.9,
      mpgCity: 20,
      mpgHwy: 27,
      modelId: caymanModel.id,
    },
  });

  const supraTrim = await prisma.trim.upsert({
    where: {
      year_name_modelId: {
        year: 2021,
        name: "3.0 Premium",
        modelId: supraModel.id,
      }
    },
    update: {},
    create: {
      year: 2021,
      name: "3.0 Premium",
      body: "Coupe",
      engine: "6 cyl Turbo",
      horsepower: 382,
      torque: 368,
      zeroToSixty: 3.9,
      mpgCity: 22,
      mpgHwy: 30,
      modelId: supraModel.id,
    },
  });

  const m2Trim = await prisma.trim.upsert({
    where: {
      year_name_modelId: {
        year: 2023,
        name: "Competition",
        modelId: m2Model.id,
      }
    },
    update: {},
    create: {
      year: 2023,
      name: "Competition",
      body: "Coupe",
      engine: "6 cyl Turbo",
      horsepower: 453,
      torque: 406,
      zeroToSixty: 3.9,
      mpgCity: 19,
      mpgHwy: 26,
      modelId: m2Model.id,
    },
  });

  const miataTrim = await prisma.trim.upsert({
    where: {
      year_name_modelId: {
        year: 2022,
        name: "Club",
        modelId: miataModel.id,
      }
    },
    update: {},
    create: {
      year: 2022,
      name: "Club",
      body: "Convertible",
      engine: "4 cyl",
      horsepower: 181,
      torque: 151,
      zeroToSixty: 5.7,
      mpgCity: 26,
      mpgHwy: 35,
      modelId: miataModel.id,
    },
  });

  console.log("✅ Seeded database with sports car examples:");
  console.log(`- ${porsche.name} ${caymanModel.name} ${caymanTrim.year} ${caymanTrim.name}`);
  console.log(`- ${toyota.name} ${supraModel.name} ${supraTrim.year} ${supraTrim.name}`);
  console.log(`- ${bmw.name} ${m2Model.name} ${m2Trim.year} ${m2Trim.name}`);
  console.log(`- ${mazda.name} ${miataModel.name} ${miataTrim.year} ${miataTrim.name}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
