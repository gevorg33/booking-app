'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Pencil } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PublicHeader } from '@/components/public-booking/public-header';
import { FixedActionBar } from '@/components/public-booking/fixed-action-bar';
import { BookingDayStrip } from '@/components/public-booking/booking-day-strip';
import { BookingTimeSlotGrid } from '@/components/public-booking/booking-time-slot-grid';
import {
  formatDuration,
  formatPrice,
  getPublicMultiServiceBlockSlots,
  getPublicMultiServiceProviders,
  suggestPublicMultiServiceBlock,
  type PublicBusinessProfile,
  type PublicService,
} from '@/lib/public-api';
import { resolveTenantPriceCurrency } from '@/lib/business-currency';
import { bookPath } from '@/lib/tenant-host';
import { formatDateDisplay, toDateKey } from '@/lib/date-format';
import { buildBookingDayOptions } from '@/lib/booking-day-options';
import { useI18n } from '@/i18n';
import {
  buildMultiServicePickerHref,
  parseMultiServiceIds,
  persistMultiServiceCart,
  resolveMultiServiceCartFromLocation,
  sumMultiServiceDuration,
  sumMultiServicePrice,
  uniqueMultiServiceIds,
} from '@/lib/multi-service-booking';

interface MultiServiceAvailabilityClientProps {
  slug: string;
  tenant: PublicBusinessProfile;
  services: PublicService[];
  serviceIds: string[];
  backHref: string;
}

