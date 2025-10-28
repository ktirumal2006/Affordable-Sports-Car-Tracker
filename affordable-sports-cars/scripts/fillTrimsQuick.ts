// scripts/fillTrimsQuick.ts
// Quick filler to guarantee non-zero Trim rows using CarQuery with a FuelEconomy fallback.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// --- Helpers ---------------------------------------------------------------

function mapCQTrim(t: any) {
  const hp = t.model_engine_power_ps ? Math.round(Number(t.model_engine_power_ps) * 0.986323) : null;
  const engine = [t.model_engine_cc && `${t.model_engine_cc}cc`, t.model_engine_type].filter(Boolean).join(" ").trim() || null;
  return {
    year: Number(t.model_year),
    name: (t.model_trim || "Base").trim(),
    body: t.model_body || null,
    engine,
    horsepower: hp,
  };
}

async function fetchCarQueryTrims(make: string, model: string) {
  // CarQuery is picky about names; allow both raw and normalized attempts.
  const attempts = [
    `https://www.carqueryapi.com/api/0.3/?cmd=getTrims&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&sold_in_us=1`,
    `https://www.carqueryapi.com/api/0.3/?cmd=getTrims&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`
  ];
  for (const url of attempts) {
    try {
      const r = await fetch(url, { headers: { Accept: "application/json" } });
      const j = await r.json();
      const list = Array.isArray(j.Trims) ? j.Trims.map(mapCQTrim).filter((x: any) => Number.isFinite(x.year) && x.year >= 2000) : [];
      if (list.length) return list;
    } catch {
      // try next attempt
    }
  }
  return [];
}

// FuelEconomy.gov fallback: build "trim-ish" rows from options and details
async function feVehicleIds(year: number, make: string, model: string): Promise<string[]> {
  const r = await fetch(
    `https://www.fueleconomy.gov/ws/rest/vehicle/menu/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`,
    { headers: { Accept: "application/json" } }
  );
  const j = await r.json();
  const items = j.menuItem || [];
  return Array.isArray(items) ? items.map((x: any) => String(x.value)) : [];
}

async function feVehicleDetail(id: string) {
  const r = await fetch(`https://www.fueleconomy.gov/ws/rest/vehicle/${id}`, { headers: { Accept: "application/json" } });
  return await r.json();
}

function deriveTrimNameFromFE(v: any) {
  // Try to make a readable trim name from FE fields
  const pieces = [
    v.make,
    v.model,
    v.trany, // transmission (e.g., "Manual 6-spd")
    v.displ ? `${v.displ}L` : null,
    v.cylinders ? `${v.cylinders}cyl` : null,
  ].filter(Boolean);
  return pieces.join(" ");
}

async function fetchFuelEconomyTrims(make: string, model: string) {
  const results: any[] = [];
  // Reasonable modern range; adjust as needed
  for (let year = 2008; year <= new Date().getFullYear(); year++) {
    try {
      const ids = await feVehicleIds(year, make, model);
      for (const id of ids) {
        const detail = await feVehicleDetail(id);
        const v = detail.vehicle || {};
        // Only keep cars; FE includes some non-cars too
        const cls = (v.VClass || v.vClass || "").toLowerCase();
        const isCar = /(coupe|sedan|hatchback|convertible|roadster|liftback|fastback|wagon)/.test(cls);
        if (!isCar) continue;

        const name = deriveTrimNameFromFE(v);
        const hp = v.horsepower ? Number(v.horsepower) : null;
        const body = v.VClass || v.vClass || null;
        const engine = [v.displ ? `${v.displ}L` : null, v.cylinders ? `${v.cylinders}cyl` : null].filter(Boolean).join(" ").trim() || null;

        results.push({
          year,
          name: name || "Base",
          body,
          engine,
          horsepower: Number.isFinite(hp) ? hp : null,
          mpgCity: v.city08 ? Number(v.city08) : null,
          mpgHwy: v.highway08 ? Number(v.highway08) : null,
        });
      }
    } catch {
      // skip year on error
    }
  }
  return results;
}

async function upsertMakeModel(makeName: string, modelName: string) {
  const make = await prisma.make.upsert({
    where: { name: makeName },
    update: {},
    create: { name: makeName },
  });
  const model = await prisma.model.upsert({
    where: { name_makeId: { name: modelName, makeId: make.id } },
    update: {},
    create: { name: modelName, makeId: make.id },
  });
  return { make, model };
}

// Some models have alternate official strings between APIs
const MODEL_ALIASES: Record<string, string[]> = {
  "MX-5": ["MX-5", "MX-5 Miata", "Miata"],
  "GR86": ["GR86", "86", "GT86"],
  "370Z": ["370Z", "Z"],
  "BRZ": ["BRZ"],
  "Cayman": ["Cayman", "718 Cayman"],
  "Boxster": ["Boxster", "718 Boxster"],
  "Z4": ["Z4"],
  "Supra": ["Supra"],
};

const HERO: Array<{ make: string; model: string }> = [
  { make: "Porsche", model: "Cayman" },
  { make: "Porsche", model: "Boxster" },
  { make: "Toyota", model: "Supra" },
  { make: "BMW", model: "Z4" },
  { make: "Subaru", model: "BRZ" },
  { make: "Mazda", model: "MX-5" },
  { make: "Nissan", model: "370Z" },
];

// --- Main -------------------------------------------------------------------

async function main() {
  let total = 0;

  for (const { make, model } of HERO) {
    const { model: modelRow } = await upsertMakeModel(make, model);

    // Try CarQuery for all alias spellings
    let trims: any[] = [];
    for (const alias of (MODEL_ALIASES[model] || [model])) {
      const got = await fetchCarQueryTrims(make, alias);
      trims.push(...got);
    }

    // If CarQuery came back empty, fall back to FuelEconomy.gov
    if (trims.length === 0) {
      for (const alias of (MODEL_ALIASES[model] || [model])) {
        const fe = await fetchFuelEconomyTrims(make, alias);
        trims.push(...fe);
      }
    }

    // Deduplicate by (year, name)
    const seen = new Set<string>();
    trims = trims.filter(t => {
      const k = `${t.year}|${t.name}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    // Upsert
    let inserted = 0;
    for (const t of trims) {
      await prisma.trim.upsert({
        where: { year_name_modelId: { year: t.year, name: t.name, modelId: modelRow.id } },
        update: {
          body: t.body ?? undefined,
          engine: t.engine ?? undefined,
          horsepower: t.horsepower ?? undefined,
          mpgCity: t.mpgCity ?? undefined,
          mpgHwy: t.mpgHwy ?? undefined,
        },
        create: { year: t.year, name: t.name, body: t.body ?? null, engine: t.engine ?? null, horsepower: t.horsepower ?? null, mpgCity: (t as any).mpgCity ?? null, mpgHwy: (t as any).mpgHwy ?? null, modelId: modelRow.id },
      });
      inserted++;
    }

    total += inserted;
    console.log(`Processed ${make} ${model}: +${inserted} trims`);
  }

  console.log(`Done. Trims upserted/updated: ${total}`);
}

main().finally(() => prisma.$disconnect());
