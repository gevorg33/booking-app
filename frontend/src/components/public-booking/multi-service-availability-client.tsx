'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
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
import { sumMultiServiceDuration, sumMultiServicePrice } from '@/lib/multi-service-booking';

interface MultiServiceAvailabilityClientProps {
  slug: string;
  tenant: PublicBusinessProfile;
  services: PublicService[];
  backHref: string;
}

export function MultiServiceAvailabilityClient({
  slug,
  tenant,
  services,
  backHref,
}: MultiServiceAvailabilityClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useI18n();
  const primary = tenant.branding.primaryColor || '#7c3aed';

  const serviceIds = useMemo(() => {
    const raw = searchParams.get('services');
    if (!raw) return services.map((svc) => svc.id);
    return raw.split(',').filter(Boolean);
  }, [searchParams, services]);

  const selectedServices = useMemo(
    () => services.filter((svc) => serviceIds.includes(svc.id)),
    [serviceIds, services],
  );

  const [dateKey, setDateKey] = useState('');
  const [slots, setSlots] = useState<Array<{ startTime: string; employeeId: string; employeeName: string }>>([]);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [providers, setProviders] = useState<Array<{ id: string; name: string; earliestStartTime?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [includeLaterDays, setIncludeLaterDays] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    void (async () => {
      try {
        const suggested = await suggestPublicMultiServiceBlock(slug, serviceIds);
        setDateKey(suggested.dateKey);
        setSelectedStart(suggested.startTime);
        setEmployeeId(suggested.employeeId);
      } catch (err: unknown) {
        setError((err as Error)?.message || t('common.errorGeneric'));
      } finally {
        setLoading(false);
      }
    })();
  }, [serviceIds, slug, t]);

  useEffect(() => {
    if (!dateKey) return;
    void getPublicMultiServiceBlockSlots(slug, serviceIds, dateKey)
      .then((result) => setSlots(result.slots))
      .catch(() => setSlots([]));
  }, [dateKey, serviceIds, slug]);

  useEffect(() => {
    if (!selectedStart) return;
    void getPublicMultiServiceProviders(slug, serviceIds, selectedStart, includeLaterDays)
      .then((result) => setProviders(result.providers))
      .catch(() => setProviders([]));
  }, [includeLaterDays, selectedStart, serviceIds, slug]);

  const onContinue = useCallback(() => {
    if (!selectedStart || !employeeId) return;
    const q = new URLSearchParams({
      services: serviceIds.join(','),
      startTime: selectedStart,
      employeeId,
    });
    router.push(`${bookPath(slug, '/multi/checkout')}?${q.toString()}`);
  }, [employeeId, router, selectedStart, serviceIds, slug]);

  return (
    <>
      <PublicHeader tenant={tenant} showBack backHref={backHref} />
      <main className="max-w-lg mx-auto px-4 py-6 pb-32 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('public.multiServicePickBlock')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {selectedServices.map((svc) => svc.name).join(' + ')}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            {formatDuration(totals.duration)} · {formatPrice(totals.price, totals.currency)}
          </p>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('public.multiServiceFindingBlock')}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={dateKey} onChange={(e) => setDateKey(e.target.value)} />
        </div>

        <div className="space-y-2">
          {slots.map((slot) => {
            const selected = selectedStart === slot.startTime;
            return (
              <button
                key={slot.startTime}
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

        {selectedStart && (
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
