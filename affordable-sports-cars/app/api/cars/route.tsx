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

  // Build where clause for Trim model with Make/Model relations
  const where: Prisma.TrimWhereInput = {
    msrp: { lte: maxPrice },
    ...(make
      ? { 
          model: {
            make: { name: { contains: make, mode: "insensitive" } }
          }
        }
      : {}),
    ...(q
      ? {
          OR: [
            { 
              model: {
                make: { name: { contains: q, mode: "insensitive" } }
              }
            },
            { 
              model: { name: { contains: q, mode: "insensitive" } }
            },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.trim.findMany({
      where,
      include: {
        model: {
          include: {
            make: true,
          },
        },
      },
      orderBy: [
        { msrp: "asc" },
        { year: "desc" },
      ],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.trim.count({ where }),
  ]);

  // Transform data to match existing UI expectations
  const transformedData = data.map(trim => ({
    id: `${trim.model.make.name}-${trim.model.name}-${trim.year}-${trim.name}`.toLowerCase(),
    make: trim.model.make.name,
    model: trim.model.name,
    year: trim.year,
    priceUSD: trim.msrp || 0,
    horsepower: trim.horsepower,
    zeroTo60: trim.zeroToSixty ? Number(trim.zeroToSixty) : null,
    imageUrl: null, // Will be populated later with marketplace listings
    listedAt: new Date().toISOString(),
    trim: trim.name,
    body: trim.body,
    engine: trim.engine,
    mpgCity: trim.mpgCity,
    mpgHwy: trim.mpgHwy,
  }));

  return NextResponse.json({ data: transformedData, page, perPage, total });
}
