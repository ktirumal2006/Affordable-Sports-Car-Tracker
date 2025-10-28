import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// --- tiny XML helpers (regex-based; good enough for FE's simple XML) ---
function getTag(text: string, tag: string): string[] {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "gi");
  const out: string[] = [];
  let m;
  while ((m = re.exec(text))) out.push(m[1].trim());
  return out;
}
function getFirstTag(text: string, tag: string): string | null {
  const m = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i").exec(text);
  return m ? m[1].trim() : null;
}

async function feMenuOptions(year: number, make: string, model: string): Promise<string[]> {
  const url = `https://www.fueleconomy.gov/ws/rest/vehicle/menu/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`;
  const res = await fetch(url);                 // no Accept → XML
  const xml = await res.text();
  if (!res.ok) {
    console.log(`[opts] ${year} ${make} ${model} -> ${res.status}`);
    return [];
  }
  const ids = getTag(xml, "value");             // grab <value>…</value>
  if (ids.length === 0) {
    console.log(`[opts] empty for ${year} ${make} ${model}`);
  }
  return ids;
}

async function feVehicleDetailXml(id: string) {
  const res = await fetch(`https://www.fueleconomy.gov/ws/rest/vehicle/${id}`);
  const xml = await res.text();
  if (!res.ok) {
    console.log(`[detail] ${id} -> ${res.status}`);
    return null as any;
  }
  // extract useful fields
  const v: any = {};
  const first = (t: string) => getFirstTag(xml, t);
  v.make       = first("make");
  v.model      = first("model");
  v.trany      = first("trany");
  v.displ      = Number(first("displ") || "");
  v.cylinders  = Number(first("cylinders") || "");
  v.horsepower = Number(first("horsepower") || "");
  v.city08     = Number(first("city08") || "");
  v.highway08  = Number(first("highway08") || "");
  v.vclass     = first("VClass") || first("vClass");
  return v;
}

function isCar(vclass?: string | null) {
  const s = (vclass || "").toLowerCase();
  return /(coupe|sedan|hatch|convertible|roadster|fastback|liftback|wagon|two seater)/.test(s);
}

function trimNameFrom(v: any) {
  const parts = [v.model, v.trany, v.displ ? `${v.displ}L` : null, v.cylinders ? `${v.cylinders}cyl` : null].filter(Boolean);
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

// FE’s model spellings
const MODEL_ALIASES: Record<string, string[]> = {
  "Cayman":  ["718 Cayman", "Cayman"],
  "Boxster": ["718 Boxster", "Boxster"],
  "Supra":   ["Supra"],
  "Z4":      ["Z4"],
  "BRZ":     ["BRZ"],
  "MX-5":    ["MX-5 Miata", "MX-5", "Miata"],
  "370Z":    ["370Z", "Z"],
};

const HERO: Array<{ make: string; model: string; storeModel?: string }> = [
  { make: "Porsche", model: "Cayman",  storeModel: "Cayman" },
  { make: "Porsche", model: "Boxster", storeModel: "Boxster" },
  { make: "Toyota",  model: "Supra" },
  { make: "BMW",     model: "Z4" },
  { make: "Subaru",  model: "BRZ" },
  { make: "Mazda",   model: "MX-5",    storeModel: "MX-5" },
  { make: "Nissan",  model: "370Z" },
];

async function main() {
  let total = 0;
  const start = 2008, end = new Date().getFullYear();

  for (const { make, model, storeModel } of HERO) {
    const { model: modelRow } = await upsertMakeModel(make, storeModel || model);
    const aliases = MODEL_ALIASES[model] || [model];
    let insertedForModel = 0;

    for (let year = start; year <= end; year++) {
      for (const alias of aliases) {
        const ids = await feMenuOptions(year, make, alias);
        for (const id of ids) {
          const v = await feVehicleDetailXml(id);
          if (!v || !isCar(v.vclass)) continue;

          const name = trimNameFrom(v) || "Base";
          const engine = [v.displ ? `${v.displ}L` : null, v.cylinders ? `${v.cylinders}cyl` : null]
            .filter(Boolean).join(" ").trim() || null;
          const hp = Number.isFinite(v.horsepower) && v.horsepower > 0 ? v.horsepower : null;

          await prisma.trim.upsert({
            where: { year_name_modelId: { year, name, modelId: modelRow.id } },
            update: {
              body: v.vclass ?? undefined,
              engine: engine ?? undefined,
              horsepower: hp ?? undefined,
              mpgCity: Number.isFinite(v.city08) ? v.city08 : undefined,
              mpgHwy: Number.isFinite(v.highway08) ? v.highway08 : undefined,
            },
            create: {
              year,
              name,
              body: v.vclass ?? null,
              engine: engine ?? null,
              horsepower: hp,
              mpgCity: Number.isFinite(v.city08) ? v.city08 : null,
              mpgHwy: Number.isFinite(v.highway08) ? v.highway08 : null,
              modelId: modelRow.id,
            },
          });
          insertedForModel++;
          total++;
        }
      }
    }
    console.log(`Processed ${make} ${model}: +${insertedForModel} trims`);
  }

  console.log(`Done. Trims upserted/updated: ${total}`);
}

main().finally(() => prisma.$disconnect());
