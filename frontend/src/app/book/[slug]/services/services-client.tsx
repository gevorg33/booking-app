'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PublicHeader } from '@/components/public-booking/public-header';
import { ServiceList } from '@/components/public-booking/service-list';
import { ServiceCategoryFilter } from '@/components/public-booking/service-category-filter';
import { ServicePrepaymentBadge } from '@/components/public-booking/service-prepayment-badge';
import { PublicAssistantStarterChips } from '@/components/public-booking/public-assistant-starter-chips';
import { FixedActionBar } from '@/components/public-booking/fixed-action-bar';
import {
  formatDuration,
  formatPrice,
  previewPublicMultiService,
  type PublicBusinessProfile,
  type PublicService,
} from '@/lib/public-api';
import { resolveTenantPriceCurrency } from '@/lib/business-currency';
import { bookPath } from '@/lib/tenant-host';
import { useI18n } from '@/i18n';
import {
  getDisabledMultiServiceIds,
  persistMultiServiceCart,
  sumMultiServiceDuration,
  sumMultiServicePrice,
  uniqueMultiServiceIds,
} from '@/lib/multi-service-booking';
import {
  buildServiceCategoryFilterOptions,
  filterServicesByCategory,
  groupServicesByCategory,
  resolveServiceCategoryFilterId,
} from '@/lib/service-catalog-browse.util';

interface ServicesClientProps {
  slug: string;
  tenant: PublicBusinessProfile;
  services: PublicService[];
  employeeId: string;
  startTime: string;
  employeeName: string;
  backHref: string;
  initialCategoryId?: string | null;
}

