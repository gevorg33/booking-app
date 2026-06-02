'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Pencil } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PublicHeader } from '@/components/public-booking/public-header';
import { FixedActionBar } from '@/components/public-booking/fixed-action-bar';
import {
  formatDuration,
  formatPrice,
  getPublicMultiServiceBlockSlots,
  getPublicMultiServiceProviders,
  suggestPublicMultiServiceBlock,
  type PublicBusinessProfile,
  type PublicService,
} from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { formatDateDisplay, formatScheduleTime } from '@/lib/date-format';
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
  const primary = tenant.branding.primaryColor || '#7c3aed';

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
    setServiceIds((prev) => {
      const a = uniqueMultiServiceIds(prev).slice().sort().join(',');
      const b = uniqueMultiServiceIds(resolved).slice().sort().join(',');
      return a === b ? prev : resolved;
    });
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
  const [providers, setProviders] = useState<Array<{ id: string; name: string; earliestStartTime?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [includeLaterDays, setIncludeLaterDays] = useState(false);
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
          setError((err as Error)?.message || 'Could not load available times');
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
      currency: selectedServices[0]?.currency ?? 'USD',
    }),
    [selectedServices, tenant.multiService?.turnoverBufferMinutes],
  );

  useEffect(() => {
    if (!serviceSelectionKey) return;

    const requestId = ++suggestRequestRef.current;
    userPickedDateRef.current = false;
    selectedStartRef.current = null;
    setSelectedStart(null);
    setEmployeeId(null);
    setDateKey('');
    dateKeyRef.current = '';
    setSlots([]);
    setProviders([]);
    setIncludeLaterDays(false);
    setLoading(true);
    setSlotsLoading(true);
    setError(null);

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
        setError((err as Error)?.message || 'Could not find an available block');
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
      if (!nextDate || !serviceSelectionKey) return;
      void loadDaySlots(nextDate, serviceSelectionKey.split(','), null);
    },
    [loadDaySlots, serviceSelectionKey],
  );

  useEffect(() => {
    if (!selectedStart || serviceIds.length < 2) return;

    const ids = uniqueMultiServiceIds(serviceIds);
    void getPublicMultiServiceProviders(slug, ids, selectedStart, includeLaterDays)
      .then((result) => setProviders(result.providers))
      .catch(() => setProviders([]));
  }, [includeLaterDays, selectedStart, serviceIds, slug]);

  const onContinue = useCallback(() => {
    if (!selectedStart || !employeeId) return;
    const provider = providers.find((entry) => entry.id === employeeId);
    const q = new URLSearchParams({
      services: uniqueMultiServiceIds(serviceIds).join(','),
      startTime: selectedStart,
      employeeId,
    });
    if (provider?.name) {
      q.set('employeeName', provider.name);
    }
    router.push(`${bookPath(slug, '/multi/checkout')}?${q.toString()}`);
  }, [employeeId, providers, router, selectedStart, serviceIds, slug]);

  return (
    <>
      <PublicHeader tenant={tenant} showBack backHref={servicesPickerHref} />
      <main className="max-w-lg mx-auto px-4 py-6 pb-32 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('public.multiServicePickBlock')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('public.multiServicePickBlockHint')}</p>
        </div>

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
                  {formatPrice(service.price, service.currency)}
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

        <div>
          <label className="label">{t('public.dateLabel')}</label>
          <input
            type="date"
            className="input"
            value={dateKey}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          {slotsLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('public.multiServiceFindingBlock')}
            </div>
          )}
          {slots.length === 0 && dateKey && !loading && !slotsLoading && (
            <p className="text-sm text-gray-500">{t('public.noSlotsThisDay')}</p>
          )}
          {slots.map((slot) => {
            const selected = selectedStart === slot.startTime;
            return (
              <button
                key={`${slot.startTime}-${slot.employeeId}`}
                type="button"
                onClick={() => {
                  setSelectedStart(slot.startTime);
                  setEmployeeId(slot.employeeId);
                }}
                className={`w-full text-left p-3 rounded-xl border ${
                  selected ? 'border-violet-400 bg-violet-50' : 'border-gray-100'
                }`}
              >
                {formatDateDisplay(slot.startTime, locale)} · {formatScheduleTime(slot.startTime)} ·{' '}
                {slot.employeeName}
              </button>
            );
          })}
        </div>

        {selectedStart && slots.some((slot) => slot.startTime === selectedStart) && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeLaterDays}
                onChange={(e) => setIncludeLaterDays(e.target.checked)}
              />
              {t('public.multiServiceLaterProviders')}
            </label>
            {providers.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => setEmployeeId(provider.id)}
                className={`w-full text-left p-3 rounded-xl border ${
                  employeeId === provider.id ? 'border-violet-400 bg-violet-50' : 'border-gray-100'
                }`}
              >
                {provider.name}
                {provider.earliestStartTime && includeLaterDays && (
                  <span className="text-gray-500 text-sm ml-2">
                    · {formatDateDisplay(provider.earliestStartTime, locale)}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
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
