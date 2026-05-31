'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, Pencil, Loader2, Users } from 'lucide-react';
import { formatScheduleTime, formatDateDisplay } from '@/lib/date-format';
import {
  createPublicBooking,
  createPublicBookingCheckout,
  confirmPublicBookingPayment,
  formatPrice,
  prepaymentDue,
  quotePublicBooking,
  getPublicCustomerLoyalty,
  getPublicServiceSubscriptionPlans,
  getPublicActiveSubscription,
  type PublicBusinessProfile,
  type PublicService,
  type PublicCheckoutQuote,
  type PublicCustomerLoyalty,
  type PublicSubscriptionPlan,
  type PublicCustomerSubscription,
} from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { useI18n } from '@/i18n';
import { usePublicCustomerAuth } from '@/lib/public-customer-auth';
import { PhoneInput } from '@/components/public-booking/phone-input';
import {
  SpecialistPickerSheet,
  type SpecialistChoice,
} from '@/components/public-booking/specialist-picker-sheet';
import { defaultCountryFromCallingCode, formatPhoneForApi, isValidPhone } from '@/lib/phone-format';

interface CheckoutFormProps {
  tenant: PublicBusinessProfile;
  employee?: { id: string; name: string; role?: string };
  service: PublicService;
  startTime: string;
  autoAssign?: boolean;
  paymentSessionId?: string;
}

