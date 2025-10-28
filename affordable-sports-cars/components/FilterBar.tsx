"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type FilterBarProps = {
  makes: string[];
  initial: {
    make?: string;
    q?: string;
    maxPrice?: number;
    yearMin?: number;
    yearMax?: number;
    sort?: "price-asc" | "price-desc";
  };
};

export default function FilterBar({ makes, initial }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Local state for debounced search
  const [searchValue, setSearchValue] = useState(initial.q || "");
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Update URL with new filters
  const updateFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Apply updates
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    // Always reset to page 1 when filters change
    params.set("page", "1");
    
    router.push(`/cars?${params.toString()}`, { scroll: false });
  };

  // Handle search input with debouncing
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      updateFilters({ q: value });
    }, 400);
  };

  // Handle immediate filter changes (non-debounced)
  const handleFilterChange = (key: string, value: string) => {
    updateFilters({ [key]: value });
  };

  // Reset all filters
  const handleReset = () => {
    setSearchValue("");
    const params = new URLSearchParams();
    params.set("page", "1");
    router.push(`/cars?${params.toString()}`, { scroll: false });
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <section className="mb-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Filter Cars</h2>
          <button
            type="button"
            onClick={handleReset}
            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-md border border-gray-300 hover:border-gray-400 transition-colors"
          >
            Reset filters
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Make selector */}
          <div className="flex flex-col">
            <label htmlFor="make" className="text-sm font-medium text-gray-700 mb-2">
              Make
            </label>
            <select
              id="make"
              name="make"
              value={initial.make || ""}
              onChange={(e) => handleFilterChange("make", e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors bg-white"
            >
              <option value="">All makes</option>
              {makes.map((make) => (
                <option key={make} value={make}>
                  {make}
                </option>
              ))}
            </select>
          </div>

          {/* Search input */}
          <div className="flex flex-col sm:col-span-2 lg:col-span-1">
            <label htmlFor="q" className="text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              id="q"
              name="q"
              type="text"
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Model, trim… (e.g., Boxster)"
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Max Price */}
          <div className="flex flex-col">
            <label htmlFor="maxPrice" className="text-sm font-medium text-gray-700 mb-2">
              Max Price
            </label>
            <input
              id="maxPrice"
              name="maxPrice"
              type="number"
              min={5000}
              step={5000}
              value={initial.maxPrice || 200000}
              onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Year Min */}
          <div className="flex flex-col">
            <label htmlFor="yearMin" className="text-sm font-medium text-gray-700 mb-2">
              Year Min
            </label>
            <input
              id="yearMin"
              name="yearMin"
              type="number"
              min={1990}
              max={2099}
              step={1}
              value={initial.yearMin || ""}
              onChange={(e) => handleFilterChange("yearMin", e.target.value)}
              placeholder="e.g., 2015"
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Year Max */}
          <div className="flex flex-col">
            <label htmlFor="yearMax" className="text-sm font-medium text-gray-700 mb-2">
              Year Max
            </label>
            <input
              id="yearMax"
              name="yearMax"
              type="number"
              min={1990}
              max={2099}
              step={1}
              value={initial.yearMax || ""}
              onChange={(e) => handleFilterChange("yearMax", e.target.value)}
              placeholder="e.g., 2025"
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Sort */}
          <div className="flex flex-col">
            <label htmlFor="sort" className="text-sm font-medium text-gray-700 mb-2">
              Sort by
            </label>
            <select
              id="sort"
              name="sort"
              value={initial.sort || "price-asc"}
              onChange={(e) => handleFilterChange("sort", e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors bg-white"
            >
              <option value="price-asc">Best price (Low to High)</option>
              <option value="price-desc">Highest price (High to Low)</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}

