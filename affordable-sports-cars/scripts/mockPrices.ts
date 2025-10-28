import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const trims = await prisma.trim.findMany();
  for (const t of trims) {
    const fake = Math.round(35000 + Math.random() * 90000);
    await prisma.listing.upsert({
      where: { id: `mock-${t.id}` },
      update: { price: fake, source: "mock", title: `${t.name} (Mock)` },
      create: {
        id: `mock-${t.id}`,
        source: "mock",
        title: `${t.name} (Mock)`,
        price: fake,
        url: "https://example.com",
        image: "https://picsum.photos/800/500",
        trimId: t.id,
        postedAt: new Date(),
      },
    });
  }
  console.log("Mock prices added!");
}
main().finally(() => prisma.$disconnect());
