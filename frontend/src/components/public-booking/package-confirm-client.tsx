'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PublicHeader } from '@/components/public-booking/public-header';
import { FixedActionBar } from '@/components/public-booking/fixed-action-bar';
import {
  formatDuration,
  formatPrice,
  getPublicPackageBlockSlots,
  getPublicPackageProviders,
  suggestPublicPackageBlock,
  type PublicBusinessProfile,
  type PublicServicePackage,
} from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { formatDateDisplay, formatScheduleTime } from '@/lib/date-format';
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
  const primary = tenant.branding.primaryColor || '#7c3aed';
  const turnover = tenant.multiService?.turnoverBufferMinutes ?? 5;

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
    setSelectedStart(null);
    setEmployeeId(null);
    setEmployeeName(null);
    setDateKey('');
    dateKeyRef.current = '';
    setSlots([]);
    setProviders([]);
    setIncludeLaterDays(false);
    setLoading(true);
    setSlotsLoading(true);
    setError(null);

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
      if (!nextDate) return;
      void loadDaySlots(nextDate, null);
    },
    [loadDaySlots],
  );

  useEffect(() => {
    if (!selectedStart) return;
    void getPublicPackageProviders(slug, pkg.id, selectedStart, includeLaterDays)
      .then((result) => setProviders(result.providers))
      .catch(() => setProviders([]));
  }, [includeLaterDays, pkg.id, selectedStart, slug]);

  const sequentialLines = useMemo(() => {
    if (!selectedStart || !employeeId) return [];
    return buildPackageLinesFromBlockStart(expandedItems, selectedStart, employeeId, turnover);
  }, [employeeId, expandedItems, selectedStart, turnover]);

  const onContinue = useCallback(() => {
    if (!selectedStart || !employeeId || sequentialLines.length === 0) return;
    const q = new URLSearchParams({
      lines: JSON.stringify(sequentialLines),
      ...(employeeName ? { employeeName } : {}),
    });
    router.push(`${bookPath(slug, `/packages/${pkg.id}/checkout`)}?${q.toString()}`);
  }, [employeeId, employeeName, pkg.id, router, sequentialLines, selectedStart, slug]);

  return (
    <>
      <PublicHeader tenant={tenant} showBack backHref={backHref} />
      <main className="max-w-lg mx-auto px-4 py-6 pb-32 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pkg.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('public.packageScheduleEach')}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <span className="font-semibold text-gray-900">
              {formatPrice(pkg.pricing.packagePrice, pkg.currency)}
            </span>
            <span className="text-gray-400 line-through">
              {formatPrice(pkg.pricing.regularTotal, pkg.currency)}
            </span>
            <span className="text-emerald-700 font-medium">
              Save {pkg.pricing.savingsPercent.toFixed(0)}%
            </span>
          </div>
        </div>

        <section className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-sm font-medium text-gray-500 mb-3">{t('public.packageIncludedServices')}</p>
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
                        <span className="ml-2 text-violet-700">
                          · {formatScheduleTime(scheduled.startTime)}
                        </span>
                      )}
                    </p>
                    {discountedUnit != null && (
                      <p className="text-sm mt-1">
                        <span className="font-medium text-gray-900">
                          {formatPrice(discountedUnit, pkg.currency)}
                        </span>
                        {savingsUnit != null && savingsUnit > 0 && (
                          <>
                            <span className="text-gray-400 line-through ml-2">
                              {formatPrice(priced!.unitPrice, pkg.currency)}
                            </span>
                            <span className="text-emerald-700 font-medium ml-2">
                              {t('public.packageItemSave', {
                                amount: formatPrice(savingsUnit, pkg.currency),
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
              {formatDuration(totalDuration)} · {formatPrice(pkg.pricing.packagePrice, pkg.currency)}
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
              {t('public.packageFindingSlots')}
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
                  setEmployeeName(slot.employeeName);
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
                onClick={() => {
                  setEmployeeId(provider.id);
                  setEmployeeName(provider.name);
                }}
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
        disabled={!selectedStart || !employeeId || loading || slotsLoading}
        label={t('public.packageContinueCheckout')}
        onClick={onContinue}
      />
    </>
  );
}
