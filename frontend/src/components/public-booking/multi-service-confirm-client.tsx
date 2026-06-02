'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PublicHeader } from '@/components/public-booking/public-header';
import { FixedActionBar } from '@/components/public-booking/fixed-action-bar';
import {
  formatDuration,
  formatPrice,
  getPublicServiceDaySlots,
  suggestPublicMultiServiceLines,
  type PublicBusinessProfile,
  type PublicService,
} from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { formatDateDisplay, formatScheduleTime } from '@/lib/date-format';
import { useI18n } from '@/i18n';
import {
  sumMultiServicePrice,
  resolveMultiServiceCartFromLocation,
  persistMultiServiceCart,
  buildMultiServicePickerHref,
} from '@/lib/multi-service-booking';

interface LineState {
  key: string;
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  employeeId: string;
  employeeName: string;
  startTime: string;
  dateKey: string;
}

interface MultiServiceConfirmClientProps {
  slug: string;
  tenant: PublicBusinessProfile;
  services: PublicService[];
  backHref: string;
}

export function MultiServiceConfirmClient({
  slug,
  tenant,
  services,
  backHref,
}: MultiServiceConfirmClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useI18n();
  const primary = tenant.branding.primaryColor || '#7c3aed';

  const serviceIds = useMemo(
    () => resolveMultiServiceCartFromLocation(slug, searchParams.get('services'), services),
    [searchParams, services, slug],
  );

  useEffect(() => {
    const resolved = resolveMultiServiceCartFromLocation(
      slug,
      searchParams.get('services'),
      services,
    );
    if (resolved.length < 2) {
      router.replace(
        resolved.length > 0 ? buildMultiServicePickerHref(slug, resolved) : bookPath(slug, '/any'),
      );
      return;
    }
    persistMultiServiceCart(slug, resolved);
    if (!searchParams.get('services')) {
      const q = new URLSearchParams({ services: resolved.join(',') });
      router.replace(`${bookPath(slug, '/multi/confirm')}?${q.toString()}`, { scroll: false });
    }
  }, [router, searchParams, services, slug]);

  const selectedServices = useMemo(
    () =>
      serviceIds
        .map((id) => services.find((svc) => svc.id === id))
        .filter(Boolean) as PublicService[],
    [serviceIds, services],
  );

  const [lines, setLines] = useState<LineState[]>([]);
  const [loadingDefaults, setLoadingDefaults] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPrice = sumMultiServicePrice(selectedServices);
  const currency = selectedServices[0]?.currency ?? 'USD';

  useEffect(() => {
    setLines(
      selectedServices.map((svc) => ({
        key: svc.id,
        serviceId: svc.id,
        serviceName: svc.name,
        durationMinutes: svc.durationMinutes + svc.bufferMinutes,
        employeeId: '',
        employeeName: '',
        startTime: '',
        dateKey: '',
      })),
    );
    setLoadingDefaults(true);
    setError(null);

    let cancelled = false;
    void (async () => {
      try {
        const suggested = await suggestPublicMultiServiceLines(slug, serviceIds);
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
  }, [selectedServices, serviceIds, slug, t]);

  const allScheduled = useMemo(
    () => lines.every((line) => line.startTime && line.employeeId),
    [lines],
  );

  const updateLine = useCallback((key: string, patch: Partial<LineState>) => {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }, []);

  const loadSlotsForLine = useCallback(
    async (line: LineState, dateKey: string) => {
      const { slots } = await getPublicServiceDaySlots(slug, line.serviceId, dateKey);
      const first = slots[0];
      if (!first) {
        updateLine(line.key, { dateKey, startTime: '', employeeId: '', employeeName: '' });
        return;
      }
      updateLine(line.key, {
        dateKey,
        startTime: first.startTime,
        employeeId: first.employeeId,
        employeeName: first.employeeName,
      });
    },
    [slug, updateLine],
  );

  const onContinue = useCallback(() => {
    const q = new URLSearchParams({
      services: serviceIds.join(','),
      lines: JSON.stringify(
        lines.map((line) => ({
          serviceId: line.serviceId,
          employeeId: line.employeeId,
          employeeName: line.employeeName,
          startTime: line.startTime,
        })),
      ),
    });
    router.push(`${bookPath(slug, '/multi/checkout')}?${q.toString()}`);
  }, [lines, router, serviceIds, slug]);

  return (
    <>
      <PublicHeader tenant={tenant} showBack backHref={backHref} />
      <main className="max-w-lg mx-auto px-4 py-6 pb-32 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('public.multiServiceConfirmTitle')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('public.packageScheduleEach')}</p>
          <p className="mt-2 font-semibold text-gray-900">{formatPrice(totalPrice, currency)}</p>
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
                <p className="text-sm text-gray-500">{formatDuration(line.durationMinutes)}</p>
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
