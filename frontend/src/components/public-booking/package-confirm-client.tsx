'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PublicHeader } from '@/components/public-booking/public-header';
import { FixedActionBar } from '@/components/public-booking/fixed-action-bar';
import { BookingDayStrip } from '@/components/public-booking/booking-day-strip';
import { BookingTimeSlotGrid } from '@/components/public-booking/booking-time-slot-grid';
import {
  formatDuration,
  formatPublicMoney,
  getPublicPackageBlockSlots,
  getPublicPackageProviders,
  suggestPublicPackageBlock,
  type PublicBusinessProfile,
  type PublicServicePackage,
} from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { formatDateDisplay, formatScheduleTime, toDateKey } from '@/lib/date-format';
import { buildBookingDayOptions } from '@/lib/booking-day-options';
import { useI18n } from '@/i18n';
import { resolvePackageItemPricing } from '@/lib/package-item-pricing';
import { buildPackageLinesFromBlockStart, expandPackageServiceItems } from '@/lib/package-booking';

interface PackageConfirmClientProps {
  slug: string;
  tenant: PublicBusinessProfile;
  pkg: PublicServicePackage;
  backHref: string;
}

export function PackageConfirmClient({ slug, tenant, pkg, backHref }: PackageConfirmClientProps) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const tz = tenant.timezone || 'UTC';
  const primary = tenant.branding.primaryColor || '#7c3aed';
  const money = (amount: number, entityCurrency?: string | null) =>
    formatPublicMoney(amount, entityCurrency, tenant.currency, locale);
  const turnover = tenant.multiService?.turnoverBufferMinutes ?? 5;
  const dayOptions = useMemo(() => buildBookingDayOptions(tz, undefined, locale), [tz, locale]);

  const expandedItems = useMemo(() => expandPackageServiceItems(pkg), [pkg]);
  const pricedItems = useMemo(() => resolvePackageItemPricing(pkg), [pkg]);
  const pricedByServiceId = useMemo(
    () => new Map(pricedItems.map((item) => [item.serviceId, item])),
    [pricedItems],
  );

  const totalDuration = useMemo(() => {
    const base = expandedItems.reduce(
      (sum, item) => sum + item.durationMinutes + item.bufferMinutes,
      0,
    );
    if (expandedItems.length <= 1) return base;
    return base + (expandedItems.length - 1) * turnover;
  }, [expandedItems, turnover]);

  const [dateKey, setDateKey] = useState('');
  const [slots, setSlots] = useState<Array<{ startTime: string; employeeId: string; employeeName: string }>>([]);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string | null>(null);
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

  const loadDaySlots = useCallback(
    async (day: string, preferredStart?: string | null) => {
      const requestId = ++slotsRequestRef.current;
      setSlotsLoading(true);
      try {
        const result = await getPublicPackageBlockSlots(slug, pkg.id, day);
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
          setEmployeeName(chosen.employeeName);
          setError(null);
        } else {
          selectedStartRef.current = null;
          setSelectedStart(null);
          setEmployeeId(null);
          setEmployeeName(null);
        }
      } catch (err: unknown) {
        if (slotsRequestRef.current === requestId) {
          setSlots([]);
          selectedStartRef.current = null;
          setSelectedStart(null);
          setEmployeeId(null);
          setEmployeeName(null);
          setError((err as Error)?.message || t('common.errorGeneric'));
        }
      } finally {
        if (slotsRequestRef.current === requestId) {
          setSlotsLoading(false);
        }
      }
    },
    [pkg.id, slug, t],
  );

  useEffect(() => {
    const requestId = ++suggestRequestRef.current;
    userPickedDateRef.current = false;
    selectedStartRef.current = null;
    queueMicrotask(() => {
      setSelectedStart(null);
      setEmployeeId(null);
      setEmployeeName(null);
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

    void (async () => {
      try {
        const suggested = await suggestPublicPackageBlock(slug, pkg.id);
        if (suggestRequestRef.current !== requestId) return;

        if (!userPickedDateRef.current) {
          setDateKey(suggested.dateKey);
          dateKeyRef.current = suggested.dateKey;
          selectedStartRef.current = suggested.startTime;
          setSelectedStart(suggested.startTime);
          setEmployeeId(suggested.employeeId);
          setEmployeeName(suggested.employeeName);
        }
        setError(null);

        const dayToLoad = userPickedDateRef.current ? dateKeyRef.current : suggested.dateKey;
        if (dayToLoad) {
          await loadDaySlots(
            dayToLoad,
            userPickedDateRef.current ? null : suggested.startTime,
          );
        }
      } catch (err: unknown) {
        if (suggestRequestRef.current !== requestId) return;
        setError((err as Error)?.message || t('public.packageNoBlock'));
        const today = new Date().toISOString().slice(0, 10);
        if (!userPickedDateRef.current) {
          setDateKey(today);
          dateKeyRef.current = today;
        }
        const dayToLoad = userPickedDateRef.current ? dateKeyRef.current : today;
        if (dayToLoad) {
          await loadDaySlots(dayToLoad);
        }
      } finally {
        if (suggestRequestRef.current === requestId) setLoading(false);
      }
    })();
  }, [loadDaySlots, pkg.id, slug, t]);

  const onDateChange = useCallback(
    (nextDate: string) => {
      userPickedDateRef.current = true;
      setDateKey(nextDate);
      dateKeyRef.current = nextDate;
      selectedStartRef.current = null;
      setSelectedStart(null);
      setEmployeeId(null);
      setEmployeeName(null);
      setProviderPickerOpen(false);
      if (!nextDate) return;
      void loadDaySlots(nextDate, null);
    },
    [loadDaySlots],
  );

  const onSelectStartTime = useCallback(
    (startTime: string) => {
      selectedStartRef.current = startTime;
      setSelectedStart(startTime);
      const slot = slots.find((entry) => entry.startTime === startTime);
      if (slot) {
        setEmployeeId(slot.employeeId);
        setEmployeeName(slot.employeeName);
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
    return employeeName ?? selectedSlot?.employeeName ?? '';
  }, [availableProviders, employeeId, employeeName, selectedSlot?.employeeName]);

  useEffect(() => {
    if (!selectedStart) {
      queueMicrotask(() => setSlotProviders([]));
      queueMicrotask(() => setLaterProviders([]));
      return;
    }

    let cancelled = false;

    void Promise.all([
      getPublicPackageProviders(slug, pkg.id, selectedStart, false),
      getPublicPackageProviders(slug, pkg.id, selectedStart, true),
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
  }, [pkg.id, selectedStart, slug]);

  const onSelectProvider = useCallback(
    (providerId: string) => {
      setEmployeeId(providerId);
      const provider = availableProviders.find((entry) => entry.id === providerId);
      if (provider?.name) {
        setEmployeeName(provider.name);
      }
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

  const sequentialLines = useMemo(() => {
    if (!selectedStart || !employeeId) return [];
    return buildPackageLinesFromBlockStart(expandedItems, selectedStart, employeeId, turnover);
  }, [employeeId, expandedItems, selectedStart, turnover]);

  const onContinue = useCallback(() => {
    if (!selectedStart || !employeeId || sequentialLines.length === 0) return;
    const q = new URLSearchParams({
      lines: JSON.stringify(sequentialLines),
      ...(selectedProviderName ? { employeeName: selectedProviderName } : {}),
    });
    router.push(`${bookPath(slug, `/packages/${pkg.id}/checkout`)}?${q.toString()}`);
  }, [employeeId, pkg.id, router, selectedProviderName, sequentialLines, slug]);

  return (
    <>
      <PublicHeader tenant={tenant} showBack backHref={backHref} />
      <main className="max-w-lg mx-auto px-4 py-6 pb-32 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('public.selectDateTime')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('public.packageScheduleEach')}</p>
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
          <p className="text-sm font-medium text-gray-500 mb-1">{t('public.packageIncludedServices')}</p>
          <p className="font-medium text-gray-900 mb-3">{pkg.name}</p>
          <div className="flex flex-wrap gap-3 text-sm mb-4">
            <span className="font-semibold text-gray-900">
              {money(pkg.pricing.packagePrice, pkg.currency)}
            </span>
            <span className="text-gray-400 line-through">
              {money(pkg.pricing.regularTotal, pkg.currency)}
            </span>
            <span className="text-emerald-700 font-medium">
              {t('public.packageSavePercent', { percent: pkg.pricing.savingsPercent.toFixed(0) })}
            </span>
          </div>
          <ul className="space-y-3">
            {expandedItems.map((item, index) => {
              const scheduled = sequentialLines[index];
              const priced = pricedByServiceId.get(item.serviceId);
              const discountedUnit =
                priced && priced.quantity > 0
                  ? priced.discountedLineTotal / priced.quantity
                  : priced?.unitPrice;
              const savingsUnit =
                priced && priced.quantity > 0 ? priced.lineSavings / priced.quantity : priced?.lineSavings;

              return (
                <li key={`${item.serviceId}:${index}`} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{item.serviceName}</p>
                    <p className="text-sm text-gray-500">
                      {formatDuration(item.durationMinutes + item.bufferMinutes)}
                      {scheduled && (
                        <span className="ml-2">
                          · {formatScheduleTime(scheduled.startTime)}
                        </span>
                      )}
                    </p>
                    {discountedUnit != null && (
                      <p className="text-sm mt-1">
                        <span className="font-medium text-gray-900">
                          {money(discountedUnit, pkg.currency)}
                        </span>
                        {savingsUnit != null && savingsUnit > 0 && (
                          <>
                            <span className="text-gray-400 line-through ml-2">
                              {money(priced!.unitPrice, pkg.currency)}
                            </span>
                            <span className="text-emerald-700 font-medium ml-2">
                              {t('public.packageItemSave', {
                                amount: money(savingsUnit, pkg.currency),
                              })}
                            </span>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex justify-between mt-4 pt-4 border-t border-gray-50 text-sm">
            <span className="font-semibold text-gray-900">{t('public.total')}</span>
            <span className="font-semibold text-gray-900">
              {formatDuration(totalDuration)} · {money(pkg.pricing.packagePrice, pkg.currency)}
            </span>
          </div>
        </section>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('public.packageFindingSlots')}
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
        disabled={!selectedStart || !employeeId || loading || slotsLoading}
        label={t('public.packageContinueCheckout')}
        onClick={onContinue}
      />
    </>
  );
}
