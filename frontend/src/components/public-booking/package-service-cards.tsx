'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatDateDisplay } from '@/lib/date-format';
import { formatDuration, formatPrice, type PublicServicePackage } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { useI18n } from '@/i18n';

interface PackageServiceCardsProps {
  slug: string;
  packages: PublicServicePackage[];
  primaryColor: string;
  selectedPackageId: string | null;
  onSelect: (packageId: string) => void;
}

export function PackageServiceCards({
  slug,
  packages,
  primaryColor,
  selectedPackageId,
  onSelect,
}: PackageServiceCardsProps) {
  const { t, locale } = useI18n();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (packages.length === 0) return null;

  return (
    <section className="space-y-2 mb-6">
      <h2 className="text-base font-bold text-gray-900 mb-3">{t('public.packagesTitle')}</h2>
      {packages.map((pkg) => {
        const selected = selectedPackageId === pkg.id;
        const expanded = expandedId === pkg.id;
        const includes = pkg.items
          .map((item) => `${item.serviceName}${item.quantity > 1 ? ` ×${item.quantity}` : ''}`)
          .join(', ');
        return (
          <div
            key={pkg.id}
            className={`rounded-2xl border bg-white transition-colors ${
              selected ? 'border-violet-400 ring-2 ring-violet-100' : 'border-gray-100'
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(pkg.id)}
              className="w-full flex items-start gap-3 p-4 text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{pkg.name}</p>
                <span className="inline-block mt-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  {t('public.packageBadge', { percent: pkg.pricing.savingsPercent.toFixed(0) })}
                </span>
                {pkg.description && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{pkg.description}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {t('public.packageIncludes', { list: includes })}
                </p>
                <p className="text-sm text-gray-500">{formatDuration(pkg.totalDurationMinutes)}</p>
                {pkg.expiresAt && (
                  <p className="text-xs text-amber-700 mt-1">
                    {t('public.packageValidUntil', {
                      date: formatDateDisplay(pkg.expiresAt, locale),
                    })}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-gray-900">
                  {formatPrice(pkg.pricing.packagePrice, pkg.currency)}
                </p>
                <p className="text-xs text-gray-400 line-through">
                  {formatPrice(pkg.pricing.regularTotal, pkg.currency)}
                </p>
                <span
                  className="inline-block mt-2 w-5 h-5 rounded border-2"
                  style={{
                    borderColor: selected ? primaryColor : '#d1d5db',
                    backgroundColor: selected ? primaryColor : 'transparent',
                  }}
                />
              </div>
            </button>
            <div className="px-4 pb-3">
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : pkg.id)}
                className="text-xs text-violet-700 inline-flex items-center gap-1"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? t('public.packageHideDetails') : t('public.packageShowDetails')}
              </button>
              {expanded && (
                <ul className="mt-2 space-y-2 border-t border-gray-100 pt-2">
                  {pkg.items.map((item, itemIndex) => (
                    <li key={`${item.serviceId}-${itemIndex}`} className="flex justify-between text-sm">
                      <div>
                        <p className="text-gray-900">
                          {item.serviceName}
                          {item.quantity > 1 ? ` ×${item.quantity}` : ''}
                        </p>
                        <p className="text-gray-500">{formatDuration(item.durationMinutes)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 line-through">
                          {formatPrice(item.unitPrice * item.quantity, pkg.currency)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

export function packageConfirmHref(slug: string, packageId: string) {
  return bookPath(slug, `/packages/${packageId}`);
}
