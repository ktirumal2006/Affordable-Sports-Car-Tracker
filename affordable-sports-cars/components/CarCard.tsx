import { CarCardData } from "../lib/db/cars";

interface CarCardProps {
  car: CarCardData;
}

function formatPrice(price: number | null): string {
  if (price === null) return "—";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

function formatPriceRange(minPrice: number | null, hasMultipleListings: boolean): string {
  if (minPrice === null) return "—";
  if (hasMultipleListings) {
    return `from ${formatPrice(minPrice)}`;
  }
  return formatPrice(minPrice);
}

export default function CarCard({ car }: CarCardProps) {
  const title = `${car.year} ${car.makeName} ${car.modelName} ${car.trimName}`;
  const hasUrl = car.url !== null;
  
  // For now, we'll assume single listing per trim since we're taking the first one
  // In a real implementation, you might want to check if there are multiple listings
  const hasMultipleListings = false; // This would need to be passed from the parent
  
  const CardContent = () => (
    <div className="group bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
      {/* Image */}
      <div className="h-48 w-full bg-gray-100 relative overflow-hidden">
        {car.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={car.image}
            alt={title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-100">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Title */}
        <div className="mb-3">
          <h3 className={`text-xl font-semibold group-hover:text-blue-600 transition-colors ${
            hasUrl ? 'text-gray-900' : 'text-gray-600'
          }`}>
            {title}
          </h3>
        </div>

        {/* Specs */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Horsepower</span>
            <span className="font-medium">{car.horsepower ?? "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">MPG City</span>
            <span className="font-medium">{car.mpgCity ?? "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">MPG Highway</span>
            <span className="font-medium">{car.mpgHwy ?? "—"}</span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-gray-900">
            {formatPriceRange(car.minPrice, hasMultipleListings)}
          </div>
          {car.minPrice === null && (
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              No price yet
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (hasUrl) {
    return (
      <a
        href={car.url!}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <CardContent />
      </a>
    );
  }

  return (
    <div className="cursor-not-allowed opacity-75">
      <CardContent />
    </div>
  );
}
