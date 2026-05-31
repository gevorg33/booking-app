'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PublicHeader } from '@/components/public-booking/public-header';
import { FixedActionBar } from '@/components/public-booking/fixed-action-bar';
import {
  getPublicServiceDaySlots,
  getPublicServiceSlotProviders,
  suggestPublicPackageSlots,
  type PublicBusinessProfile,
  type PublicServicePackage,
  formatDuration,
  formatPrice,
} from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { formatDateDisplay, formatScheduleTime } from '@/lib/date-format';
import { useI18n } from '@/i18n';
import { resolvePackageItemPricing } from '@/lib/package-item-pricing';

interface PackageLineState {
  key: string;
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  employeeId: string;
  employeeName: string;
  startTime: string;
  dateKey: string;
}

interface PackageConfirmClientProps {
  slug: string;
  tenant: PublicBusinessProfile;
  pkg: PublicServicePackage;
  backHref: string;
}

function expandPackageLines(pkg: PublicServicePackage): PackageLineState[] {
  const lines: PackageLineState[] = [];
  for (const item of pkg.items) {
    for (let i = 0; i < item.quantity; i++) {
      lines.push({
        key: `${item.serviceId}:${i}`,
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        durationMinutes: item.durationMinutes,
        employeeId: '',
        employeeName: '',
        startTime: '',
        dateKey: '',
      });
    }
  }
  return lines;
}

export function PackageConfirmClient({ slug, tenant, pkg, backHref }: PackageConfirmClientProps) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const primary = tenant.branding.primaryColor || '#7c3aed';
  const [lines, setLines] = useState<PackageLineState[]>(() => expandPackageLines(pkg));
  const [loadingDefaults, setLoadingDefaults] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pricedItems = useMemo(() => resolvePackageItemPricing(pkg), [pkg]);
  const pricedByServiceId = useMemo(
    () => new Map(pricedItems.map((item) => [item.serviceId, item])),
    [pricedItems],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const suggested = await suggestPublicPackageSlots(slug, pkg.id);
        if (cancelled) return;
        setLines((prev) =>
          prev.map((line, index) => {
            const slot = suggested.lines[index];
            if (!slot) return line;
            return {
              ...line,
              employeeId: slot.employeeId,
              employeeName: slot.employeeName,
              startTime: slot.startTime,
              dateKey: slot.startTime.slice(0, 10),
            };
          }),
        );
      } catch (err: unknown) {
        if (!cancelled) setError((err as Error)?.message || t('common.errorGeneric'));
      } finally {
        if (!cancelled) setLoadingDefaults(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pkg.id, slug, t]);

  const allScheduled = useMemo(
    () => lines.every((line) => line.startTime && line.employeeId),
    [lines],
  );

  const updateLine = useCallback((key: string, patch: Partial<PackageLineState>) => {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }, []);

  const loadSlotsForLine = useCallback(
    async (line: PackageLineState, dateKey: string) => {
      const { slots } = await getPublicServiceDaySlots(slug, line.serviceId, dateKey);
      const first = slots[0];
      if (!first) {
        updateLine(line.key, { dateKey, startTime: '', employeeId: '', employeeName: '' });
        return;
      }
      const { providers } = await getPublicServiceSlotProviders(slug, line.serviceId, first.startTime);
      const provider = providers[0];
      updateLine(line.key, {
        dateKey,
        startTime: first.startTime,
        employeeId: provider?.id ?? first.employeeId,
        employeeName: provider?.name ?? first.employeeName,
      });
    },
    [slug, updateLine],
  );

  const onContinue = useCallback(() => {
    const q = new URLSearchParams({
      lines: JSON.stringify(
        lines.map((line) => ({
          serviceId: line.serviceId,
          employeeId: line.employeeId,
          startTime: line.startTime,
        })),
      ),
    });
    router.push(`${bookPath(slug, `/packages/${pkg.id}/checkout`)}?${q.toString()}`);
  }, [lines, pkg.id, router, slug]);

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

        {loadingDefaults && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('public.packageFindingSlots')}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="space-y-4">
          {lines.map((line, index) => (
            <div key={line.key} className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">Service {index + 1}</p>
                <p className="font-medium text-gray-900">{line.serviceName}</p>
                <p className="text-sm text-gray-500">
                  {formatDuration(line.durationMinutes)}
                  {(() => {
                    const item = pricedByServiceId.get(line.serviceId);
                    if (!item) return null;
                    const discountedUnit =
                      item.quantity > 0 ? item.discountedLineTotal / item.quantity : item.unitPrice;
                    const savingsUnit =
                      item.quantity > 0 ? item.lineSavings / item.quantity : item.lineSavings;
                    return (
                      <span className="ml-2 inline-flex flex-wrap items-center gap-x-2">
                        <span className="font-medium text-gray-900">
                          {formatPrice(discountedUnit, pkg.currency)}
                        </span>
                        {savingsUnit > 0 && (
                          <>
                            <span className="text-gray-400 line-through">
                              {formatPrice(item.unitPrice, pkg.currency)}
                            </span>
                            <span className="text-emerald-700 font-medium">
                              {t('public.packageItemSave', {
                                amount: formatPrice(savingsUnit, pkg.currency),
                              })}
                            </span>
                          </>
                        )}
                      </span>
                    );
                  })()}
                </p>
              </div>
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  className="input"
                  value={line.dateKey}
                  onChange={(e) => void loadSlotsForLine(line, e.target.value)}
                />
              </div>
              {line.startTime && (
                <div className="text-sm text-gray-700">
                  <p>
                    {formatDateDisplay(line.startTime, locale)} · {formatScheduleTime(line.startTime)}
                  </p>
                  <p className="text-gray-500">with {line.employeeName || 'Any available specialist'}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
      <FixedActionBar
        primaryColor={primary}
        disabled={!allScheduled || loadingDefaults}
        label={t('public.packageContinueCheckout')}
        onClick={onContinue}
      />
    </>
  );
}
