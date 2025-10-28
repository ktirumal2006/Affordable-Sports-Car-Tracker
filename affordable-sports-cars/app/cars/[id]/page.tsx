"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Car = {
  id: string;
  make: string;
  model: string;
  year: number;
  priceUSD: number;
  horsepower?: number | null;
  zeroTo60?: number | null;
  imageUrl?: string | null;
  listedAt: string;
};

export default function CarDetailPage() {
  const params = useParams();
  const carId = params.id as string;
  
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCar = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/cars/${carId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Car not found");
          } else {
            throw new Error(`HTTP ${res.status}`);
          }
          return;
        }
        const data = await res.json();
        setCar(data);
      } catch (e: any) {
        setError(e?.message || "Failed to load car");
      } finally {
        setLoading(false);
      }
    };

    if (carId) {
      fetchCar();
    }
  }, [carId]);

  const prettyUsd = (n: number) =>
    n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-gray-200 rounded mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded-2xl" />
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4" />
                <div className="h-6 bg-gray-200 rounded w-1/2" />
                <div className="h-12 bg-gray-200 rounded w-1/3" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Car Not Found</h1>
          <p className="text-gray-600 mb-6">{error || "The car you're looking for doesn't exist."}</p>
          <Link
            href="/cars"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Browse All Cars
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/cars" className="hover:text-gray-900 transition-colors">Cars</Link>
            <span>/</span>
            <span className="text-gray-900">{car.make} {car.model}</span>
          </div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={car.imageUrl || "/placeholder.png"}
                alt={`${car.make} ${car.model}`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {car.make} {car.model}
                  </h1>
                  <p className="text-lg text-gray-600">{car.year}</p>
                </div>
                {car.priceUSD <= 200000 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                    Under $200k
                  </span>
                )}
              </div>
              
              <div className="text-4xl font-bold text-gray-900 mb-6">
                {prettyUsd(car.priceUSD)}
              </div>
            </div>

            {/* Specs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Specifications</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Year</span>
                  <span className="font-medium">{car.year}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Make</span>
                  <span className="font-medium">{car.make}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Model</span>
                  <span className="font-medium">{car.model}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Horsepower</span>
                  <span className="font-medium">{car.horsepower ?? "—"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">0-60 mph</span>
                  <span className="font-medium">{car.zeroTo60 ? `${car.zeroTo60}s` : "—"}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Listed</span>
                  <span className="font-medium">
                    {new Date(car.listedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <button
                disabled
                className="w-full bg-gray-100 text-gray-400 px-6 py-3 rounded-lg font-medium cursor-not-allowed"
              >
                Set Price Alert (Coming Soon)
              </button>
              <button
                disabled
                className="w-full border border-gray-300 text-gray-400 px-6 py-3 rounded-lg font-medium cursor-not-allowed"
              >
                Save to List (Coming Soon)
              </button>
            </div>

            {/* Additional Info */}
            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Coming Soon</h3>
              <p className="text-blue-800 text-sm">
                We're working on price alerts, trend charts, and saved lists to help you track 
                your favorite cars and get notified of price changes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