export function ServicesClient({
  slug,
  tenant,
  services,
  employeeId,
  startTime,
  employeeName,
  backHref,
  initialCategoryId = null,
}: ServicesClientProps) {
  const router = useRouter();
  const { t } = useI18n();
  const multiEnabled = tenant.multiService?.enabled === true;
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [cartErrors, setCartErrors] = useState<string[]>([]);
  const primary = tenant.branding.primaryColor || '#7c3aed';

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

  useEffect(() => {
    if (!multiEnabled) return;
    persistMultiServiceCart(slug, selectedServiceIds);
  }, [multiEnabled, selectedServiceIds, slug]);

  const visibleServices = useMemo(
    () => filterServicesByCategory(services, categoryId),
    [categoryId, services],
  );

  const groupedServices = useMemo(
    () =>
      groupServicesByCategory(
        visibleServices,
        t('public.uncategorizedServices'),
      ),
    [visibleServices, t],
  );

  const selectedServices = useMemo(
    () => services.filter((svc) => selectedServiceIds.includes(svc.id)),
    [selectedServiceIds, services],
  );

  const onCategoryChange = (next: string) => {
    setCategoryId(next);
    setServiceId(null);
  };

  const cartTotals = useMemo(() => {
    if (selectedServices.length < 2) return null;
    const turnover = tenant.multiService?.turnoverBufferMinutes ?? 5;
    const duration = sumMultiServiceDuration(selectedServices, turnover);
    const price = sumMultiServicePrice(selectedServices);
    return {
      duration,
      price,
      currency: resolveTenantPriceCurrency(
        selectedServices[0]?.currency,
        tenant.currency,
      ),
    };
  }, [selectedServices, tenant.currency, tenant.multiService?.turnoverBufferMinutes]);

  const disabledServiceIds = useMemo(() => {
    if (!multiEnabled || !tenant.multiService || selectedServiceIds.length === 0) {
      return new Set<string>();
    }
    return getDisabledMultiServiceIds({
      services,
      selectedIds: selectedServiceIds,
      settings: {
        incompatiblePairMode: tenant.multiService.incompatiblePairMode ?? 'service',
        incompatiblePairs: tenant.multiService.incompatiblePairs ?? [],
        incompatibleCategoryPairs: tenant.multiService.incompatibleCategoryPairs ?? [],
      },
    });
  }, [multiEnabled, selectedServiceIds, services, tenant.multiService]);

  useEffect(() => {
    if (!multiEnabled || selectedServiceIds.length < 2) {
      queueMicrotask(() => setCartErrors([]));
      return;
    }
    void previewPublicMultiService(slug, selectedServiceIds)
      .then((preview) => setCartErrors(preview.valid ? [] : preview.errors))
      .catch((err: unknown) =>
        setCartErrors([(err as Error)?.message || t('public.validateServiceSelectionFailed')]),
      );
  }, [multiEnabled, selectedServiceIds, slug]);

  const toggleMultiService = (id: string) => {
    setServiceId(null);
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id],
    );
  };

  const hasSingleSelection =
    Boolean(serviceId) || (multiEnabled && selectedServiceIds.length === 1);
  const hasMultiSelection = multiEnabled && selectedServiceIds.length >= 2;

  const onContinue = useCallback(() => {
    if (hasMultiSelection && !cartErrors.length) {
      const ids = uniqueMultiServiceIds(selectedServiceIds);
      const q = new URLSearchParams({
        services: ids.join(','),
        startTime,
        employeeId,
      });
      if (employeeName) {
        q.set('employeeName', employeeName);
      }
      if (tenant.multiService?.schedulingMode === 'per_service') {
        router.push(`${bookPath(slug, '/multi/confirm')}?services=${ids.join(',')}`);
        return;
      }
      router.push(`${bookPath(slug, '/multi/checkout')}?${q.toString()}`);
      return;
    }

    const effectiveServiceId =
      serviceId ?? (multiEnabled && selectedServiceIds.length === 1 ? selectedServiceIds[0] : null);
    if (!effectiveServiceId) return;

    const q = new URLSearchParams({
      employeeId,
      startTime,
      serviceId: effectiveServiceId,
    });
    router.push(`${bookPath(slug, '/checkout')}?${q.toString()}`);
  }, [
    cartErrors.length,
    employeeId,
    employeeName,
    hasMultiSelection,
    multiEnabled,
    router,
    selectedServiceIds,
    serviceId,
    slug,
    startTime,
    tenant.multiService?.schedulingMode,
  ]);

  const continueDisabled =
    (!hasSingleSelection && !hasMultiSelection) || (hasMultiSelection && cartErrors.length > 0);

  const continueLabel = hasMultiSelection
    ? t('public.multiServiceContinue')
    : t('public.continueBooking');

  if (!multiEnabled) {
    return (
      <>
        <PublicHeader tenant={tenant} showBack backHref={backHref} />
        <main className="max-w-lg mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{t('public.selectService')}</h1>
          <PublicAssistantStarterChips
            slug={slug}
            primaryColor={primary}
            className="mb-5"
          />
          <ServiceCategoryFilter
            options={categoryOptions}
            value={categoryId}
            onChange={onCategoryChange}
            primaryColor={primary}
          />
          <ServiceList
            slug={slug}
            services={visibleServices}
            businessCurrency={tenant.currency}
            tax={tenant.tax}
            primaryColor={primary}
            selectedServiceId={serviceId}
            onSelect={setServiceId}
            employeeId={employeeId}
            startTime={startTime}
            uncategorizedLabel={t('public.uncategorizedServices')}
          />
        </main>
      </>
    );
  }

  return (
    <>
      <PublicHeader tenant={tenant} showBack backHref={backHref} />
      <main className="max-w-lg mx-auto px-4 py-6 pb-32">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('public.selectService')}</h1>
        <p className="text-sm text-gray-500 mb-3">
          {t('public.multiServiceWithProvider').replace('{name}', employeeName)} ·{' '}
          {t('public.multiServiceSelectHint')}
        </p>
        <PublicAssistantStarterChips
          slug={slug}
          primaryColor={primary}
          className="mb-5"
        />
        <ServiceCategoryFilter
          options={categoryOptions}
          value={categoryId}
          onChange={onCategoryChange}
          primaryColor={primary}
        />

        {visibleServices.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>{t('public.noServicesAvailable')}</p>
            <a href={backHref} className="inline-block mt-4 text-violet-600 font-medium hover:underline">
              {t('public.selectDateTime')}
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedServices.map((group) => (
              <section key={group.key}>
                {group.categoryName && (
                  <h2 className="text-base font-bold text-gray-900 mb-3">{group.categoryName}</h2>
                )}
                <div className="space-y-2">
                  {group.services.map((service) => {
                    const selected = selectedServiceIds.includes(service.id);
                    const incompatibleDisabled =
                      disabledServiceIds.has(service.id) && !selected;
                    const totalMin = service.durationMinutes + service.bufferMinutes;
                    return (
                      <button
                        key={service.id}
                        type="button"
                        disabled={incompatibleDisabled}
                        onClick={() => {
                          if (incompatibleDisabled) return;
                          toggleMultiService(service.id);
                        }}
                        className={`w-full flex items-start gap-3 p-4 rounded-2xl border bg-white text-left transition-colors ${
                          incompatibleDisabled
                            ? 'border-gray-100 opacity-50 cursor-not-allowed'
                            : selected
                              ? 'border-violet-400 ring-2 ring-violet-100'
                              : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{service.name}</p>
                          {incompatibleDisabled && (
                            <p className="text-xs text-gray-500 mt-1">
                              {t('public.multiServiceIncompatibleDisabled')}
                            </p>
                          )}
                          {service.hasSubscriptionPlans && (
                            <span className="inline-block mt-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              Subscribe & save
                            </span>
                          )}
                          <ServicePrepaymentBadge
                            service={service}
                            businessCurrency={tenant.currency}
                          />
                          {service.description && (
                            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{service.description}</p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">{formatDuration(totalMin)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-gray-900">
                            {formatPrice(
                              service.price,
                              resolveTenantPriceCurrency(service.currency, tenant.currency),
                            )}
                          </p>
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

        {cartTotals && (
          <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50 p-4 text-sm">
            <p className="font-medium text-gray-900">
              {t('public.multiServiceCart', { count: selectedServiceIds.length })}
            </p>
            <p className="text-gray-600 mt-1">
              {t('public.multiServiceTotal', {
                duration: formatDuration(cartTotals.duration),
                price: formatPrice(cartTotals.price, cartTotals.currency),
              })}
            </p>
            {cartErrors.map((error) => (
              <p key={error} className="text-red-600 mt-1">
                {error}
              </p>
            ))}
          </div>
        )}
      </main>
      <FixedActionBar
        primaryColor={primary}
        disabled={continueDisabled}
        label={continueLabel}
        onClick={onContinue}
      />
    </>
  );
}
