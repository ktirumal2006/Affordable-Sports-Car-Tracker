# Filter Bar Implementation - Final Changes

## 1. NEW FILE: `components/FilterBar.tsx`

**Client Component** with debounced search and URL state management.

### Key Features:
```typescript
// Props interface
type FilterBarProps = {
  makes: string[];                 // List of all makes for dropdown
  initial: {
    make?: string;
    q?: string;
    maxPrice?: number;
    yearMin?: number;
    yearMax?: number;
    sort?: "price-asc" | "price-desc";
  };
};
```

### Implementation Highlights:
- **Debounced Search**: 400ms debounce on search input
- **Immediate Updates**: All other filters update URL immediately
- **URL Management**: Uses `useRouter()` and `useSearchParams()` from `next/navigation`
- **Page Reset**: Always sets `page=1` when any filter changes
- **Reset Button**: Clears all filters and returns to default view
- **Controlled Inputs**: Pre-fills from `initial` prop

### UI Controls:
1. **Make Selector** - Dropdown with "All makes" option + dynamic list
2. **Search Input** - Debounced text search for model/trim
3. **Max Price** - Number input (min: 5000, step: 5000)
4. **Year Min** - Optional year minimum filter
5. **Year Max** - Optional year maximum filter
6. **Sort** - Dropdown (price low→high / high→low)
7. **Reset Button** - Clears all filters

---

## 2. UPDATED: `app/cars/page.tsx`

**Major Refactor** - Server Component with proper Next.js 16 async handling.

### Type Changes:
```typescript
// OLD
interface CarsPageProps {
  searchParams: Promise<{
    make?: string;
    q?: string;
    maxPrice?: string;
    page?: string;
    perPage?: string;
  }>;
}

// NEW
type CarsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
```

### Parameter Normalization:
```typescript
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
const pageSize = 24; // Changed from 20
```

### New Database Query Logic:

#### Fetch Makes List:
```typescript
const makes = (
  await prisma.make.findMany({
    select: { name: true },
    orderBy: { name: 'asc' }
  })
).map(m => m.name);
```

#### WHERE Clause Builder:
```typescript
const whereConditions: any[] = [];

// Year range
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

// Search query
if (q) {
  whereConditions.push({
    OR: [
      { model: { name: { contains: q, mode: 'insensitive' as const } } },
      { name: { contains: q, mode: 'insensitive' as const } }
    ]
  });
}

// Combined with price filtering
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
```

#### ORDER BY Logic:
```typescript
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
```

#### Query Execution:
```typescript
const [total, trims] = await Promise.all([
  prisma.trim.count({ where: { /* same conditions */ } }),
  prisma.trim.findMany({
    where,
    distinct: ['year', 'modelId'],  // One entry per (year, model)
    include: {
      model: { include: { make: true } },
      listings: { /* ... */ }
    },
    orderBy,
    skip: (page - 1) * pageSize,
    take: pageSize
  })
]);
```

### Component Structure:
```typescript
// OLD - Simple FilterForm (server-rendered form)
<FilterForm make={make} q={q} maxPrice={maxPrice} perPage={perPage} />

// NEW - Client FilterBar with full state management
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
```

---

## 3. UPDATED: `components/Pagination.tsx`

**Extended** to support new filter parameters.

### Props Interface:
```typescript
// OLD
interface PaginationProps {
  page: number;
  totalPages: number;
  make?: string;
  q?: string;
  maxPrice?: number;
  perPage?: number;  // Removed
}

// NEW
interface PaginationProps {
  page: number;
  totalPages: number;
  make?: string;
  q?: string;
  maxPrice?: number;
  yearMin?: number;      // Added
  yearMax?: number;      // Added
  sort?: "price-asc" | "price-desc";  // Added
}
```

### URL Builder Updates:
```typescript
function buildUrl(
  page: number,
  params: Omit<PaginationProps, "page" | "totalPages">
) {
  const searchParams = new URLSearchParams();

  if (params.make) searchParams.set("make", params.make);
  if (params.q) searchParams.set("q", params.q);
  if (params.maxPrice && params.maxPrice !== 200000)
    searchParams.set("maxPrice", params.maxPrice.toString());
  if (params.yearMin && params.yearMin !== 1990)
    searchParams.set("yearMin", params.yearMin.toString());
  if (params.yearMax && params.yearMax !== 2099)
    searchParams.set("yearMax", params.yearMax.toString());
  if (params.sort && params.sort !== "price-asc")
    searchParams.set("sort", params.sort);
  if (page > 1) searchParams.set("page", page.toString());

  const queryString = searchParams.toString();
  return `/cars${queryString ? `?${queryString}` : ""}`;
}
```

### Accessibility Improvements:
```typescript
// Added ARIA attributes
<Link
  href={buildUrl(page - 1, params)}
  aria-label="Previous page"
  // ...
>

<span aria-current="page">
  {pageNum}
</span>

<span aria-disabled="true">
  Next »
</span>
```

---

## Summary of Changes

### Files Created:
1. ✅ `components/FilterBar.tsx` - Full-featured client filter component

### Files Updated:
1. ✅ `app/cars/page.tsx` - Complete refactor with new query logic
2. ✅ `components/Pagination.tsx` - Extended to support all filters

### Key Improvements:
- ✅ **URL as Single Source of Truth** - All state in query string
- ✅ **Next.js 16 Compatible** - Proper `await searchParams` usage
- ✅ **Debounced Search** - 400ms delay on search input
- ✅ **Filter Persistence** - Refresh, back/forward, bookmarks all work
- ✅ **Page Reset on Filter Change** - Always returns to page 1
- ✅ **Clean URLs** - Omits default values
- ✅ **Accessibility** - Proper ARIA labels and semantic HTML
- ✅ **Type Safety** - Full TypeScript coverage

### Database Query Improvements:
- ✅ Uses Prisma `distinct` for unique (year, model) combinations
- ✅ Supports complex filtering (make, search, price, year range)
- ✅ Efficient sorting with multiple ORDER BY clauses
- ✅ Handles both MSRP and listing prices

### User Experience:
- ✅ Instant feedback on filter changes (except search which debounces)
- ✅ Reset button for quick clear
- ✅ Shareable URLs with filters
- ✅ Smooth pagination with preserved filters
- ✅ No full page reloads (shallow routing)

