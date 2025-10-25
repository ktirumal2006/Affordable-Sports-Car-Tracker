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