export function MultiServiceAvailabilityClient({
  slug,
  tenant,
  services,
  serviceIds: initialServiceIds,
  backHref,
}: MultiServiceAvailabilityClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useI18n();
  const tz = tenant.timezone || 'UTC';
  const primary = tenant.branding.primaryColor || '#7c3aed';
  const dayOptions = useMemo(() => buildBookingDayOptions(tz, undefined, locale), [tz, locale]);

  // URL is the single source of truth — read from window location so client navigations
  // never reuse a stale server-passed service list from a previous selection.
  const [serviceIds, setServiceIds] = useState(() => uniqueMultiServiceIds(initialServiceIds));

  useEffect(() => {
    const resolved = resolveMultiServiceCartFromLocation(
      slug,
      searchParams.get('services'),
      services,
    );
    if (resolved.length < 2) {
      router.replace(resolved.length === 0 ? bookPath(slug, '/any') : buildMultiServicePickerHref(slug, resolved));
      return;
    }
    persistMultiServiceCart(slug, resolved);
    if (!searchParams.get('services')) {
      const q = new URLSearchParams({ services: resolved.join(',') });
      router.replace(`${bookPath(slug, '/multi/availability')}?${q.toString()}`, { scroll: false });
    }
    queueMicrotask(() =>
      setServiceIds((prev) => {
        const a = uniqueMultiServiceIds(prev).slice().sort().join(',');
        const b = uniqueMultiServiceIds(resolved).slice().sort().join(',');
        return a === b ? prev : resolved;
      }),
    );
  }, [router, searchParams, services, slug]);

  useEffect(() => {
    if (serviceIds.length >= 2) {
      persistMultiServiceCart(slug, serviceIds);
    }
  }, [serviceIds, slug]);

  const selectedServices = useMemo(
    () =>
      serviceIds
        .map((id) => services.find((svc) => svc.id === id))
        .filter(Boolean) as PublicService[],
    [serviceIds, services],
  );

  const servicesPickerHref = useMemo(
    () => buildMultiServicePickerHref(slug, serviceIds),
    [serviceIds, slug],
  );

  const [dateKey, setDateKey] = useState('');
  const [slots, setSlots] = useState<Array<{ startTime: string; employeeId: string; employeeName: string }>>([]);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [slotProviders, setSlotProviders] = useState<
    Array<{ id: string; name: string; earliestStartTime?: string }>
  >([]);
  const [laterProviders, setLaterProviders] = useState<
    Array<{ id: string; name: string; earliestStartTime?: string }>
  >([]);
  const [providerPickerOpen, setProviderPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const suggestRequestRef = useRef(0);
  const slotsRequestRef = useRef(0);
  const selectedStartRef = useRef<string | null>(null);
  const dateKeyRef = useRef('');
  const userPickedDateRef = useRef(false);

  useEffect(() => {
    selectedStartRef.current = selectedStart;
  }, [selectedStart]);

  useEffect(() => {
    dateKeyRef.current = dateKey;
  }, [dateKey]);

  const serviceSelectionKey = useMemo(
    () => uniqueMultiServiceIds(serviceIds).slice().sort().join(','),
    [serviceIds],
  );

  const loadDaySlots = useCallback(
    async (day: string, ids: string[], preferredStart?: string | null) => {
      const requestId = ++slotsRequestRef.current;
      setSlotsLoading(true);
      try {
        const result = await getPublicMultiServiceBlockSlots(slug, ids, day);
        if (slotsRequestRef.current !== requestId) return;
        setSlots(result.slots);
        if (result.slots.length > 0) {
          const previousStart = preferredStart ?? selectedStartRef.current;
          const match = previousStart
            ? result.slots.find((slot) => slot.startTime === previousStart)
            : undefined;
          const chosen = match ?? result.slots[0];
          selectedStartRef.current = chosen.startTime;
          setSelectedStart(chosen.startTime);
          setEmployeeId(chosen.employeeId);
          setError(null);
        } else {
          selectedStartRef.current = null;
          setSelectedStart(null);
          setEmployeeId(null);
        }
      } catch (err: unknown) {
        if (slotsRequestRef.current === requestId) {
          setSlots([]);
          selectedStartRef.current = null;
          setSelectedStart(null);
          setEmployeeId(null);
          setError((err as Error)?.message || t('public.loadAvailableTimesFailed'));
        }
      } finally {
        if (slotsRequestRef.current === requestId) {
          setSlotsLoading(false);
        }
      }
    },
    [slug],
  );

  const totals = useMemo(
    () => ({
      duration: sumMultiServiceDuration(
        selectedServices,
        tenant.multiService?.turnoverBufferMinutes ?? 5,
      ),
      price: sumMultiServicePrice(selectedServices),
      currency: resolveTenantPriceCurrency(
        selectedServices[0]?.currency,
        tenant.currency,
      ),
    }),
    [selectedServices, tenant.currency, tenant.multiService?.turnoverBufferMinutes],
  );

  useEffect(() => {
    if (!serviceSelectionKey) return;

    const requestId = ++suggestRequestRef.current;
    userPickedDateRef.current = false;
    selectedStartRef.current = null;
    queueMicrotask(() => {
      setSelectedStart(null);
      setEmployeeId(null);
      setDateKey('');
      setSlots([]);
      setSlotProviders([]);
      setLaterProviders([]);
      setProviderPickerOpen(false);
      setLoading(true);
      setSlotsLoading(true);
      setError(null);
    });
    dateKeyRef.current = '';

    const ids = serviceSelectionKey.split(',');

    void (async () => {
      try {
        const suggested = await suggestPublicMultiServiceBlock(slug, ids);
        if (suggestRequestRef.current !== requestId) return;

        if (!userPickedDateRef.current) {
          setDateKey(suggested.dateKey);
          dateKeyRef.current = suggested.dateKey;
          selectedStartRef.current = suggested.startTime;
          setSelectedStart(suggested.startTime);
          setEmployeeId(suggested.employeeId);
        }
        setError(null);

        const dayToLoad = userPickedDateRef.current ? dateKeyRef.current : suggested.dateKey;
        if (dayToLoad) {
          await loadDaySlots(
            dayToLoad,
            ids,
            userPickedDateRef.current ? null : suggested.startTime,
          );
        }
      } catch (err: unknown) {
        if (suggestRequestRef.current !== requestId) return;
        setError((err as Error)?.message || t('public.findAvailableBlockFailed'));
        const today = new Date().toISOString().slice(0, 10);
        if (!userPickedDateRef.current) {
          setDateKey(today);
          dateKeyRef.current = today;
        }
        const dayToLoad = userPickedDateRef.current ? dateKeyRef.current : today;
        if (dayToLoad) {
          await loadDaySlots(dayToLoad, ids);
        }
      } finally {
        if (suggestRequestRef.current === requestId) setLoading(false);
      }
    })();
  }, [loadDaySlots, serviceSelectionKey, slug]);

  const onDateChange = useCallback(
    (nextDate: string) => {
      userPickedDateRef.current = true;
      setDateKey(nextDate);
      dateKeyRef.current = nextDate;
      selectedStartRef.current = null;
      setSelectedStart(null);
      setEmployeeId(null);
      setProviderPickerOpen(false);
      if (!nextDate || !serviceSelectionKey) return;
      void loadDaySlots(nextDate, serviceSelectionKey.split(','), null);
    },
    [loadDaySlots, serviceSelectionKey],
  );

  const onSelectStartTime = useCallback(
    (startTime: string) => {
      selectedStartRef.current = startTime;
      setSelectedStart(startTime);
      const slot = slots.find((entry) => entry.startTime === startTime);
      if (slot) {
        setEmployeeId(slot.employeeId);
      }
      setProviderPickerOpen(false);
    },
    [slots],
  );

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.startTime === selectedStart) ?? null,
    [selectedStart, slots],
  );

  const availableProviders = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; earliestStartTime?: string }>();
    for (const provider of slotProviders) {
      byId.set(provider.id, provider);
    }
    for (const provider of laterProviders) {
      if (!byId.has(provider.id)) {
        byId.set(provider.id, provider);
      }
    }
    return [...byId.values()];
  }, [laterProviders, slotProviders]);

  const canChangeProvider = availableProviders.length > 1;

  const selectedProviderName = useMemo(() => {
    if (employeeId) {
      const match = availableProviders.find((provider) => provider.id === employeeId);
      if (match?.name) return match.name;
    }
    return selectedSlot?.employeeName ?? '';
  }, [availableProviders, employeeId, selectedSlot?.employeeName]);

  useEffect(() => {
    if (!selectedStart || serviceIds.length < 2) {
      queueMicrotask(() => setSlotProviders([]));
      queueMicrotask(() => setLaterProviders([]));
      return;
    }

    const ids = uniqueMultiServiceIds(serviceIds);
    let cancelled = false;

    void Promise.all([
      getPublicMultiServiceProviders(slug, ids, selectedStart, false),
      getPublicMultiServiceProviders(slug, ids, selectedStart, true),
    ])
      .then(([slotResult, laterResult]) => {
        if (cancelled) return;
        setSlotProviders(slotResult.providers);
        setLaterProviders(laterResult.providers);
      })
      .catch(() => {
        if (!cancelled) {
          setSlotProviders([]);
          setLaterProviders([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedStart, serviceIds, slug]);

  const onSelectProvider = useCallback(
    (providerId: string) => {
      setEmployeeId(providerId);
      const provider = availableProviders.find((entry) => entry.id === providerId);
      if (
        provider?.earliestStartTime &&
        provider.earliestStartTime !== selectedStartRef.current
      ) {
        selectedStartRef.current = provider.earliestStartTime;
        setSelectedStart(provider.earliestStartTime);
        setDateKey(toDateKey(new Date(provider.earliestStartTime), tz));
        dateKeyRef.current = toDateKey(new Date(provider.earliestStartTime), tz);
      }
      setProviderPickerOpen(false);
    },
    [availableProviders, tz],
  );

  const onContinue = useCallback(() => {
    if (!selectedStart || !employeeId) return;
    const provider = availableProviders.find((entry) => entry.id === employeeId);
    const q = new URLSearchParams({
      services: uniqueMultiServiceIds(serviceIds).join(','),
      startTime: selectedStart,
      employeeId,
    });
    if (provider?.name) {
      q.set('employeeName', provider.name);
    }
    router.push(`${bookPath(slug, '/multi/checkout')}?${q.toString()}`);
  }, [availableProviders, employeeId, router, selectedStart, serviceIds, slug]);

  return (
    <>
      <PublicHeader tenant={tenant} showBack backHref={servicesPickerHref} />
      <main className="max-w-lg mx-auto px-4 py-6 pb-32 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('public.selectDateTime')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('public.multiServicePickBlockHint')}</p>
        </div>

        {(selectedProviderName || employeeId) && (
          <section className="rounded-2xl border border-gray-100 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-gray-500">{t('public.selectSpecialist')}</p>
              {canChangeProvider && (
                <button
                  type="button"
                  onClick={() => setProviderPickerOpen((open) => !open)}
                  className="text-gray-400 hover:text-gray-600 shrink-0"
                  aria-label={t('public.multiServiceEditProvider')}
                  aria-expanded={providerPickerOpen}
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
            {!providerPickerOpen && selectedProviderName && (
              <p className="font-medium text-gray-900 mt-1">{selectedProviderName}</p>
            )}
            {providerPickerOpen && (
              <div className="space-y-2 mt-3">
                {availableProviders.map((provider) => {
                  const active = employeeId === provider.id;
                  const atSelectedTime = slotProviders.some((entry) => entry.id === provider.id);
                  return (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => onSelectProvider(provider.id)}
                      className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border text-left transition-colors ${
                        active ? 'border-violet-400 bg-violet-50' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{provider.name}</p>
                        {!atSelectedTime && provider.earliestStartTime && (
                          <p className="text-sm text-gray-500 mt-0.5">
                            {formatDateDisplay(provider.earliestStartTime, locale)}
                          </p>
                        )}
                      </div>
                      <span
                        className="w-5 h-5 rounded-full border-2 shrink-0"
                        style={{
                          borderColor: active ? primary : '#d1d5db',
                          backgroundColor: active ? primary : 'transparent',
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <section className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-sm font-medium text-gray-500">{t('public.servicesSection')}</p>
            <a
              href={servicesPickerHref}
              className="text-gray-400 hover:text-gray-600 shrink-0"
              aria-label={t('public.multiServiceEditServices')}
            >
              <Pencil className="w-4 h-4" />
            </a>
          </div>
          <ul className="space-y-3">
            {selectedServices.map((service) => (
              <li key={service.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{service.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatDuration(service.durationMinutes + service.bufferMinutes)}
                  </p>
                </div>
                <p className="font-medium text-gray-900 shrink-0">
                  {formatPrice(
                    service.price,
                    resolveTenantPriceCurrency(service.currency, tenant.currency),
                  )}
                </p>
              </li>
            ))}
          </ul>
          <div className="flex justify-between mt-4 pt-4 border-t border-gray-50 text-sm">
            <span className="font-semibold text-gray-900">{t('public.total')}</span>
            <span className="font-semibold text-gray-900">
              {formatDuration(totals.duration)} · {formatPrice(totals.price, totals.currency)}
            </span>
          </div>
        </section>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('public.multiServiceFindingBlock')}
          </div>
        )}

        {error && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <BookingDayStrip
          dayOptions={dayOptions}
          selectedDateKey={dateKey}
          onSelectDateKey={onDateChange}
          primaryColor={primary}
          todayLabel={t('public.today')}
        />

        <BookingTimeSlotGrid
          slots={slots}
          selectedStartTime={selectedStart}
          onSelectStartTime={onSelectStartTime}
          primaryColor={primary}
          loading={loading || slotsLoading}
          error={null}
          emptyLabel={t('public.noSlotsThisDay')}
          heading={t('public.availableSlots')}
        />
      </main>
      <FixedActionBar
        primaryColor={primary}
        disabled={!selectedStart || !employeeId}
        label={t('public.packageContinueCheckout')}
        onClick={onContinue}
      />
    </>
  );
}
