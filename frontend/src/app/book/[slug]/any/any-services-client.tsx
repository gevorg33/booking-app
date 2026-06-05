'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PublicHeader } from '@/components/public-booking/public-header';
import { FixedActionBar } from '@/components/public-booking/fixed-action-bar';
import {
  formatDuration,
  formatPrice,
  previewPublicMultiService,
  type PublicBusinessProfile,
  type PublicService,
  type PublicServicePackage,
} from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { useI18n } from '@/i18n';
import {
  PackageServiceCards,
  packageConfirmHref,
} from '@/components/public-booking/package-service-cards';
import {
  getDisabledMultiServiceIds,
  parseMultiServiceIds,
  persistMultiServiceCart,
  resolveMultiServiceCartFromLocation,
  sumMultiServiceDuration,
  sumMultiServicePrice,
  uniqueMultiServiceIds,
} from '@/lib/multi-service-booking';

interface AnyServicesClientProps {
  slug: string;
  tenant: PublicBusinessProfile;
  services: PublicService[];
  packages?: PublicServicePackage[];
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

export function AnyServicesClient({ slug, tenant, services, packages = [], backHref }: AnyServicesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const multiEnabled = tenant.multiService?.enabled === true;
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [cartErrors, setCartErrors] = useState<string[]>([]);
  const primary = tenant.branding.primaryColor || '#7c3aed';

  useEffect(() => {
    if (!multiEnabled) return;
    const raw = searchParams.get('services');
    const ids = resolveMultiServiceCartFromLocation(slug, raw, services);
    if (ids.length === 0) return;
    queueMicrotask(() => {
      setSelectedServiceIds(ids);
      setServiceId(null);
      setPackageId(null);
    });
    persistMultiServiceCart(slug, ids);
    if (!raw) {
      const q = new URLSearchParams({ services: ids.join(',') });
      router.replace(`${bookPath(slug, '/any')}?${q.toString()}`, { scroll: false });
    }
  }, [multiEnabled, router, searchParams, services, slug]);

  useEffect(() => {
    if (!multiEnabled) return;
    persistMultiServiceCart(slug, selectedServiceIds);
  }, [multiEnabled, selectedServiceIds, slug]);

  const groupedServices = useMemo(
    () => groupServicesByCategory(services, t('public.uncategorizedServices')),
    [services, t],
  );

  const selectedServices = useMemo(
    () => services.filter((svc) => selectedServiceIds.includes(svc.id)),
    [selectedServiceIds, services],
  );

  const cartTotals = useMemo(() => {
    if (selectedServices.length < 2) return null;
    const turnover = tenant.multiService?.turnoverBufferMinutes ?? 5;
    const duration = sumMultiServiceDuration(selectedServices, turnover);
    const price = sumMultiServicePrice(selectedServices);
    return { duration, price, currency: selectedServices[0]?.currency ?? 'USD' };
  }, [selectedServices, tenant.multiService?.turnoverBufferMinutes]);

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

  const availabilityHref = useMemo(() => {
    const effectiveServiceId =
      serviceId ?? (multiEnabled && selectedServiceIds.length === 1 ? selectedServiceIds[0] : null);
    if (!effectiveServiceId) return null;
    const q = new URLSearchParams({ serviceId: effectiveServiceId });
    return `${bookPath(slug, '/any/availability')}?${q.toString()}`;
  }, [multiEnabled, selectedServiceIds, serviceId, slug]);

  const hasSingleSelection =
    Boolean(serviceId) || (multiEnabled && selectedServiceIds.length === 1);
  const hasMultiSelection = multiEnabled && selectedServiceIds.length >= 2;

  const toggleMultiService = (id: string) => {
    setPackageId(null);
    setServiceId(null);
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id],
    );
  };

  const onContinue = useCallback(() => {
    if (packageId) {
      router.push(packageConfirmHref(slug, packageId));
      return;
    }
    if (multiEnabled && selectedServiceIds.length >= 2 && !cartErrors.length) {
      const q = new URLSearchParams({ services: uniqueMultiServiceIds(selectedServiceIds).join(',') });
      const path =
        tenant.multiService?.schedulingMode === 'per_service'
          ? `/multi/confirm?${q.toString()}`
          : `/multi/availability?${q.toString()}`;
      router.push(bookPath(slug, path));
      return;
    }
    if (availabilityHref) router.push(availabilityHref);
  }, [
    availabilityHref,
    cartErrors.length,
    multiEnabled,
    packageId,
    router,
    selectedServiceIds,
    slug,
    tenant.multiService?.schedulingMode,
  ]);

  const continueDisabled =
    (!hasSingleSelection && !packageId && !hasMultiSelection) ||
    (hasMultiSelection && cartErrors.length > 0);

  const continueLabel = packageId
    ? t('public.schedulePackage')
    : hasMultiSelection
      ? t('public.multiServiceContinue')
      : t('public.selectDateTime');

  return (
    <>
      <PublicHeader tenant={tenant} showBack backHref={backHref} />
      <main className="max-w-lg mx-auto px-4 py-6 pb-32">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('public.anySpecialist')}</h1>
        <p className="text-sm text-gray-500 mb-5">
          {multiEnabled ? t('public.multiServiceSelectHint') : t('public.anySpecialistHint')}
        </p>

        {packages.length > 0 && (
          <PackageServiceCards
            slug={slug}
            packages={packages}
            primaryColor={primary}
            selectedPackageId={packageId}
            onSelect={(id) => {
              setPackageId(id);
              setServiceId(null);
              setSelectedServiceIds([]);
            }}
          />
        )}

        {services.length === 0 && packages.length === 0 ? (
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
                    const multiSelected = selectedServiceIds.includes(service.id);
                    const singleSelected = !multiEnabled && serviceId === service.id;
                    const selected = multiEnabled ? multiSelected : singleSelected;
                    const incompatibleDisabled =
                      multiEnabled && disabledServiceIds.has(service.id) && !multiSelected;
                    const totalMin = service.durationMinutes + service.bufferMinutes;
                    return (
                      <button
                        key={service.id}
                        type="button"
                        disabled={incompatibleDisabled}
                        onClick={() => {
                          if (incompatibleDisabled) return;
                          if (multiEnabled) {
                            toggleMultiService(service.id);
                            return;
                          }
                          setServiceId(service.id);
                          setPackageId(null);
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
                            <p className="text-xs text-gray-500 mt-1">{t('public.multiServiceIncompatibleDisabled')}</p>
                          )}
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
