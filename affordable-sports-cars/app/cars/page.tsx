import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "../../lib/prisma";
import CarCard from "../../components/CarCard";
import Pagination from "../../components/Pagination";
import FilterBar from "../../components/FilterBar";

type CarsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function prettyUsd(n: number) {
  return n.toLocaleString(undefined, { 
    style: "currency", 
    currency: "USD", 
    maximumFractionDigits: 0 
  });
}

async function CarsGrid({ 
  make,
  q,
  maxPrice,
  yearMin,
  yearMax,
  sort,
  page,
  pageSize,
}: { 
  make?: string;
  q?: string;
  maxPrice: number;
  yearMin: number;
  yearMax: number;
  sort: "price-asc" | "price-desc";
  page: number;
  pageSize: number;
}) {
  // Build WHERE clause
  const whereConditions: any[] = [];

  // Year range filter
  whereConditions.push({ year: { gte: yearMin, lte: yearMax } });

  // Make filter
  if (make) {
    whereConditions.push({
      model: {
        make: {
          name: { equals: make, mode: 'insensitive' as const }
        }
      }
    });
  }

  // Search query filter
  if (q) {
    whereConditions.push({
      OR: [
        {
          model: {
            name: { contains: q, mode: 'insensitive' as const }
          }
        },
        {
          name: { contains: q, mode: 'insensitive' as const }
        }
      ]
    });
  }

  const where = {
    AND: whereConditions,
    OR: [
      { msrp: { lte: maxPrice } },
      { 
        AND: [
          { msrp: null },
          { listings: { some: { price: { lte: maxPrice } } } }
        ]
      }
    ]
  };

  // Build ORDER BY clause
  const orderBy = sort === "price-desc"
    ? [
        { msrp: 'desc' as const },
        { year: 'desc' as const },
        { model: { make: { name: 'asc' as const } } },
        { model: { name: 'asc' as const } }
      ]
    : [
        { msrp: 'asc' as const },
        { year: 'desc' as const },
        { model: { make: { name: 'asc' as const } } },
        { model: { name: 'asc' as const } }
      ];

  // Query with pagination
  const [total, trims] = await Promise.all([
    prisma.trim.count({
      where: {
        AND: whereConditions,
        OR: [
          { msrp: { lte: maxPrice } },
          { 
            AND: [
              { msrp: null },
              { listings: { some: { price: { lte: maxPrice } } } }
            ]
          }
        ]
      }
    }),
    prisma.trim.findMany({
      where,
      distinct: ['year', 'modelId'],
      include: {
        model: {
          include: {
            make: true
          }
        },
        listings: {
          select: {
            price: true,
            image: true,
            url: true
          },
          where: {
            price: { lte: maxPrice }
          },
          orderBy: {
            price: 'asc'
          },
          take: 1
        }
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Transform to CarCardData
  const cars = trims.map((trim) => {
    const minPrice = trim.listings[0]?.price || trim.msrp || null;
    return {
      trimId: trim.id,
      year: trim.year,
      makeName: trim.model.make.name,
      modelName: trim.model.name,
      trimName: trim.name,
      minPrice,
      image: trim.imageUrl || trim.listings[0]?.image || null,
      url: trim.listings[0]?.url || null,
      horsepower: trim.horsepower,
      mpgCity: trim.mpgCity,
      mpgHwy: trim.mpgHwy,
    };
  });

  if (cars.length === 0) {
    return (
      <div className="col-span-full bg-white rounded-2xl shadow-sm border border-gray-200 px-8 py-16 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No cars match your filters</h3>
        <p className="text-gray-600">Try widening your search or adjusting your filters.</p>
      </div>
    );
  }

  return (
    <>
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cars.map((car) => (
          <CarCard key={car.trimId} car={car} />
        ))}
      </section>

      <Pagination
        page={page}
        totalPages={totalPages}
        make={make}
        q={q}
        maxPrice={maxPrice}
        yearMin={yearMin}
        yearMax={yearMax}
        sort={sort}
      />
    </>
  );
}

function CarsGridSkeleton() {
  return (
    <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-48 w-full animate-pulse bg-gray-200" />
          <div className="p-6">
            <div className="h-6 w-3/5 animate-pulse rounded bg-gray-200 mb-3" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-gray-200 mb-2" />
            <div className="h-5 w-2/5 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </section>
  );
}

export default async function CarsPage({ searchParams }: CarsPageProps) {
  // Await and normalize search params
  const sp = await searchParams;
  const get = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]) || '';
  
  const make = get('make') || undefined;
  const q = get('q') || undefined;
  const maxPrice = parseInt(get('maxPrice') || '200000', 10);
  const yearMin = parseInt(get('yearMin') || '1990', 10);
  const yearMax = parseInt(get('yearMax') || '2099', 10);
  const sort = (get('sort') as 'price-asc' | 'price-desc' | '') || 'price-asc';
  const page = Math.max(1, parseInt(get('page') || '1', 10));
  const pageSize = 24;

  // Fetch list of makes for the filter bar
  const makes = (
    await prisma.make.findMany({
      select: { name: true },
      orderBy: { name: 'asc' }
    })
  ).map(m => m.name);

  // Get quick count for header
  const totalCount = await prisma.trim.count({
    where: {
      year: { gte: yearMin, lte: yearMax },
      OR: [
        { msrp: { lte: maxPrice } },
        { 
          AND: [
            { msrp: null },
            { listings: { some: { price: { lte: maxPrice } } } }
          ]
        }
      ]
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Sports Cars Under {prettyUsd(maxPrice)}
              </h1>
              <p className="mt-2 text-gray-600">
                {totalCount > 0 ? `${totalCount} cars found` : 'No cars found'}
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

        {/* Filter Bar */}
        <FilterBar 
          makes={makes}
          initial={{
            make,
            q,
            maxPrice,
            yearMin: yearMin !== 1990 ? yearMin : undefined,
            yearMax: yearMax !== 2099 ? yearMax : undefined,
            sort
          }}
        />

        {/* Cars Grid */}
        <Suspense fallback={<CarsGridSkeleton />}>
          <CarsGrid 
            make={make}
            q={q}
            maxPrice={maxPrice}
            yearMin={yearMin}
            yearMax={yearMax}
            sort={sort}
            page={page}
            pageSize={pageSize}
          />
        </Suspense>
      </div>
    </div>
  );
}
