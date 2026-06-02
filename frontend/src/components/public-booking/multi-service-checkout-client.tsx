'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Loader2, Pencil, Trash2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PublicHeader } from '@/components/public-booking/public-header';
import { PhoneInput } from '@/components/public-booking/phone-input';
import { AppointmentReminderPicker } from '@/components/public-booking/appointment-reminder-picker';
import {
  bookPublicMultiService,
  confirmPublicBookingPayment,
  createPublicMultiServiceCheckout,
  formatDuration,
  formatPrice,
  getPublicCustomerLoyalty,
  getPublicProviders,
  quotePublicMultiService,
  type PublicBusinessProfile,
  type PublicCheckoutQuote,
  type PublicCustomerLoyalty,
  type PublicService,
} from '@/lib/public-api';
import { defaultCountryFromCallingCode, formatPhoneForApi, isValidPhone } from '@/lib/phone-format';
import { useI18n } from '@/i18n';
import { usePublicCustomerAuth } from '@/lib/public-customer-auth';
import { formatDateDisplay, formatScheduleTime } from '@/lib/date-format';
import { bookPath } from '@/lib/tenant-host';
import {
  buildMultiServicePickerHref,
  buildMultiServiceScheduleHref,
  persistMultiServiceCart,
  resolveMultiServiceCartFromLocation,
  resolvePathAfterRemovingService,
  sumMultiServiceDuration,
  sumMultiServicePrice,
  uniqueMultiServiceIds,
} from '@/lib/multi-service-booking';

interface MultiServiceCheckoutClientProps {
  slug: string;
  tenant: PublicBusinessProfile;
  services: PublicService[];
  backHref: string;
  paymentSessionId?: string;
}

type ScheduleLine = {
  serviceId: string;
  employeeId: string;
  startTime: string;
  employeeName?: string;
};

const inputClassName =
  'w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400';

