// app/api/cars/route.ts
import { prisma } from "@/lib/db";

export async function GET() {
  const trims = await prisma.trim.findMany({
    take: 10,
    include: {
      model: { include: { brand: true } },
      prices: { take: 1, orderBy: { observed_at: "desc" } },
    },
    orderBy: { msrp: "asc" },
  });

  const data = trims.map(t => ({
    trim_id: t.trim_id,
    brand: t.model.brand.name,
    model: t.model.name,
    year: t.model.year,
    name: t.name,
    msrp_cents: t.msrp,
    horsepower: t.horsepower,
    latest_price_cents: t.prices[0]?.price ?? null,
  }));

  return Response.json({ count: data.length, trims: data });
}
