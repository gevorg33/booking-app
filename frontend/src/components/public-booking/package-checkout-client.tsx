'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Loader2, Pencil } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { PublicHeader } from '@/components/public-booking/public-header';
import { PhoneInput } from '@/components/public-booking/phone-input';
import { AppointmentReminderPicker } from '@/components/public-booking/appointment-reminder-picker';
import {
  bookPublicPackage,
  confirmPublicBookingPayment,
  createPublicPackageCheckout,
  formatDuration,
  formatPrice,
  getPublicCustomerLoyalty,
  quotePublicPackage,
  type PublicBusinessProfile,
  type PublicCheckoutQuote,
  type PublicCustomerLoyalty,
  type PublicServicePackage,
} from '@/lib/public-api';
import { defaultCountryFromCallingCode, formatPhoneForApi, isValidPhone } from '@/lib/phone-format';
import { formatDateDisplay, formatScheduleTime } from '@/lib/date-format';
import { useI18n } from '@/i18n';
import { usePublicCustomerAuth } from '@/lib/public-customer-auth';
import { ToggleChoice } from '@/components/ui/radio-choice';
import { expandPackageServiceItems } from '@/lib/package-booking';
import { resolvePackageItemPricing } from '@/lib/package-item-pricing';
import { bookPath } from '@/lib/tenant-host';

interface PackageCheckoutClientProps {
  slug: string;
  tenant: PublicBusinessProfile;
  pkg: PublicServicePackage;
  backHref: string;
  paymentSessionId?: string;
}

type PackageLinePayload = { serviceId: string; employeeId: string; startTime: string };

const inputClassName =
  'w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 bg-white';

