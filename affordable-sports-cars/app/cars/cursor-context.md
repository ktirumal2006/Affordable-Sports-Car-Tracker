# Affordable Sports Cars — Cursor Project Context

## Mission
Build a clean, credible MVP that lists sports cars under $200k with real data from a live Postgres DB. Prioritize a professional look, fast perceived performance, and clear “room to grow” cues (roadmap, disabled future features).

## Tech & Constraints
- Framework: Next.js 16 (App Router), TypeScript, Tailwind CSS.
- Data: PostgreSQL via Prisma ORM.
- API: Route handlers at `/api/cars` and `/api/cars/[id]` (Node runtime).
- No server component styling libraries; Tailwind only.
- Keep code minimal and readable; avoid over-engineering.

## Data Model (Prisma)
model Car {
  id         String   @id @default(cuid())
  make       String
  model      String
  year       Int
  priceUSD   Int
  horsepower Int?
  zeroTo60   Float?
  imageUrl   String?
  listedAt   DateTime @default(now())
}

## API Contracts
GET /api/cars
- Query: page (1), perPage (12), maxPrice (default 200000), make (string), q (string)
- Returns: { data: Car[], page, perPage, total }

GET /api/cars/[id]
- Returns: Car or 404 { error: "Not found" }

## Current Pages
- `/` (Landing): needs hero, value props, roadmap
- `/cars` (List): has filters + grid, needs premium styling
- `/cars/[id]` (Detail): functional, needs layout polish

## UX Goals
- Mobile-first; align to an 8px spacing grid.
- Cards: rounded-2xl, soft shadow, hover lift, clean meta line.
- Filters: make, max price, search; sticky on desktop; compact on mobile.
- States: consistent skeletons; gentle empty and error messages.
- Typography: system fonts; title sizes 2xl→xl; body base; meta sm.

## Visual Aesthetic
- Minimal, modern, “pricing dashboard” feel.
- Neutral grays; blue accents for links/CTAs; one accent green tag for “Under $200k.”
- Avoid visual noise; emphasize price and model.

## Non-Goals (MVP)
- Auth, user accounts, scrapers, alerts — show as “coming soon.”
- Dark mode (prepare tokens, don’t implement).
- Charts (placeholder section only).

## Accessibility
- All inputs have labels and visible focus rings.
- Image alts are meaningful.
- Keyboard navigation works across cards and filters.

## Performance
- Use loading skeletons (already present).
- Avoid layout shift (stable image containers).
- Paginate 12 cards per page; include Prev/Next controls.

## Copy Snippets
- Tagline: “Find the best sports cars under $200k — fast.”
- Value cards: “Clean filters”, “Specs at a glance”, “Market trends (coming soon)”.
- Empty state: “No cars match your filters yet. Try widening your search.”
- Roadmap: Alerts, Trend charts, Saved lists, ETL imports.

## Acceptance Criteria (MVP-UI)
- All three pages look cohesive and responsive.
- Filters are obvious and sticky on desktop.
- Car cards are fully clickable and visually premium.
- Lighthouse Accessibility ≥ 90, Best Practices ≥ 90.
- No console errors; no unstyled content flash.

## Code Style
- Tailwind utility-first; keep class lists readable.
- Prefer semantic HTML elements (header, main, section, nav).
- Keep components small and named by role (e.g., CarCard, FiltersBar).
- Avoid heavy new deps; no CSS frameworks beyond Tailwind.

## After MVP (for roadmap display only)
- Data import page (/admin/import) with CSV.
- Price history & trend charts via Recharts.
- Price-drop alerts (disabled button present on detail page).
