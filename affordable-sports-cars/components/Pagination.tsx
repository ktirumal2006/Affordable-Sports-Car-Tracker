import Link from "next/link";

interface PaginationProps {
  page: number;
  totalPages: number;
  make?: string;
  q?: string;
  maxPrice?: number;
  yearMin?: number;
  yearMax?: number;
  sort?: "price-asc" | "price-desc";
}

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

export default function Pagination({
  page,
  totalPages,
  make,
  q,
  maxPrice,
  yearMin,
  yearMax,
  sort,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const maxVisiblePages = 8;
  const halfVisible = Math.floor(maxVisiblePages / 2);

  let startPage = Math.max(1, page - halfVisible);
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  // Adjust start if we're near the end
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const params = { make, q, maxPrice, yearMin, yearMax, sort };

  return (
    <nav className="mt-12 flex items-center justify-center" aria-label="Pagination">
      <div className="flex items-center space-x-1 bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
        {/* Previous button */}
        {page === 1 ? (
          <span
            className="px-3 py-2 text-sm font-medium rounded-md text-gray-400 cursor-not-allowed"
            aria-disabled="true"
          >
            « Prev
          </span>
        ) : (
          <Link
            href={buildUrl(page - 1, params)}
            className="px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            aria-label="Previous page"
          >
            « Prev
          </Link>
        )}

        {/* First page + ellipsis */}
        {startPage > 1 && (
          <>
            <Link
              href={buildUrl(1, params)}
              className="px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
              aria-label="Go to page 1"
            >
              1
            </Link>
            {startPage > 2 && (
              <span className="px-3 py-2 text-sm text-gray-500" aria-hidden="true">
                …
              </span>
            )}
          </>
        )}

        {/* Page numbers */}
        {pages.map((pageNum) =>
          pageNum === page ? (
            <span
              key={pageNum}
              className="px-3 py-2 text-sm font-medium rounded-md bg-blue-600 text-white"
              aria-current="page"
            >
              {pageNum}
            </span>
          ) : (
            <Link
              key={pageNum}
              href={buildUrl(pageNum, params)}
              className="px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              aria-label={`Go to page ${pageNum}`}
            >
              {pageNum}
            </Link>
          )
        )}

        {/* Last page + ellipsis */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="px-3 py-2 text-sm text-gray-500" aria-hidden="true">
                …
              </span>
            )}
            <Link
              href={buildUrl(totalPages, params)}
              className="px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
              aria-label={`Go to page ${totalPages}`}
            >
              {totalPages}
            </Link>
          </>
        )}

        {/* Next button */}
        {page === totalPages ? (
          <span
            className="px-3 py-2 text-sm font-medium rounded-md text-gray-400 cursor-not-allowed"
            aria-disabled="true"
          >
            Next »
          </span>
        ) : (
          <Link
            href={buildUrl(page + 1, params)}
            className="px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            aria-label="Next page"
          >
            Next »
          </Link>
        )}
      </div>
    </nav>
  );
}
