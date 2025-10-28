import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") ?? 1);
  const perPage = Math.min(Number(searchParams.get("perPage") ?? 12), 50);
  const maxPrice = Number(searchParams.get("maxPrice") ?? 200000);
  const make = (searchParams.get("make") ?? "").trim();
  const q = (searchParams.get("q") ?? "").trim();

  // 👇 Key fixes: explicit type + QueryMode enum
  const where: Prisma.CarWhereInput = {
    priceUSD: { lte: maxPrice },
    ...(make
      ? { make: { contains: make, mode: "insensitive" } }
      : {}),
    ...(q
      ? {
          OR: [
            { make:  { contains: q, mode: "insensitive" } },
            { model: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.car.findMany({
      where,
      orderBy: [{ priceUSD: "asc" }, { listedAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.car.count({ where }),
  ]);

  return NextResponse.json({ data, page, perPage, total });
}
