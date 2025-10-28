// app/cars/page.tsx
import { prisma } from "@/lib/db";

function formatUsdFromCents(cents: number | null | undefined) {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function valueScore(hp: number, cents: number | null | undefined) {
  const price = cents ?? 0;
  if (!hp || !price) return "—";
  const score = hp / (price / 1000); // HP per $1k
  return score.toFixed(2);
}

export default async function CarsPage() {
  const trims = await prisma.trim.findMany({
    take: 50,
    include: {
      model: { include: { brand: true } },
      prices: { take: 1, orderBy: { observed_at: "desc" } },
    },
    orderBy: { msrp: "asc" },
  });

  const cars = trims.map((t) => ({
    trim_id: t.trim_id,
    brand: t.model.brand.name,
    model: t.model.name,
    year: t.model.year,
    name: t.name,
    msrp_cents: t.msrp,
    horsepower: t.horsepower,
    latest_price_cents: t.prices[0]?.price ?? null,
  }));

  return (
    <main className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">All Cars</h1>
      <p className="mt-2 text-gray-400">Seeded sample shown; filters/sorting coming next.</p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5">
            <tr className="[&>th]:px-4 [&>th]:py-3 text-left text-gray-300">
              <th>Car</th>
              <th>Trim</th>
              <th>HP</th>
              <th>MSRP</th>
              <th>Latest Price</th>
              <th>Value (HP / $1k)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {cars.map((c) => {
              const price = c.latest_price_cents ?? c.msrp_cents;
              return (
                <tr key={c.trim_id} className="[&>td]:px-4 [&>td]:py-3">
                  <td className="font-medium text-white">
                    {c.brand} {c.model}{" "}
                    <span className="text-gray-400">({c.year})</span>
                  </td>
                  <td className="text-gray-200">{c.name}</td>
                  <td className="text-gray-200">{c.horsepower.toLocaleString()}</td>
                  <td className="text-gray-200">{formatUsdFromCents(c.msrp_cents)}</td>
                  <td className="text-gray-200">{formatUsdFromCents(c.latest_price_cents)}</td>
                  <td className="text-gray-200">{valueScore(c.horsepower, price)}</td>
                </tr>
              );
            })}
            {cars.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No cars yet — run <code className="text-white">npx prisma db seed</code>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
