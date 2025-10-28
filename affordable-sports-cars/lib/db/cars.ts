import { prisma } from "../prisma";

export interface CarCardData {
  trimId: number;
  year: number;
  makeName: string;
  modelName: string;
  trimName: string;
  minPrice: number | null;
  image: string | null; // Listing image or trim imageUrl
  url: string | null;
  horsepower: number | null;
  mpgCity: number | null;
  mpgHwy: number | null;
}

export interface CarsPageResult {
  cars: CarCardData[];
  total: number;
  totalPages: number;
  page: number;
  perPage: number;
}

export interface CarsPageParams {
  make?: string;
  q?: string;
  maxPrice?: number;
  page?: number;
  perPage?: number;
}

export async function getCarsPage({
  make,
  q,
  maxPrice = 200000,
  page = 1,
  perPage = 20,
}: CarsPageParams): Promise<CarsPageResult> {
  const skip = (page - 1) * perPage;

  // Build base where clause for filtering
  const baseWhere: any = {};
  
  if (make) {
    baseWhere.model = {
      make: {
        name: {
          startsWith: make,
          mode: 'insensitive',
        },
      },
    };
  }
  
  if (q) {
    baseWhere.OR = [
      {
        name: {
          contains: q,
          mode: 'insensitive',
        },
      },
      {
        model: {
          name: {
            contains: q,
            mode: 'insensitive',
          },
        },
      },
    ];
  }

  // Check if we have any listings that match our criteria
  const hasListings = await prisma.listing.findFirst({
    where: {
      trimId: { not: null },
      price: { lte: maxPrice },
      trim: baseWhere,
    },
  });

  // Step 1: If we have listings, fetch trims and join with listing prices
  if (hasListings) {
    // Get all trims that have listings under the price limit
    const trimWhere: any = {
      ...baseWhere,
      listings: {
        some: {
          price: { lte: maxPrice },
        },
      },
    };

    const [allTrims, totalCount] = await Promise.all([
      prisma.trim.findMany({
        where: trimWhere,
        distinct: ['year', 'modelId'],
        include: {
          model: {
            include: {
              make: true,
            },
          },
          listings: {
            select: {
              price: true,
              image: true,
              url: true,
            },
            where: {
              price: { lte: maxPrice },
            },
            orderBy: {
              price: 'asc',
            },
            take: 1,
          },
        },
        orderBy: [
          { model: { make: { name: 'asc' } } },
          { model: { name: 'asc' } },
          { year: 'desc' },
        ],
      }) as any,
      prisma.trim.findMany({
        where: trimWhere,
        distinct: ['year', 'modelId'],
        select: { id: true },
      }).then(results => results.length),
    ]);

    // Calculate min price for each trim from its listings
    const trimsWithPrices = allTrims
      .map((trim: any) => {
        const minPrice = trim.listings[0]?.price || null;
        return {
          trim,
          minPrice,
        };
      })
      .filter((item: any) => item.minPrice !== null);

    // Sort by price ascending, then make, then model
    trimsWithPrices.sort((a: any, b: any) => {
      if (a.minPrice !== b.minPrice) {
        return a.minPrice - b.minPrice;
      }
      const makeCompare = a.trim.model.make.name.localeCompare(b.trim.model.make.name);
      if (makeCompare !== 0) return makeCompare;
      return a.trim.model.name.localeCompare(b.trim.model.name);
    });

    const total = trimsWithPrices.length;
    const totalPages = Math.ceil(total / perPage);

    // Apply pagination
    const paginatedTrims = trimsWithPrices.slice(skip, skip + perPage);

    const cars: CarCardData[] = paginatedTrims.map((item: any) => {
      const trim = item.trim;
      return {
        trimId: trim.id,
        year: trim.year,
        makeName: trim.model.make.name,
        modelName: trim.model.name,
        trimName: trim.name,
        minPrice: item.minPrice,
        image: trim.imageUrl || trim.listings[0]?.image || null,
        url: trim.listings[0]?.url || null,
        horsepower: trim.horsepower,
        mpgCity: trim.mpgCity,
        mpgHwy: trim.mpgHwy,
      };
    });

    return {
      cars,
      total,
      totalPages,
      page,
      perPage,
    };
  }

  // Step 2: Fallback to trims with MSRP filtering (when no listings available)
  const trimWhere: any = {
    ...baseWhere,
    OR: [
      { msrp: { lte: maxPrice } },
      { msrp: null }, // Include trims without MSRP
    ],
  };

  const [allTrims, totalCount] = await Promise.all([
    prisma.trim.findMany({
      where: trimWhere,
      distinct: ['year', 'modelId'],
      include: {
        model: {
          include: {
            make: true,
          },
        },
        listings: {
          select: {
            image: true,
            url: true,
          },
          take: 1,
        },
      },
      orderBy: [
        { model: { make: { name: 'asc' } } },
        { model: { name: 'asc' } },
        { year: 'desc' },
      ],
    }) as any,
    prisma.trim.findMany({
      where: trimWhere,
      distinct: ['year', 'modelId'],
      select: { id: true },
    }).then(results => results.length),
  ]);

  // Sort by MSRP (price), then make, then model
  const trimsWithPrices = allTrims
    .map((trim: any) => ({
      trim,
      price: trim.msrp || 999999999, // Put null MSRP at the end
    }))
    .sort((a: any, b: any) => {
      if (a.price !== b.price) {
        return a.price - b.price;
      }
      const makeCompare = a.trim.model.make.name.localeCompare(b.trim.model.make.name);
      if (makeCompare !== 0) return makeCompare;
      return a.trim.model.name.localeCompare(b.trim.model.name);
    });

  const total = totalCount;
  const totalPages = Math.ceil(total / perPage);

  // Apply pagination
  const paginatedTrims = trimsWithPrices.slice(skip, skip + perPage);

  const cars: CarCardData[] = paginatedTrims.map((item: any) => {
    const trim = item.trim;
    return {
      trimId: trim.id,
      year: trim.year,
      makeName: trim.model.make.name,
      modelName: trim.model.name,
      trimName: trim.name,
      minPrice: trim.msrp,
      image: trim.imageUrl || trim.listings[0]?.image || null,
      url: trim.listings[0]?.url || null,
      horsepower: trim.horsepower,
      mpgCity: trim.mpgCity,
      mpgHwy: trim.mpgHwy,
    };
  });

  return {
    cars,
    total,
    totalPages,
    page,
    perPage,
  };
}
