// scripts/fillTrimsFE.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function feVehicleIds(year: number, make: string, model: string): Promise<string[]> {
  const r = await fetch(
    `https://www.fueleconomy.gov/ws/rest/vehicle/menu/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`,
    { headers: { Accept: "application/json" } }
  );
  const j = await r.json().catch(() => ({} as any));
  const items = (j as any).menuItem || [];
  return Array.isArray(items) ? items.map((x: any) => String(x.value)) : [];
}

async function feVehicleDetail(id: string) {
  const r = await fetch(`https://www.fueleconomy.gov/ws/rest/vehicle/${id}`, { headers: { Accept: "application/json" } });
  return await r.json();
}

function isCar(vClass: string | undefined) {
  if (!vClass) return false;
  const s = vClass.toLowerCase();
  return /(coupe|sedan|hatch|convertible|roadster|fastback|liftback|wagon|two seater)/.test(s);
}

function trimName(v: any) {
  const parts = [
    v.model,                               // e.g., "718 Cayman"
    v.trany,                               // "Manual 6-spd" / "Auto(AM-S7)"
    v.displ ? `${v.displ}L` : null,        // displacement
    v.cylinders ? `${v.cylinders}cyl` : null,
  ].filter(Boolean);
  return parts.join(" ");
}

async function upsertMakeModel(makeName: string, modelName: string) {
  const make = await prisma.make.upsert({ where: { name: makeName }, update: {}, create: { name: makeName } });
  const model = await prisma.model.upsert({
    where: { name_makeId: { name: modelName, makeId: make.id } },
    update: {},
    create: { name: modelName, makeId: make.id },
  });
  return { model };
}

// Try common alias spellings FE uses
const MODEL_ALIASES: Record<string, string[]> = {
  "MX-5": ["MX-5 Miata", "MX-5", "Miata"],
  "GR86": ["GR86", "GT86", "86"],
  "370Z": ["370Z", "Z"],
  "Cayman": ["718 Cayman", "Cayman"],
  "Boxster": ["718 Boxster", "Boxster"],
  "Z4": ["Z4"],
  "Supra": ["Supra"],
  "BRZ": ["BRZ"],
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

async function main() {
  let total = 0;
  const startYear = 2008;
  const endYear = new Date().getFullYear();

  for (const { make, model } of HERO) {
    const { model: modelRow } = await upsertMakeModel(make, model);
    let insertedForModel = 0;

    const aliases = MODEL_ALIASES[model] ?? [model];

    for (let year = startYear; year <= endYear; year++) {
      for (const alias of aliases) {
        try {
          const ids = await feVehicleIds(year, make, alias);
          for (const id of ids) {
            const detail = await feVehicleDetail(id);
            const v = (detail as any).vehicle || {};

            if (!isCar(v.VClass || v.vClass)) continue;

            const name = trimName(v) || "Base";
            const hp = v.horsepower ? Number(v.horsepower) : null;
            const engine = [v.displ ? `${v.displ}L` : null, v.cylinders ? `${v.cylinders}cyl` : null]
              .filter(Boolean).join(" ").trim() || null;

            await prisma.trim.upsert({
              where: { year_name_modelId: { year, name, modelId: modelRow.id } },
              update: {
                body: (v.VClass || v.vClass) ?? undefined,
                engine: engine ?? undefined,
                horsepower: Number.isFinite(hp) ? hp : undefined,
                mpgCity: v.city08 ? Number(v.city08) : undefined,
                mpgHwy: v.highway08 ? Number(v.highway08) : undefined,
              },
              create: {
                year,
                name,
                body: (v.VClass || v.vClass) ?? null,
                engine: engine ?? null,
                horsepower: Number.isFinite(hp) ? hp : null,
                mpgCity: v.city08 ? Number(v.city08) : null,
                mpgHwy: v.highway08 ? Number(v.highway08) : null,
                modelId: modelRow.id,
              },
            });
            insertedForModel++;
            total++;
          }
        } catch {
          // skip alias/year on error
        }
      }
    }

    console.log(`Processed ${make} ${model}: +${insertedForModel} trims`);
  }

  console.log(`Done. Trims upserted/updated: ${total}`);
}

main().finally(() => prisma.$disconnect());
