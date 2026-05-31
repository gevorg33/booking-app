'use client';

import { formatDuration, formatPrice, type PublicService } from '@/lib/public-api';
import { FixedActionBar } from '@/components/public-booking/fixed-action-bar';
import { useRouter } from 'next/navigation';
import { bookPath } from '@/lib/tenant-host';
import { useCallback, useMemo } from 'react';

interface ServiceListProps {
  slug: string;
  services: PublicService[];
  primaryColor: string;
  selectedServiceId: string | null;
  onSelect: (serviceId: string) => void;
  employeeId: string;
  startTime: string;
  uncategorizedLabel?: string;
}

interface ServiceGroup {
  key: string;
  categoryName: string | null;
  sortOrder: number;
  services: PublicService[];
}

function groupServicesByCategory(services: PublicService[], uncategorizedLabel: string): ServiceGroup[] {
  const groups = new Map<string, ServiceGroup>();

  for (const service of services) {
    const key = service.category?.id ?? '__uncategorized__';
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        categoryName: service.category?.name ?? uncategorizedLabel,
        sortOrder: service.category?.sortOrder ?? 9999,
        services: [],
      });
    }
    groups.get(key)!.services.push(service);
  }

  return Array.from(groups.values()).sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return (a.categoryName ?? '').localeCompare(b.categoryName ?? '');
  });
}

export function ServiceList({
  slug,
  services,
  primaryColor,
  selectedServiceId,
  onSelect,
  employeeId,
  startTime,
  uncategorizedLabel = 'Other services',
}: ServiceListProps) {
  const router = useRouter();

  const groupedServices = useMemo(
    () => groupServicesByCategory(services, uncategorizedLabel),
    [services, uncategorizedLabel],
  );

  const checkoutHref = useMemo(() => {
    if (!selectedServiceId) return null;
    const q = new URLSearchParams({
      employeeId,
      startTime,
      serviceId: selectedServiceId,
    });
    return `${bookPath(slug, '/checkout')}?${q.toString()}`;
  }, [slug, employeeId, startTime, selectedServiceId]);

  const onContinue = useCallback(() => {
    if (checkoutHref) router.push(checkoutHref);
  }, [router, checkoutHref]);

  if (services.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No services fit the selected time slot.</p>
        <a
          href={`${bookPath(slug, '/professionals')}?employeeId=${encodeURIComponent(employeeId)}&startTime=${encodeURIComponent(startTime)}`}
          className="inline-block mt-4 text-violet-600 font-medium hover:underline"
        >
          Choose another time
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {groupedServices.map((group) => (
        <section key={group.key}>
          {group.categoryName && (
            <h2 className="text-base font-bold text-gray-900 mb-3">{group.categoryName}</h2>
          )}
          <div className="space-y-2">
            {group.services.map((service) => {
              const selected = selectedServiceId === service.id;
              const totalMin = service.durationMinutes + service.bufferMinutes;
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => onSelect(service.id)}
                  className={`w-full flex items-start gap-3 p-4 rounded-2xl border bg-white text-left transition-colors ${
                    selected ? 'border-violet-400 ring-2 ring-violet-100' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{service.name}</p>
                    {service.hasSubscriptionPlans && (
                      <span className="inline-block mt-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Subscribe & save
                      </span>
                    )}
                    {service.description && (
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{service.description}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">{formatDuration(totalMin)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-900">{formatPrice(service.price, service.currency)}</p>
                    <span
                      className="inline-block mt-2 w-5 h-5 rounded border-2"
                      style={{
                        borderColor: selected ? primaryColor : '#d1d5db',
                        backgroundColor: selected ? primaryColor : 'transparent',
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <FixedActionBar
        primaryColor={primaryColor}
        disabled={!selectedServiceId}
        label="Continue"
        onClick={onContinue}
      />
    </div>
  );
}