export function CheckoutForm({
  tenant,
  employee,
  service,
  startTime,
  autoAssign,
  paymentSessionId,
}: CheckoutFormProps) {
  const { t, locale } = useI18n();
  const { customer, loading: authLoading } = usePublicCustomerAuth();
  const primary = tenant.branding.primaryColor || '#7c3aed';
  const dueNow = prepaymentDue(service);
  const defaultPhoneCountry = defaultCountryFromCallingCode(tenant.defaultPhoneCountryCode);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: undefined as string | undefined,
    notes: '',
    consent: false,
    marketingOptIn: false,
    emailReminders: true,
    whatsappReminders: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [specialistPickerOpen, setSpecialistPickerOpen] = useState(false);
  const [specialistChoice, setSpecialistChoice] = useState<SpecialistChoice>(() =>
    autoAssign ? { type: 'any' } : { type: 'provider', provider: { id: employee!.id, name: employee!.name, role: employee?.role, averageRating: null, reviewCount: 0 } },
  );
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loyalty, setLoyalty] = useState<PublicCustomerLoyalty | null>(null);
  const [quote, setQuote] = useState<PublicCheckoutQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const quoteRequestId = useRef(0);
  const [purchaseType, setPurchaseType] = useState<'one-time' | 'subscription'>('one-time');
  const [subscriptionPlans, setSubscriptionPlans] = useState<PublicSubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [activeSubscription, setActiveSubscription] = useState<PublicCustomerSubscription | null>(null);
  const [useExistingSubscription, setUseExistingSubscription] = useState(true);

  const resolvedEmployee =
    specialistChoice.type === 'provider'
      ? {
          id: specialistChoice.provider.id,
          name: specialistChoice.provider.name,
          role: specialistChoice.provider.role,
        }
      : employee;
  const useAutoAssign = autoAssign && specialistChoice.type === 'any';

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
      setActiveSubscription(null);
      return;
    }
    void getPublicCustomerLoyalty(tenant.slug)
      .then(setLoyalty)
      .catch(() => setLoyalty(null));
    void getPublicActiveSubscription(tenant.slug, service.id)
      .then((res) => {
        setActiveSubscription(res.subscription);
        if (res.subscription && res.subscription.appointmentsRemaining > 0) {
          setUseExistingSubscription(true);
        }
      })
      .catch(() => setActiveSubscription(null));
  }, [customer, tenant.slug, service.id]);

  useEffect(() => {
    if (!service.hasSubscriptionPlans) {
      setSubscriptionPlans([]);
      return;
    }
    void getPublicServiceSubscriptionPlans(tenant.slug, service.id)
      .then(setSubscriptionPlans)
      .catch(() => setSubscriptionPlans([]));
  }, [service.hasSubscriptionPlans, service.id, tenant.slug]);

  useEffect(() => {
    let cancelled = false;
    const requestId = ++quoteRequestId.current;
    setQuoteLoading(true);
    setQuoteError(null);
    void quotePublicBooking(tenant.slug, {
      serviceId: service.id,
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
        const codeRelated = /promo|gift card/i.test(message);
        if (appliedPromo && codeRelated) {
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
  }, [tenant.slug, service.id, appliedPromo, loyaltyPoints, customer?.id, t]);

  useEffect(() => {
    if (!paymentSessionId) return;
    let cancelled = false;
    (async () => {
      setSubmitting(true);
      try {
        await confirmPublicBookingPayment(tenant.slug, paymentSessionId);
        if (!cancelled) setSuccess(true);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('public.bookingFailed'));
        }
      } finally {
        if (!cancelled) setSubmitting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [paymentSessionId, tenant.slug, t]);

  const start = new Date(startTime);
  const totalMin = service.durationMinutes + service.bufferMinutes;
  const end = new Date(start.getTime() + totalMin * 60000);

  const fullPhone = () => formatPhoneForApi(form.phone);

  const payload = () => ({
    ...(useAutoAssign || !resolvedEmployee ? {} : { employeeId: resolvedEmployee.id }),
    serviceId: service.id,
    startTime,
    notes: form.notes || undefined,
    promoCode: appliedPromo || undefined,
    loyaltyPointsToRedeem: loyaltyPoints > 0 ? loyaltyPoints : undefined,
    ...(usingSubscriptionCredit
      ? { useSubscriptionId: activeSubscription!.id }
      : purchaseType === 'subscription' && selectedPlanId
        ? { purchasePlanId: selectedPlanId, useSubscriptionCreditOnPurchase: true }
        : {}),
    customer: {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: fullPhone() || undefined,
      emailReminders: form.emailReminders,
      whatsappReminders: form.whatsappReminders,
      privacyConsentAccepted: form.consent,
      marketingOptIn: form.marketingOptIn,
    },
  });

  const chargeBase = dueNow > 0 ? dueNow : service.price;
  const usingSubscriptionCredit =
    Boolean(activeSubscription?.appointmentsRemaining) &&
    useExistingSubscription &&
    purchaseType === 'one-time';
  const selectedPlan = subscriptionPlans.find((p) => p.id === selectedPlanId);
  const subscriptionCheckoutPrice =
    purchaseType === 'subscription' && selectedPlan
      ? selectedPlan.preview.pricing.subscriptionPrice
      : 0;
  const amountDue = usingSubscriptionCredit
    ? 0
    : purchaseType === 'subscription' && selectedPlan
      ? subscriptionCheckoutPrice
      : quote?.amountDue ?? chargeBase;
  const hasDiscounts = (quote?.totalDiscount ?? 0) > 0;
  const promoApplied =
    !!appliedPromo &&
    (!quote ||
      quote.promoCode?.toUpperCase() === appliedPromo.toUpperCase() ||
      quote.giftCardCode?.toUpperCase() === appliedPromo.toUpperCase() ||
      quote.promoDiscount > 0 ||
      quote.giftCardDiscount > 0);

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
    const subtotal = quote?.subtotal ?? chargeBase;
    const redeemable =
      quote?.afterGiftCard ??
      Math.max(0, (quote?.afterPromo ?? subtotal - promoDiscount) - giftCardDiscount);
    if (balance <= 0 || redeemable <= 0) return;
    setLoyaltyPoints(Math.round(Math.min(balance, redeemable) * 100) / 100);
  }

  async function handleSubmit(e: React.FormEvent) {
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

    setSubmitting(true);
    try {
      if (amountDue > 0 && (dueNow > 0 || purchaseType === 'subscription')) {
        const { url } = await createPublicBookingCheckout(tenant.slug, payload());
        window.location.href = url;
        return;
      }
      await createPublicBooking(tenant.slug, payload());
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('public.bookingFailed'));
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4 text-2xl">
          ✓
        </div>
        <h2 className="text-xl font-semibold text-gray-900">{t('public.appointmentBooked')}</h2>
        <p className="text-gray-500 mt-2 text-sm">
          {formatDateDisplay(start)} · {formatScheduleTime(start)} – {formatScheduleTime(end)}
        </p>
        <p className="text-gray-500 mt-3 text-sm max-w-sm mx-auto">{t('public.reviewAfterVisitHint')}</p>
        <a
          href={bookPath(tenant.slug)}
          className="inline-block mt-8 px-6 py-3 rounded-2xl text-white font-semibold"
          style={{ backgroundColor: primary }}
        >
          {t('public.bookAnother')}
        </a>
      </div>
    );
  }

  const servicesHref = resolvedEmployee
    ? `${bookPath(tenant.slug, '/services')}?employeeId=${encodeURIComponent(resolvedEmployee.id)}&startTime=${encodeURIComponent(startTime)}`
    : `${bookPath(tenant.slug, '/any/availability')}?serviceId=${encodeURIComponent(service.id)}`;
  const timeEditHref = autoAssign
    ? `${bookPath(tenant.slug, '/any/availability')}?serviceId=${encodeURIComponent(service.id)}`
    : bookPath(tenant.slug, '/professionals');

  const showProviderPicker = autoAssign;

  return (
    <>
    <form onSubmit={handleSubmit} className="pb-36">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('public.checkoutTitle')}</h1>

      <section className="border-b border-gray-100 pb-4 mb-4">
        {showProviderPicker ? (
          <button
            type="button"
            onClick={() => setSpecialistPickerOpen(true)}
            className="w-full flex items-center justify-between gap-3 text-left rounded-xl -mx-1 px-1 py-1 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              {useAutoAssign ? (
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-gray-500" />
                </div>
              ) : (
                <div
                  className="w-10 h-10 rounded-full text-white flex items-center justify-center font-semibold shrink-0"
                  style={{ backgroundColor: primary }}
                >
                  {resolvedEmployee!.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-gray-900">
                  {useAutoAssign ? t('public.anySpecialist') : resolvedEmployee!.name}
                </p>
                {useAutoAssign ? (
                  <p className="text-sm text-gray-500">{t('public.assignedAutomatically')}</p>
                ) : (
                  resolvedEmployee?.role && (
                    <p className="text-sm text-gray-500">{resolvedEmployee.role}</p>
                  )
                )}
              </div>
            </div>
            <Pencil className="w-4 h-4 text-gray-400 shrink-0" />
          </button>
        ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-full text-white flex items-center justify-center font-semibold shrink-0"
              style={{ backgroundColor: primary }}
            >
              {employee!.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900">{employee!.name}</p>
              {employee?.role && <p className="text-sm text-gray-500">{employee.role}</p>}
            </div>
          </div>
          <a href={bookPath(tenant.slug, '/professionals')} className="text-gray-400 hover:text-gray-600">
            <Pencil className="w-4 h-4" />
          </a>
        </div>
        )}
      </section>

      <section className="border-b border-gray-100 pb-4 mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">
                {start.toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  timeZone: tenant.timezone || 'UTC',
                })}
              </p>
              <p className="text-sm text-gray-500">{formatScheduleTime(start)}</p>
            </div>
          </div>
          <a href={timeEditHref} className="text-gray-400 hover:text-gray-600">
            <Pencil className="w-4 h-4" />
          </a>
        </div>
      </section>

      <section className="border-b border-gray-100 pb-4 mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Services</p>
            <p className="font-medium text-gray-900">{service.name}</p>
            <p className="text-sm text-gray-500 mt-1">{formatPrice(service.price, service.currency)}</p>
          </div>
          <a href={servicesHref} className="text-gray-400 hover:text-gray-600 mt-1">
            <Pencil className="w-4 h-4" />
          </a>
        </div>
        <div className="flex justify-between mt-4 pt-4 border-t border-gray-50">
          <span className="font-semibold text-gray-900">{t('public.total')}</span>
          <span className="font-semibold text-gray-900">
            {usingSubscriptionCredit
              ? formatPrice(0, service.currency)
              : purchaseType === 'subscription' && selectedPlan
                ? formatPrice(selectedPlan.preview.pricing.subscriptionPrice, service.currency)
                : formatPrice(service.price, service.currency)}
          </span>
        </div>
        {(usingSubscriptionCredit || purchaseType === 'subscription') && (
          <p className="text-sm text-emerald-700 mt-2">
            {usingSubscriptionCredit
              ? `Using subscription — ${Math.max(0, (activeSubscription?.appointmentsRemaining ?? 1) - 1)} visits left after this booking`
              : selectedPlan
                ? `Plan includes ${selectedPlan.includedAppointments} visits — first visit ${selectedPlan.preview.pricing.perAppointmentPrice ? `(${formatPrice(selectedPlan.preview.pricing.perAppointmentPrice, service.currency)} effective)` : 'included'}`
                : null}
          </p>
        )}
        {dueNow > 0 && (
          <p className="text-sm text-violet-700 mt-2">
            {t('public.totalDue')}: {formatPrice(dueNow, service.currency)}
            {service.prepaymentMode === 'deposit' ? ' (deposit)' : ''}
          </p>
        )}
        {quote && hasDiscounts && (
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>{t('public.totalDue')}</span>
              <span>{formatPrice(quote.subtotal, service.currency)}</span>
            </div>
            {quote.promoDiscount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>{t('public.discountPromo')}</span>
                <span>-{formatPrice(quote.promoDiscount, service.currency)}</span>
              </div>
            )}
            {quote.giftCardDiscount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>{t('public.discountGiftCard')}</span>
                <span>-{formatPrice(quote.giftCardDiscount, service.currency)}</span>
              </div>
            )}
            {quote.loyaltyDiscount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>{t('public.discountLoyalty')}</span>
                <span>-{formatPrice(quote.loyaltyDiscount, service.currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-gray-900 pt-1">
              <span>{amountDue <= 0 ? t('public.freeAfterDiscounts') : t('public.totalDue')}</span>
              <span>{formatPrice(amountDue, service.currency)}</span>
            </div>
          </div>
        )}
        {quote && quote.pointsToEarn > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            {t('public.pointsToEarn').replace('{points}', String(quote.pointsToEarn))}
          </p>
        )}
        {quote && hasDiscounts && quote.pointsToEarn <= 0 && quote.loyaltyDiscount > 0 && (
          <p className="text-xs text-gray-500 mt-2">{t('public.noPointsToEarn')}</p>
        )}
      </section>

      {(service.hasSubscriptionPlans || activeSubscription) && (
        <section className="border-b border-gray-100 pb-4 mb-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">How would you like to book?</h2>
          {activeSubscription && activeSubscription.appointmentsRemaining > 0 && (
            <label className="flex items-start gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 cursor-pointer">
              <input
                type="radio"
                name="purchaseType"
                checked={usingSubscriptionCredit}
                onChange={() => {
                  setPurchaseType('one-time');
                  setUseExistingSubscription(true);
                }}
              />
              <div>
                <p className="font-medium text-gray-900">Use subscription</p>
                <p className="text-sm text-gray-600">
                  {activeSubscription.appointmentsRemaining} of {activeSubscription.appointmentsIncluded}{' '}
                  appointments left · expires{' '}
                  {new Date(activeSubscription.expiresAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-emerald-700 mt-1">$0 for this visit</p>
              </div>
            </label>
          )}
          <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer">
            <input
              type="radio"
              name="purchaseType"
              checked={purchaseType === 'one-time' && !usingSubscriptionCredit}
              onChange={() => {
                setPurchaseType('one-time');
                setUseExistingSubscription(false);
              }}
            />
            <span className="font-medium text-gray-900">One-time appointment</span>
          </label>
          {service.hasSubscriptionPlans && subscriptionPlans.length > 0 && (
            <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer">
              <input
                type="radio"
                name="purchaseType"
                checked={purchaseType === 'subscription'}
                onChange={() => {
                  setPurchaseType('subscription');
                  setUseExistingSubscription(false);
                  if (!selectedPlanId && subscriptionPlans[0]) {
                    setSelectedPlanId(subscriptionPlans[0].id);
                  }
                }}
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Subscribe & save</p>
                {purchaseType === 'subscription' && (
                  <div className="mt-3 space-y-2">
                    {subscriptionPlans.map((plan) => (
                      <label
                        key={plan.id}
                        className={`block p-3 rounded-lg border text-sm cursor-pointer ${
                          selectedPlanId === plan.id ? 'border-violet-400 bg-violet-50' : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="subscriptionPlan"
                          className="mr-2"
                          checked={selectedPlanId === plan.id}
                          onChange={() => setSelectedPlanId(plan.id)}
                        />
                        {plan.name} · {plan.includedAppointments} visits / {plan.durationMonths} mo ·{' '}
                        {formatPrice(plan.preview.pricing.subscriptionPrice, service.currency)}
                        <span className="text-emerald-600 ml-1">
                          (save {formatPrice(plan.preview.pricing.savings, service.currency)})
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </label>
          )}
        </section>
      )}

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
                .replace('{value}', formatPrice(loyalty.pointsValue, service.currency))}
              {quote && quote.afterPromo > 0 && (
                <span>
                  {' '}
                  · Max {Math.min(loyalty.pointsBalance, quote.afterPromo).toFixed(2)} on this booking
                </span>
              )}
              {!quote && chargeBase > 0 && (
                <span>
                  {' '}
                  · Max {Math.min(loyalty.pointsBalance, chargeBase).toFixed(2)} on this booking
                </span>
              )}
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
        {quoteError && !appliedPromo && (
          <p className="text-xs text-red-600">{quoteError}</p>
        )}
        {quoteLoading && (
          <p className="text-xs text-gray-400">{t('public.submitting')}</p>
        )}
      </section>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal information</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
            placeholder="Enter name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
          onChange={(phone) => setForm((f) => ({ ...f, phone }))}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
            placeholder="Enter email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
          <textarea
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 min-h-[80px]"
            placeholder="Comment"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>

        <label className="flex items-start gap-3 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={form.emailReminders}
            onChange={(e) => setForm((f) => ({ ...f, emailReminders: e.target.checked }))}
            className="mt-1 rounded border-gray-300"
          />
          <span>Send me email reminders about this appointment</span>
        </label>
        <label className="flex items-start gap-3 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={form.whatsappReminders}
            onChange={(e) => setForm((f) => ({ ...f, whatsappReminders: e.target.checked }))}
            className="mt-1 rounded border-gray-300"
          />
          <span>{t('public.whatsappReminders')}</span>
        </label>

        <label className="flex items-start gap-3 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
            className="mt-1 rounded border-gray-300"
          />
          <span>{t('public.privacyConsent')}</span>
        </label>
        <label className="flex items-start gap-3 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={form.marketingOptIn}
            onChange={(e) => setForm((f) => ({ ...f, marketingOptIn: e.target.checked }))}
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
              {amountDue <= 0 && hasDiscounts
                ? t('public.freeAfterDiscounts')
                : dueNow > 0
                  ? t('public.totalDue')
                  : t('public.total')}
            </span>
            <span className="font-semibold text-gray-900">
              {formatPrice(amountDue, service.currency)}
            </span>
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
              : amountDue > 0 && dueNow > 0
                ? `Pay ${formatPrice(amountDue, service.currency)} & book`
                : t('public.confirmBooking')}
          </button>
        </div>
      </div>
    </form>

    {showProviderPicker && (
      <SpecialistPickerSheet
        open={specialistPickerOpen}
        onClose={() => setSpecialistPickerOpen(false)}
        slug={tenant.slug}
        serviceId={service.id}
        startTime={startTime}
        primaryColor={primary}
        value={specialistChoice}
        onChange={setSpecialistChoice}
      />
    )}
    </>
  );
}
