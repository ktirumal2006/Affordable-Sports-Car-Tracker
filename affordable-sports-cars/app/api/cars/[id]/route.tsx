import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Parse the ID to extract make, model, year, trim
  const parts = id.split('-');
  if (parts.length < 4) {
    return NextResponse.json({ error: "Invalid car ID format" }, { status: 400 });
  }
  
  const makeName = parts[0];
  const modelName = parts[1];
  const year = parseInt(parts[2]);
  const trimName = parts.slice(3).join('-');
  
  const trim = await prisma.trim.findFirst({
    where: {
      year: year,
      name: trimName,
      model: {
        name: modelName,
        make: {
          name: makeName,
        },
      },
    },
    include: {
      model: {
        include: {
          make: true,
        },
      },
    },
  });
  
  if (!trim) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }
  
  // Transform to match UI expectations
  const car = {
    id: id,
    make: trim.model.make.name,
    model: trim.model.name,
    year: trim.year,
    priceUSD: trim.msrp || 0,
    horsepower: trim.horsepower,
    zeroTo60: trim.zeroToSixty ? Number(trim.zeroToSixty) : null,
    imageUrl: null,
    listedAt: new Date().toISOString(),
    trim: trim.name,
    body: trim.body,
    engine: trim.engine,
    mpgCity: trim.mpgCity,
    mpgHwy: trim.mpgHwy,
  };
  
  return NextResponse.json(car);
}
