# Affordable-Sports-Car-Tracker
# 🚗 Affordable Sports Cars
A full-stack web application that finds, ranks, and displays the most **affordable sports cars under $200,000** by price, horsepower, and performance.

---

## 🎯 Overview
Affordable Sports Cars helps enthusiasts and buyers **discover the best-value sports cars**.  
It combines a clean, responsive UI with a relational SQL backend that computes performance-per-dollar metrics.

**Core Features**
- Filter & sort cars by **price**, **horsepower**, **0–60 time**, and **year**
- “Value Score” = horsepower / price ranking
- Search by brand, model, or trim
- Leaderboards for “Best Value”, “Most Horsepower”, and “Quickest 0–60”
- (Optional) Price-trend charts and dealer locations

**Stack**
| Layer | Tech |
|-------|------|
| Frontend | **Next.js (App Router)**, **TailwindCSS**, **TanStack Query**, **Framer Motion**, **Recharts** |
| Backend (API) | **Next.js Route Handlers / Express-style**, **TypeScript**, **Zod**, **Prisma** |
| Database | **PostgreSQL** (Neon / Supabase) |
| Deployment | **Vercel** + CI/CD from GitHub |

---

## 🏗️ Architecture

- **Frontend** handles UI, filters, and charts.
- **Backend** validates queries, computes derived metrics, returns JSON.
- **Database** stores brands → models → trims → prices → dealers.

Caching: Prisma + HTTP cache headers + TanStack Query stale-while-revalidate.  
Analytics: materialized views refreshed nightly by serverless cron.

---

## 🎨 Frontend
### Pages
| Route | Purpose |
|--------|----------|
| `/` | Landing + featured leaderboards |
| `/cars` | Full searchable list |
| `/cars/[id]` | Trim details + specs + (Charts) |

### Components
`FilterBar`, `SortableTable`, `LeaderboardCard`, `TrendChart`, `Skeletons`

### UX
- Responsive Tailwind layout (`max-w-7xl`, `grid`, `gap-6`)
- Accessible controls (`focus-visible`, ARIA labels)
- Animated transitions (Framer Motion)
- Data fetching → `useQuery` / `useInfiniteQuery`
- URL-synced filters (`useSearchParams`)

---

## ⚙️ Backend API
| Endpoint | Description |
|-----------|--------------|
| `GET /api/cars` | List cars with filters, sorting, pagination |
| `GET /api/cars/[id]` | Single trim details + computed metrics |
| `GET /api/search` | Brand/model/trim search (FTS) |
| `GET /api/leaderboard` | Top value cars |
| `POST /api/admin/refresh` | Refresh materialized views (cron) |

**Key logic**
- Validate with Zod
- Compute `price_per_hp` and `value_score`
- Add pagination `{page,pageSize,total,hasNext}`
- Use `Cache-Control: s-maxage=300, stale-while-revalidate=86400`

---

## 🗄️ Database Schema (PostgreSQL + Prisma)
**Tables**

**Indexes**
- `trims(msrp)`, `trims(horsepower)`, `trims(zero_to_sixty)`
- `prices(trim_id, observed_at DESC)`

**Materialized View**
```sql
CREATE MATERIALIZED VIEW mv_leaderboard_value AS
SELECT t.trim_id,
       (t.horsepower::numeric / NULLIF(t.msrp,0)) AS value_score
FROM trims t
WHERE t.msrp <= 20000000
ORDER BY value_score DESC;