export function PackageCheckoutClient({
  slug,
  tenant,
  pkg,
  backHref,
  paymentSessionId,
}: PackageCheckoutClientProps) {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const { customer, loading: authLoading } = usePublicCustomerAuth();
  const primary = tenant.branding.primaryColor || '#7c3aed';
  const defaultPhoneCountry = defaultCountryFromCallingCode(tenant.defaultPhoneCountryCode);
  const turnover = tenant.multiService?.turnoverBufferMinutes ?? 5;

  const lines = useMemo(() => {
    const raw = searchParams.get('lines');
    if (!raw) return [] as PackageLinePayload[];
    try {
      return JSON.parse(raw) as PackageLinePayload[];
    } catch {
      return [];
    }
  }, [searchParams]);

  const employeeName = searchParams.get('employeeName')?.trim() || null;

  const expandedItems = useMemo(() => expandPackageServiceItems(pkg), [pkg]);
  const pricedItems = useMemo(() => resolvePackageItemPricing(pkg), [pkg]);

  const totalDuration = useMemo(() => {
    const base = expandedItems.reduce(
      (sum, item) => sum + item.durationMinutes + item.bufferMinutes,
      0,
    );
    if (expandedItems.length <= 1) return base;
    return base + (expandedItems.length - 1) * turnover;
  }, [expandedItems, turnover]);

  const scheduleStart = lines[0]?.startTime;
  const scheduleEnd = useMemo(() => {
    if (!scheduleStart) return null;
    return new Date(new Date(scheduleStart).getTime() + totalDuration * 60_000);
  }, [scheduleStart, totalDuration]);

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
    if (!pkg.id) return;
    let cancelled = false;
    const requestId = ++quoteRequestId.current;
    setQuoteLoading(true);
    setQuoteError(null);
    void quotePublicPackage(slug, {
      packageId: pkg.id,
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
      .catch((err: unknown) => {
        if (cancelled || requestId !== quoteRequestId.current) return;
        setQuote(null);
        setQuoteError((err as Error)?.message || t('common.errorGeneric'));
      })
      .finally(() => {
        if (!cancelled && requestId === quoteRequestId.current) {
          setQuoteLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [appliedPromo, loyaltyPoints, pkg.id, slug, t]);

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

  const amountDue = quote?.amountDue ?? pkg.pricing.packagePrice;
  const checkoutSubtotal = quote?.subtotal ?? pkg.pricing.packagePrice;
  const hasDiscounts = (quote?.totalDiscount ?? 0) > 0;
  const requiresPayment = tenant.onlinePaymentsEnabled && amountDue > 0;
  const promoApplied =
    !!appliedPromo &&
    (!quote ||
      quote.promoCode?.toUpperCase() === appliedPromo.toUpperCase() ||
      quote.giftCardCode?.toUpperCase() === appliedPromo.toUpperCase() ||
      quote.promoDiscount > 0 ||
      quote.giftCardDiscount > 0);

  const fullPhone = () => formatPhoneForApi(form.phone);

  const payload = useMemo(
    () => ({
      packageId: pkg.id,
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
    [appliedPromo, form, lines, loyaltyPoints, pkg.id],
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
    const quoteSubtotal = quote?.subtotal ?? pkg.pricing.packagePrice;
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
    if (lines.length === 0) {
      setError(t('public.missingAppointmentSchedule'));
      return;
    }

    setSubmitting(true);
    try {
      if (requiresPayment) {
        const checkout = await createPublicPackageCheckout(slug, payload);
        window.location.href = checkout.url;
        return;
      }
      await bookPublicPackage(slug, payload);
      setSuccess(true);
    } catch (err: unknown) {
      setError((err as Error)?.message || t('public.bookingFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    const confirmedTotal = quote?.amountDue ?? pkg.pricing.packagePrice;

    return (
      <>
        <PublicHeader tenant={tenant} />
        <main className="max-w-lg mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4 text-2xl">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t('public.packageBookedTitle')}</h1>
            <p className="text-gray-600 mt-2">{t('public.packageBookedHint')}</p>
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
                  {employeeName && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {t('public.multiServiceWithProvider').replace('{name}', employeeName)}
                    </p>
                  )}
                </div>
              </div>
            )}

            <p className="text-sm font-medium text-gray-500 mb-1">{t('public.packageIncludedServices')}</p>
            <p className="font-medium text-gray-900 mb-3">{pkg.name}</p>
            <ul className="space-y-3">
              {expandedItems.map((item, index) => {
                const line = lines[index];
                const priced = pricedItems.find((entry) => entry.serviceId === item.serviceId);
                const discountedUnit =
                  priced && priced.quantity > 0
                    ? priced.discountedLineTotal / priced.quantity
                    : priced?.unitPrice;

                return (
                  <li
                    key={`${item.serviceId}:${index}`}
                    className="flex items-start justify-between gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{item.serviceName}</p>
                      <p className="text-sm text-gray-500">
                        {formatDuration(item.durationMinutes + item.bufferMinutes)}
                      </p>
                      {line && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDateDisplay(line.startTime, locale)} · {formatScheduleTime(line.startTime)}
                        </p>
                      )}
                    </div>
                    {discountedUnit != null && (
                      <p className="font-medium text-gray-900 shrink-0">
                        {formatPrice(discountedUnit, pkg.currency)}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="flex justify-between mt-4 pt-4 border-t border-gray-100">
              <span className="font-semibold text-gray-900">{t('public.total')}</span>
              <span className="font-semibold text-gray-900">
                {formatPrice(confirmedTotal, pkg.currency)}
              </span>
            </div>
          </section>

          <div className="text-center mt-8">
            <a
              href={bookPath(slug)}
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
        <form onSubmit={onSubmit} className="pb-44">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('public.checkoutTitle')}</h1>

          {employeeName && (
            <section className="border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full text-white flex items-center justify-center font-semibold shrink-0"
                    style={{ backgroundColor: primary }}
                  >
                    {employeeName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{employeeName}</p>
                  </div>
                </div>
                <a
                  href={backHref}
                  className="text-gray-400 hover:text-gray-600 shrink-0"
                  aria-label={t('public.selectSpecialist')}
                >
                  <Pencil className="w-4 h-4" />
                </a>
              </div>
            </section>
          )}

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
                  href={backHref}
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
              <p className="text-sm font-medium text-gray-500">{pkg.name}</p>
              <a
                href={backHref}
                className="text-gray-400 hover:text-gray-600 shrink-0"
                aria-label={t('public.packageIncludedServices')}
              >
                <Pencil className="w-4 h-4" />
              </a>
            </div>
            <ul className="space-y-3">
              {expandedItems.map((item, index) => {
                const line = lines[index];
                const priced = pricedItems.find((entry) => entry.serviceId === item.serviceId);
                const discountedUnit =
                  priced && priced.quantity > 0
                    ? priced.discountedLineTotal / priced.quantity
                    : priced?.unitPrice;
                const savingsUnit =
                  priced && priced.quantity > 0 ? priced.lineSavings / priced.quantity : priced?.lineSavings;
                const regularUnit = priced?.unitPrice;

                return (
                  <li key={`${item.serviceId}:${index}`} className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">{item.serviceName}</p>
                      <p className="text-sm text-gray-500">
                        {formatDuration(item.durationMinutes + item.bufferMinutes)}
                      </p>
                      {line && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatScheduleTime(line.startTime)}
                        </p>
                      )}
                    </div>
                    {discountedUnit != null && (
                      <div className="text-right shrink-0">
                        <p className="font-medium text-gray-900">
                          {formatPrice(discountedUnit, pkg.currency)}
                        </p>
                        {regularUnit != null && savingsUnit != null && savingsUnit > 0 && (
                          <>
                            <p className="text-sm text-gray-400 line-through">
                              {formatPrice(regularUnit, pkg.currency)}
                            </p>
                            <p className="text-xs text-emerald-700 font-medium">
                              {t('public.packageItemSave', {
                                amount: formatPrice(savingsUnit, pkg.currency),
                              })}
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="flex justify-between mt-4 pt-4 border-t border-gray-50">
              <span className="font-semibold text-gray-900">{t('public.total')}</span>
              <span className="font-semibold text-gray-900">
                {formatPrice(checkoutSubtotal, pkg.currency)}
              </span>
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-400">
              <span>{t('public.regularPrice')}</span>
              <span className="line-through">{formatPrice(pkg.pricing.regularTotal, pkg.currency)}</span>
            </div>
            {quote && hasDiscounts && (
              <div className="mt-3 space-y-1 text-sm">
                {quote.promoDiscount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>{t('public.discountPromo')}</span>
                    <span>-{formatPrice(quote.promoDiscount, pkg.currency)}</span>
                  </div>
                )}
                {quote.giftCardDiscount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>{t('public.discountGiftCard')}</span>
                    <span>-{formatPrice(quote.giftCardDiscount, pkg.currency)}</span>
                  </div>
                )}
                {quote.loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>{t('public.discountLoyalty')}</span>
                    <span>-{formatPrice(quote.loyaltyDiscount, pkg.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-gray-900 pt-1">
                  <span>{amountDue <= 0 ? t('public.freeAfterDiscounts') : t('public.totalDue')}</span>
                  <span>{formatPrice(amountDue, pkg.currency)}</span>
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
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 uppercase placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
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
                    .replace('{value}', formatPrice(loyalty.pointsValue, pkg.currency))}
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    max={loyalty.pointsBalance}
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
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

          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('public.personalInformation')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('public.nameLabel')}</label>
              <input
                className={inputClassName}
                placeholder={t('public.enterNamePlaceholder')}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('public.emailLabel')}</label>
              <input
                type="email"
                className={inputClassName}
                placeholder={t('public.enterEmailPlaceholder')}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('public.commentLabel')}</label>
              <textarea
                className={`${inputClassName} min-h-[80px]`}
                placeholder={t('public.commentPlaceholder')}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="mt-2 space-y-1 border-t border-gray-100 pt-4 mb-2">
              {reminderOptions?.enabled && (
                <AppointmentReminderPicker
                  optionsHours={reminderOptions.optionsHours}
                  value={form.reminderHoursBefore}
                  onChange={(reminderHoursBefore) => setForm({ ...form, reminderHoursBefore })}
                />
              )}
              <ToggleChoice
                checked={form.emailReminders}
                onChange={(emailReminders) => setForm({ ...form, emailReminders })}
                primaryColor={primary}
                label={t('public.emailRemindersCheckout')}
              />
              <ToggleChoice
                checked={form.whatsappReminders}
                onChange={(whatsappReminders) => setForm({ ...form, whatsappReminders })}
                primaryColor={primary}
                label={t('public.whatsappReminders')}
              />
              <ToggleChoice
                checked={form.consent}
                onChange={(consent) => setForm({ ...form, consent })}
                primaryColor={primary}
                label={t('public.privacyConsent')}
              />
              <ToggleChoice
                checked={form.marketingOptIn}
                onChange={(marketingOptIn) => setForm({ ...form, marketingOptIn })}
                primaryColor={primary}
                label={t('public.marketingOptIn')}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
            <div className="max-w-lg mx-auto">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-500">
                  {amountDue <= 0 && hasDiscounts ? t('public.freeAfterDiscounts') : t('public.totalDue')}
                </span>
                <span className="font-semibold text-gray-900">{formatPrice(amountDue, pkg.currency)}</span>
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
                    ? t('public.packagePayAndBook')
                    : t('public.confirmBooking')}
              </button>
            </div>
          </div>
        </form>
      </main>
    </>
  );
}
