"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Car = {
  id: string;
  make: string;
  model: string;
  year: number;
  priceUSD: number;
  horsepower?: number | null;
  zeroTo60?: number | null;
  imageUrl?: string | null;
};

type ApiResponse = {
  data: Car[];
  page: number;
  perPage: number;
  total: number;
};

function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function CarsPage() {
  // Filters + pagination
  const [make, setMake] = useState("");
  const [maxPrice, setMaxPrice] = useState<number>(200_000);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 12;

  const dMake = useDebounced(make, 250);
  const dQ = useDebounced(q, 250);
  const dMaxPrice = useDebounced(maxPrice, 250);

  // Data
  const [cars, setCars] = useState<Car[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / perPage)),
    [total, perPage]
  );

  useEffect(() => {
    // reset to first page when filters change
    setPage(1);
  }, [dMake, dQ, dMaxPrice]);

  useEffect(() => {
    const abort = new AbortController();
    const fetchCars = async () => {
      try {
        setLoading(true);
        setErr(null);
        const url = `/api/cars?maxPrice=${dMaxPrice}&make=${encodeURIComponent(
          dMake
        )}&q=${encodeURIComponent(dQ)}&page=${page}&perPage=${perPage}`;
        const res = await fetch(url, { signal: abort.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: ApiResponse = await res.json();
        setCars(json.data);
        setTotal(json.total);
      } catch (e: any) {
        if (e.name === "AbortError") return;
        setErr(e?.message || "Failed to load");
        setCars([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetchCars();
    return () => abort.abort();
  }, [dMake, dQ, dMaxPrice, page]);

  const prettyUsd = (n: number) =>
    n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Sports cars under {prettyUsd(maxPrice)}
              </h1>
              <p className="mt-2 text-gray-600">
                {total > 0 ? `${total} cars found` : 'Searching...'}
              </p>
            </div>
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </header>

        {/* Filters */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Cars</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">Make</label>
                <input
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  placeholder="e.g., Porsche"
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">Max Price</label>
                <input
                  type="number"
                  min={10_000}
                  step={1_000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value || 0))}
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              <div className="flex flex-col sm:col-span-2 lg:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Model, keywords… (e.g., Cayman, Z, 911)"
                  className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </section>

        {/* States */}
        {err && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <p className="font-medium">Failed to load cars</p>
            <p className="text-sm">{err}</p>
          </div>
        )}

        {/* Grid */}
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading && (!cars || cars.length === 0) &&
            Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-48 w-full animate-pulse bg-gray-200" />
                <div className="p-6">
                  <div className="h-6 w-3/5 animate-pulse rounded bg-gray-200 mb-3" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-gray-200 mb-2" />
                  <div className="h-5 w-2/5 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}

          {!loading && cars && cars.length === 0 && !err && (
            <div className="col-span-full bg-white rounded-2xl shadow-sm border border-gray-200 px-8 py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No cars match your filters</h3>
              <p className="text-gray-600">Try widening your search or adjusting your filters.</p>
            </div>
          )}

          {!loading &&
            cars &&
            cars.map((c) => (
              <Link
                key={c.id}
                href={`/cars/${c.id}`}
                className="group bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.imageUrl || "/placeholder.png"}
                  alt={`${c.make} ${c.model}`}
                  className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {c.make} {c.model}
                      </h3>
                      <p className="text-sm text-gray-600">{c.year}</p>
                    </div>
                    {c.priceUSD <= 200000 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        Under $200k
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Horsepower</span>
                      <span className="font-medium">{c.horsepower ?? "—"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">0-60 mph</span>
                      <span className="font-medium">{c.zeroTo60 ? `${c.zeroTo60}s` : "—"}</span>
                    </div>
                  </div>
                  
                  <div className="text-2xl font-bold text-gray-900">
                    {prettyUsd(c.priceUSD)}
                  </div>
                </div>
              </Link>
            ))}
        </section>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="mt-12 flex items-center justify-center">
            <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white transition-colors"
              >
                Next
              </button>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
