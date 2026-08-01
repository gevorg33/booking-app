'use client';

import type { ServiceCategoryFilterOption } from '@/lib/service-catalog-browse.util';
import { SERVICE_CATEGORY_FILTER_ALL } from '@/lib/service-catalog-browse.util';

interface ServiceCategoryFilterProps {
  options: ServiceCategoryFilterOption[];
  value: string;
  onChange: (categoryId: string) => void;
  primaryColor: string;
}

/** e2e-bug.208 — category filter chips for full catalog / slot services browse. */
export function ServiceCategoryFilter({
  options,
  value,
  onChange,
  primaryColor,
}: ServiceCategoryFilterProps) {
  if (options.length <= 1) return null;

  return (
    <div
      className="flex flex-wrap gap-2 mb-5"
      data-testid="service-category-filter"
      role="tablist"
      aria-label="Service categories"
    >
      {options.map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={selected}
            data-testid={
              option.id === SERVICE_CATEGORY_FILTER_ALL
                ? 'service-category-filter-all'
                : `service-category-filter-${option.id}`
            }
            onClick={() => onChange(option.id)}
            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition-colors ${
              selected
                ? 'text-white border-transparent'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
            }`}
            style={
              selected
                ? { backgroundColor: primaryColor }
                : { borderColor: `${primaryColor}33` }
            }
          >
            {option.name}
          </button>
        );
      })}
    </div>
  );
}
