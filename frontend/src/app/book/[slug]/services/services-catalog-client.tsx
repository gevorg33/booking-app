'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PublicHeader } from '@/components/public-booking/public-header';
import { ServiceCategoryFilter } from '@/components/public-booking/service-category-filter';
import { ServicePrepaymentBadge } from '@/components/public-booking/service-prepayment-badge';
import { FixedActionBar } from '@/components/public-booking/fixed-action-bar';
import {
  formatDuration,
  formatPrice,
  type PublicBusinessProfile,
  type PublicService,
} from '@/lib/public-api';
import { resolveTenantPriceCurrency } from '@/lib/business-currency';
import { bookPath } from '@/lib/tenant-host';
import { useI18n } from '@/i18n';
import {
  SERVICE_CATEGORY_FILTER_ALL,
  buildServiceCategoryFilterOptions,
  filterServicesByCategory,
  groupServicesByCategory,
  resolveServiceCategoryFilterId,
} from '@/lib/service-catalog-browse.util';

interface ServicesCatalogClientProps {
  slug: string;
  tenant: PublicBusinessProfile;
  services: PublicService[];
  backHref: string;
  /** Optional `?category=` deep-link from home teaser chips. */
  initialCategoryId?: string | null;
}

/** e2e-bug.208 — full-catalog browse on `/services` without slot params. */
export function ServicesCatalogClient({
  slug,
  tenant,
  services,
  backHref,
  initialCategoryId = null,
}: ServicesCatalogClientProps) {
  const router = useRouter();
  const { t } = useI18n();
  const primary = tenant.branding.primaryColor || '#7c3aed';
  const [serviceId, setServiceId] = useState<string | null>(null);

  const categoryOptions = useMemo(
    () =>
      buildServiceCategoryFilterOptions(
        services,
        t('public.allServiceCategories'),
        t('public.uncategorizedServices'),
      ),
    [services, t],
  );

  const [categoryId, setCategoryId] = useState(() =>
    resolveServiceCategoryFilterId(initialCategoryId, categoryOptions),
  );

  const filteredServices = useMemo(
    () => filterServicesByCategory(services, categoryId),
    [categoryId, services],
  );

  const groupedServices = useMemo(
    () =>
      groupServicesByCategory(
        filteredServices,
        t('public.uncategorizedServices'),
      ),
    [filteredServices, t],
  );

  const onCategoryChange = useCallback(
    (next: string) => {
      setCategoryId(next);
      setServiceId(null);
      const path = bookPath(slug, '/services');
      if (next === SERVICE_CATEGORY_FILTER_ALL) {
        router.replace(path, { scroll: false });
        return;
      }
      const q = new URLSearchParams({ category: next });
      router.replace(`${path}?${q.toString()}`, { scroll: false });
    },
    [router, slug],
  );

  const onContinue = useCallback(() => {
    if (!serviceId) return;
    const q = new URLSearchParams({ serviceId });
    router.push(`${bookPath(slug, '/any/availability')}?${q.toString()}`);
  }, [router, serviceId, slug]);

  return (
    <>
      <PublicHeader tenant={tenant} showBack backHref={backHref} />
      <main
        className="max-w-lg mx-auto px-4 py-6 pb-32"
        data-testid="services-catalog-browse"
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('public.servicesCatalogTitle')}
        </h1>
        <p className="text-sm text-gray-500 mb-5">
          {t('public.servicesCatalogHint')}
        </p>

        <ServiceCategoryFilter
          options={categoryOptions}
          value={categoryId}
          onChange={onCategoryChange}
          primaryColor={primary}
        />

        {filteredServices.length === 0 ? (
          <p className="text-center py-12 text-gray-500">
            {t('public.noServicesAvailable')}
          </p>
        ) : (
          <div className="space-y-6">
            {groupedServices.map((group) => (
              <section key={group.key} data-testid={`services-catalog-group-${group.key}`}>
                {group.categoryName && (
                  <h2 className="text-base font-bold text-gray-900 mb-3">
                    {group.categoryName}
                  </h2>
                )}
                <div className="space-y-2">
                  {group.services.map((service) => {
                    const selected = serviceId === service.id;
                    const totalMin =
                      service.durationMinutes + service.bufferMinutes;
                    return (
                      <button
                        key={service.id}
                        type="button"
                        data-testid={`services-catalog-service-${service.id}`}
                        onClick={() => setServiceId(service.id)}
                        className={`w-full flex items-start gap-3 p-4 rounded-2xl border bg-white text-left transition-colors ${
                          selected
                            ? 'border-violet-400 ring-2 ring-violet-100'
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">
                            {service.name}
                          </p>
                          <ServicePrepaymentBadge
                            service={service}
                            businessCurrency={tenant.currency}
                          />
                          {service.description && (
                            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                              {service.description}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDuration(totalMin)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-gray-900">
                            {formatPrice(
                              service.price,
                              resolveTenantPriceCurrency(
                                service.currency,
                                tenant.currency,
                              ),
                            )}
                          </p>
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