export function MultiServiceCheckoutClient({
  slug,
  tenant,
  services,
  backHref,
  paymentSessionId,
}: MultiServiceCheckoutClientProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { customer, loading: authLoading } = usePublicCustomerAuth();
  const primary = tenant.branding.primaryColor || '#7c3aed';
  const defaultPhoneCountry = defaultCountryFromCallingCode(tenant.defaultPhoneCountryCode);

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
      const q = new URLSearchParams(searchParams.toString());
      q.set('services', resolved.join(','));
      router.replace(`${bookPath(slug, '/multi/checkout')}?${q.toString()}`, { scroll: false });
    }
  }, [router, searchParams, services, slug]);

  const selectedServices = useMemo(
    () =>
      serviceIds
        .map((id) => services.find((svc) => svc.id === id))
        .filter(Boolean) as PublicService[],
    [serviceIds, services],
  );

  const blockStartTime = searchParams.get('startTime') ?? undefined;
  const linesRaw = searchParams.get('lines');

  const lines = useMemo(() => {
    if (!linesRaw) return undefined;
    try {
      return JSON.parse(linesRaw) as ScheduleLine[];
    } catch {
      return undefined;
    }
  }, [linesRaw]);

  const reminderOptions = tenant.appointmentReminders;
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: undefined as string | undefined,
    notes: '',
    consent: false,
    marketingOptIn: false,
    emailReminders: true,
    whatsappReminders: true,
    reminderHoursBefore: reminderOptions?.defaultHours ?? null,
  });
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loyalty, setLoyalty] = useState<PublicCustomerLoyalty | null>(null);
  const [quote, setQuote] = useState<PublicCheckoutQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const quoteRequestId = useRef(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [providerById, setProviderById] = useState<Record<string, string>>({});

  const blockEmployeeId = searchParams.get('employeeId') ?? undefined;
  const blockEmployeeNameParam = searchParams.get('employeeName') ?? undefined;

  const schedulingMode = tenant.multiService?.schedulingMode ?? 'same_visit';

  const servicesPickerHref = useMemo(
    () => buildMultiServicePickerHref(slug, serviceIds),
    [serviceIds, slug],
  );

  const scheduleEditHref = useMemo(
    () => buildMultiServiceScheduleHref(slug, serviceIds, schedulingMode),
    [schedulingMode, serviceIds, slug],
  );

  const removeService = useCallback(
    (removeId: string) => {
      router.push(resolvePathAfterRemovingService(slug, serviceIds, removeId, schedulingMode));
    },
    [router, schedulingMode, serviceIds, slug],
  );

  const subtotal = sumMultiServicePrice(selectedServices);
  const currency = selectedServices[0]?.currency ?? 'USD';
  const turnover = tenant.multiService?.turnoverBufferMinutes ?? 5;
  const totalDuration = sumMultiServiceDuration(selectedServices, turnover);

  const scheduleStart = blockStartTime ?? lines?.[0]?.startTime;
  const scheduleEnd = useMemo(() => {
    if (!scheduleStart) return null;
    return new Date(new Date(scheduleStart).getTime() + totalDuration * 60_000);
  }, [scheduleStart, totalDuration]);

  const resolveProviderName = useCallback(
    (employeeId?: string, employeeName?: string) => {
      if (employeeName?.trim()) return employeeName.trim();
      if (employeeId && providerById[employeeId]) return providerById[employeeId];
      return undefined;
    },
    [providerById],
  );

  const blockEmployeeName = useMemo(
    () => resolveProviderName(blockEmployeeId, blockEmployeeNameParam),
    [blockEmployeeId, blockEmployeeNameParam, resolveProviderName],
  );

  const bookedServiceLines = useMemo(() => {
    if (lines?.length) {
      return selectedServices.map((service) => {
        const entry = lines.find((line) => line.serviceId === service.id);
        return {
          service,
          startTime: entry?.startTime,
          employeeName: resolveProviderName(entry?.employeeId, entry?.employeeName),
        };
      });
    }
    if (!blockStartTime) {
      return selectedServices.map((service) => ({ service, startTime: undefined, employeeName: undefined }));
    }
    let cursor = new Date(blockStartTime);
    return selectedServices.map((service, index) => {
      const startTime = cursor.toISOString();
      const lineMinutes = service.durationMinutes + (service.bufferMinutes ?? 0);
      cursor = new Date(cursor.getTime() + lineMinutes * 60_000);
      if (index < selectedServices.length - 1) {
        cursor = new Date(cursor.getTime() + turnover * 60_000);
      }
      return { service, startTime, employeeName: blockEmployeeName };
    });
  }, [
    blockEmployeeName,
    blockStartTime,
    lines,
    resolveProviderName,
    selectedServices,
    turnover,
  ]);

  const confirmedTotal = quote?.amountDue ?? subtotal;

  useEffect(() => {
    void getPublicProviders(slug)
      .then(({ providers }) => {
        setProviderById(Object.fromEntries(providers.map((provider) => [provider.id, provider.name])));
      })
      .catch(() => setProviderById({}));
  }, [slug]);

  useEffect(() => {
    if (authLoading || !customer) return;
    setForm((prev) => ({
      ...prev,
      name: prev.name || customer.name,
      email: prev.email || customer.email || '',
      phone: prev.phone || customer.phone || undefined,
    }));
  }, [authLoading, customer]);

  useEffect(() => {
    if (!customer) {
      setLoyalty(null);
      return;
    }
    void getPublicCustomerLoyalty(slug)
      .then(setLoyalty)
      .catch(() => setLoyalty(null));
  }, [customer, slug]);

  useEffect(() => {
    if (serviceIds.length < 2) return;
    let cancelled = false;
    const requestId = ++quoteRequestId.current;
    setQuoteLoading(true);
    setQuoteError(null);
    void quotePublicMultiService(slug, {
      serviceIds,
      promoCode: appliedPromo || undefined,
      loyaltyPointsToRedeem: loyaltyPoints > 0 ? loyaltyPoints : undefined,
    })
      .then((res) => {
        if (cancelled || requestId !== quoteRequestId.current) return;
        setQuote(res);
        if (res.loyaltyPointsToRedeem !== loyaltyPoints) {
          setLoyaltyPoints(res.loyaltyPointsToRedeem);
        }
        if (
          appliedPromo &&
          (res.promoCode?.toUpperCase() === appliedPromo.toUpperCase() ||
            res.giftCardCode?.toUpperCase() === appliedPromo.toUpperCase())
        ) {
          setPromoError(null);
        }
      })
      .catch((err) => {
        if (cancelled || requestId !== quoteRequestId.current) return;
        setQuote(null);
        const message = err instanceof Error ? err.message : t('public.quoteFailed');
        setQuoteError(message);
        if (appliedPromo && /promo|gift card/i.test(message)) {
          setAppliedPromo('');
          setPromoError(message);
        }
      })
      .finally(() => {
        if (!cancelled && requestId === quoteRequestId.current) {
          setQuoteLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [appliedPromo, loyaltyPoints, serviceIds, slug, t]);

  useEffect(() => {
    if (!paymentSessionId) return;
    void (async () => {
      setSubmitting(true);
      try {
        await confirmPublicBookingPayment(slug, paymentSessionId);
        setSuccess(true);
      } catch (err: unknown) {
        setError((err as Error)?.message || t('public.bookingFailed'));
      } finally {
        setSubmitting(false);
      }
    })();
  }, [paymentSessionId, slug, t]);

  const amountDue = quote?.amountDue ?? subtotal;
  const checkoutSubtotal = quote?.subtotal ?? subtotal;
  const hasDiscounts = (quote?.totalDiscount ?? 0) > 0;
  const requiresPayment = tenant.onlinePaymentsEnabled && amountDue > 0;
  const promoApplied =
    !!appliedPromo &&
    !!quote &&
    (quote.promoCode?.toUpperCase() === appliedPromo.toUpperCase() ||
      (quote.giftCardCode?.toUpperCase() === appliedPromo.toUpperCase() &&
        quote.giftCardDiscount > 0) ||
      quote.promoDiscount > 0 ||
      quote.giftCardDiscount > 0);

  const fullPhone = () => formatPhoneForApi(form.phone);

  const payload = useMemo(
    () => ({
      serviceIds,
      blockStartTime,
      employeeId: searchParams.get('employeeId') ?? undefined,
      lines,
      notes: form.notes || undefined,
      promoCode: appliedPromo || undefined,
      loyaltyPointsToRedeem: loyaltyPoints > 0 ? loyaltyPoints : undefined,
      customer: {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: fullPhone() || undefined,
        emailReminders: form.emailReminders,
        whatsappReminders: form.whatsappReminders,
        ...(reminderOptions?.enabled ? { reminderHoursBefore: form.reminderHoursBefore } : {}),
        privacyConsentAccepted: form.consent,
        marketingOptIn: form.marketingOptIn,
      },
    }),
    [appliedPromo, blockStartTime, form, lines, loyaltyPoints, searchParams, serviceIds],
  );

  function applyPromoCode() {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    setPromoError(null);
    setQuoteError(null);
    setAppliedPromo(code);
  }

  function clearPromoCode() {
    setAppliedPromo('');
    setPromoCode('');
    setPromoError(null);
  }

  function useMaxLoyaltyPoints() {
    const balance = quote?.loyaltyPointsBalance ?? loyalty?.pointsBalance ?? 0;
    const promoDiscount = quote?.promoDiscount ?? 0;
    const giftCardDiscount = quote?.giftCardDiscount ?? 0;
    const quoteSubtotal = quote?.subtotal ?? subtotal;
    const redeemable =
      quote?.afterGiftCard ??
      Math.max(0, (quote?.afterPromo ?? quoteSubtotal - promoDiscount) - giftCardDiscount);
    if (balance <= 0 || redeemable <= 0) return;
    setLoyaltyPoints(Math.round(Math.min(balance, redeemable) * 100) / 100);
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError(t('public.nameRequired'));
      return;
    }
    if (!form.email.trim() && !fullPhone()) {
      setError(t('public.contactRequired'));
      return;
    }
    if (form.phone?.trim() && !isValidPhone(form.phone)) {
      setError(t('public.phoneInvalid'));
      return;
    }
    if (form.whatsappReminders && !fullPhone()) {
      setError(t('public.whatsappPhoneRequired'));
      return;
    }
    if (!form.consent) {
      setError(t('public.consentRequired'));
      return;
    }
    if (!blockStartTime && !lines?.length) {
      setError('Missing appointment schedule');
      return;
    }

    setSubmitting(true);
    try {
      if (requiresPayment) {
        const checkout = await createPublicMultiServiceCheckout(slug, payload);
        window.location.href = checkout.url;
        return;
      }
      await bookPublicMultiService(slug, payload);
      setSuccess(true);
    } catch (err: unknown) {
      setError((err as Error)?.message || t('public.bookingFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <>
        <PublicHeader tenant={tenant} />
        <main className="max-w-lg mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4 text-2xl">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t('public.multiServiceBookedTitle')}</h1>
            <p className="text-gray-600 mt-2">{t('public.multiServiceBookedHint')}</p>
          </div>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm text-left">
            {scheduleStart && (
              <div className="flex items-start gap-3 pb-4 mb-4 border-b border-gray-100">
                <Calendar className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    {formatDateDisplay(scheduleStart, locale)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatScheduleTime(scheduleStart)}
                    {scheduleEnd ? ` – ${formatScheduleTime(scheduleEnd.toISOString())}` : ''}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">{formatDuration(totalDuration)}</p>
                  {blockEmployeeName && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {t('public.multiServiceWithProvider').replace('{name}', blockEmployeeName)}
                    </p>
                  )}
                </div>
              </div>
            )}

            <p className="text-sm font-medium text-gray-500 mb-3">{t('public.servicesSection')}</p>
            <ul className="space-y-3">
              {bookedServiceLines.map(({ service, startTime, employeeName }) => {
                const lineMinutes = service.durationMinutes + (service.bufferMinutes ?? 0);
                return (
                  <li
                    key={service.id}
                    className="flex items-start justify-between gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="text-sm text-gray-500">{formatDuration(lineMinutes)}</p>
                      {startTime && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDateDisplay(startTime, locale)} · {formatScheduleTime(startTime)}
                        </p>
                      )}
                      {employeeName && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {t('public.multiServiceWithProvider').replace('{name}', employeeName)}
                        </p>
                      )}
                    </div>
                    <p className="font-medium text-gray-900 shrink-0">
                      {formatPrice(service.price, service.currency)}
                    </p>
                  </li>
                );
              })}
            </ul>

            <div className="flex justify-between mt-4 pt-4 border-t border-gray-100">
              <span className="font-semibold text-gray-900">
                {confirmedTotal <= 0 && hasDiscounts ? t('public.freeAfterDiscounts') : t('public.total')}
              </span>
              <span className="font-semibold text-gray-900">
                {formatPrice(confirmedTotal, currency)}
              </span>
            </div>
          </section>

          <div className="text-center mt-8">
            <a
              href={bookPath(slug)}
              onClick={() => persistMultiServiceCart(slug, [])}
              className="inline-block px-6 py-3 rounded-2xl text-white font-semibold"
              style={{ backgroundColor: primary }}
            >
              {t('public.bookAnother')}
            </a>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <PublicHeader tenant={tenant} showBack backHref={backHref} />
      <main className="max-w-lg mx-auto px-4 py-6">
        <form onSubmit={onSubmit} className="pb-36">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('public.checkoutTitle')}</h1>

          {scheduleStart && (
            <section className="border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Calendar className="w-5 h-5 text-gray-400 shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatDateDisplay(scheduleStart, locale)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatScheduleTime(scheduleStart)}
                      {scheduleEnd ? ` – ${formatScheduleTime(scheduleEnd.toISOString())}` : ''}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">{formatDuration(totalDuration)}</p>
                  </div>
                </div>
                <a
                  href={scheduleEditHref}
                  className="text-gray-400 hover:text-gray-600 shrink-0"
                  aria-label={t('public.multiServiceEditSchedule')}
                >
                  <Pencil className="w-4 h-4" />
                </a>
              </div>
            </section>
          )}

          <section className="border-b border-gray-100 pb-4 mb-6">
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
              {selectedServices.map((service) => {
                const line = lines?.find((entry) => entry.serviceId === service.id);
                const lineMinutes = service.durationMinutes + service.bufferMinutes;
                return (
                  <li key={service.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="text-sm text-gray-500">{formatDuration(lineMinutes)}</p>
                      {line && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDateDisplay(line.startTime, locale)} · {formatScheduleTime(line.startTime)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-start gap-2 shrink-0">
                      <p className="font-medium text-gray-900 pt-0.5">
                        {formatPrice(service.price, service.currency)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeService(service.id)}
                        className="text-gray-400 hover:text-red-600 p-0.5"
                        aria-label={t('public.multiServiceRemoveService', { name: service.name })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="flex justify-between mt-4 pt-4 border-t border-gray-50">
              <span className="font-semibold text-gray-900">{t('public.total')}</span>
              <span className="font-semibold text-gray-900">
                {formatPrice(checkoutSubtotal, currency)}
              </span>
            </div>
            {quote && hasDiscounts && (
              <div className="mt-3 space-y-1 text-sm">
                {quote.promoDiscount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>{t('public.discountPromo')}</span>
                    <span>-{formatPrice(quote.promoDiscount, currency)}</span>
                  </div>
                )}
                {quote.giftCardDiscount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>{t('public.discountGiftCard')}</span>
                    <span>-{formatPrice(quote.giftCardDiscount, currency)}</span>
                  </div>
                )}
                {quote.loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>{t('public.discountLoyalty')}</span>
                    <span>-{formatPrice(quote.loyaltyDiscount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-gray-900 pt-1">
                  <span>{amountDue <= 0 ? t('public.freeAfterDiscounts') : t('public.totalDue')}</span>
                  <span>{formatPrice(amountDue, currency)}</span>
                </div>
              </div>
            )}
            {quote && quote.pointsToEarn > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {t('public.pointsToEarn').replace('{points}', String(quote.pointsToEarn))}
              </p>
            )}
          </section>

          <section className="border-b border-gray-100 pb-4 mb-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('public.promoCode')}</h2>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 uppercase"
                placeholder={t('public.promoCodePlaceholder')}
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              />
              <button
                type="button"
                onClick={applyPromoCode}
                className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('public.applyPromo')}
              </button>
            </div>
            {promoApplied && (
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-green-700">
                  Applied: {quote?.giftCardCode ?? quote?.promoCode ?? appliedPromo}
                </p>
                <button
                  type="button"
                  onClick={clearPromoCode}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Remove
                </button>
              </div>
            )}
            {(promoError || quoteError) && (
              <p className="text-xs text-red-600">{promoError ?? quoteError}</p>
            )}

            {customer && loyalty && loyalty.pointsBalance > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('public.loyaltyPoints')}
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  {t('public.loyaltyBalance')
                    .replace('{points}', loyalty.pointsBalance.toFixed(2))
                    .replace('{value}', formatPrice(loyalty.pointsValue, currency))}
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    max={loyalty.pointsBalance}
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm"
                    value={loyaltyPoints || ''}
                    onChange={(e) => setLoyaltyPoints(Math.max(0, parseFloat(e.target.value) || 0))}
                    step="0.01"
                  />
                  <button
                    type="button"
                    onClick={useMaxLoyaltyPoints}
                    className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {t('public.useMaxPoints')}
                  </button>
                </div>
              </div>
            )}
            {quoteLoading && <p className="text-xs text-gray-400">{t('public.submitting')}</p>}
          </section>

          <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                className={inputClassName}
                placeholder="Enter name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <PhoneInput
              label={t('public.phone')}
              placeholder={t('public.phonePlaceholder')}
              searchPlaceholder={t('public.phoneCountrySearch')}
              searchNotFound={t('public.phoneCountryNotFound')}
              defaultCountry={defaultPhoneCountry}
              locale={locale}
              value={form.phone}
              onChange={(phone) => setForm({ ...form, phone })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                className={inputClassName}
                placeholder="Enter email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
              <textarea
                className={`${inputClassName} min-h-[80px]`}
                placeholder="Comment"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <label className="flex items-start gap-3 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.emailReminders}
                onChange={(e) => setForm({ ...form, emailReminders: e.target.checked })}
                className="mt-1 rounded border-gray-300"
              />
              <span>Send me email reminders about this appointment</span>
            </label>
            <label className="flex items-start gap-3 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.whatsappReminders}
                onChange={(e) => setForm({ ...form, whatsappReminders: e.target.checked })}
                className="mt-1 rounded border-gray-300"
              />
              <span>{t('public.whatsappReminders')}</span>
            </label>
            {reminderOptions?.enabled && (
              <AppointmentReminderPicker
                optionsHours={reminderOptions.optionsHours}
                value={form.reminderHoursBefore}
                onChange={(reminderHoursBefore) => setForm({ ...form, reminderHoursBefore })}
              />
            )}
            <label className="flex items-start gap-3 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                className="mt-1 rounded border-gray-300"
              />
              <span>{t('public.privacyConsent')}</span>
            </label>
            <label className="flex items-start gap-3 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.marketingOptIn}
                onChange={(e) => setForm({ ...form, marketingOptIn: e.target.checked })}
                className="mt-1 rounded border-gray-300"
              />
              <span>{t('public.marketingOptIn')}</span>
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 p-4">
            <div className="max-w-lg mx-auto">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-500">
                  {amountDue <= 0 && hasDiscounts ? t('public.freeAfterDiscounts') : t('public.totalDue')}
                </span>
                <span className="font-semibold text-gray-900">{formatPrice(amountDue, currency)}</span>
              </div>
              <button
                type="submit"
                disabled={submitting || quoteLoading}
                className="w-full py-3.5 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: primary }}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting
                  ? t('public.submitting')
                  : requiresPayment
                    ? t('public.multiServicePayAndBook')
                    : t('public.confirmBooking')}
              </button>
            </div>
          </div>
        </form>
      </main>
    </>
  );
}
