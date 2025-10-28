// app/api/cars/[id]/route.ts
import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const trim = await prisma.trim.findUnique({
    where: { trim_id: id },
    include: {
      model: { include: { brand: true } },
      prices: { orderBy: { observed_at: "desc" }, take: 10 },
    },
  });
  if (!trim) return new Response("Not found", { status: 404 });
  return Response.json(trim);
}
