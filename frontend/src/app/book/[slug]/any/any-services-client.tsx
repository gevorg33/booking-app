'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PublicHeader } from '@/components/public-booking/public-header';
import { FixedActionBar } from '@/components/public-booking/fixed-action-bar';
import { formatDuration, formatPrice, type PublicBusinessProfile, type PublicService } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { useI18n } from '@/i18n';

interface AnyServicesClientProps {
  slug: string;
  tenant: PublicBusinessProfile;
  services: PublicService[];
  backHref: string;
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

export function AnyServicesClient({ slug, tenant, services, backHref }: AnyServicesClientProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [serviceId, setServiceId] = useState<string | null>(null);
  const primary = tenant.branding.primaryColor || '#7c3aed';

  const groupedServices = useMemo(
    () => groupServicesByCategory(services, t('public.uncategorizedServices')),
    [services, t],
  );

  const availabilityHref = useMemo(() => {
    if (!serviceId) return null;
    const q = new URLSearchParams({ serviceId });
    return `${bookPath(slug, '/any/availability')}?${q.toString()}`;
  }, [slug, serviceId]);

  const onContinue = useCallback(() => {
    if (availabilityHref) router.push(availabilityHref);
  }, [router, availabilityHref]);

  return (
    <>
      <PublicHeader tenant={tenant} showBack backHref={backHref} />
      <main className="max-w-lg mx-auto px-4 py-6 pb-32">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('public.anySpecialist')}</h1>
        <p className="text-sm text-gray-500 mb-5">{t('public.anySpecialistHint')}</p>

        {services.length === 0 ? (
          <p className="text-center py-12 text-gray-500">{t('public.noServicesAvailable')}</p>
        ) : (
          <div className="space-y-6">
            {groupedServices.map((group) => (
              <section key={group.key}>
                {group.categoryName && (
                  <h2 className="text-base font-bold text-gray-900 mb-3">{group.categoryName}</h2>
                )}
                <div className="space-y-2">
                  {group.services.map((service) => {
                    const selected = serviceId === service.id;
                    const totalMin = service.durationMinutes + service.bufferMinutes;
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => setServiceId(service.id)}
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
                              borderColor: selected ? primary : '#d1d5db',
                              backgroundColor: selected ? primary : 'transparent',
                            }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
      <FixedActionBar
        primaryColor={primary}
        disabled={!serviceId}
        label={t('public.selectDateTime')}
        onClick={onContinue}
      />
    </>
  );
}
