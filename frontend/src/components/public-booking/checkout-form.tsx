'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, Pencil, Loader2, Users } from 'lucide-react';
import {
  formatAppointmentDateLabel,
  formatBookingDateTimeRange,
  formatDateDisplay,
  formatScheduleTime,
} from '@/lib/date-format';
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
import { resolveTenantPriceCurrency } from '@/lib/business-currency';
import {
  formatTaxLineLabel,
  resolveCheckoutTaxDisplayLines,
} from '@/lib/business-tax';
import {
  buildQuoteRequest,
  isSubscriptionCheckoutSelection,
  resolveCheckoutSubtotal,
  subscriptionCheckoutPayload,
} from '@/lib/subscription-plans';
import {
  resolvePublicCheckoutCartTotal,
  resolvePublicCheckoutStickyDisplay,
} from '@/lib/public-checkout-quote.util';
import {
  requiresSingleServiceOnlinePayment,
  resolveSingleServiceOnlineAmountDue,
  showSingleServiceCashPaymentOption,
} from '@/lib/checkout-payment-method.util';
import { bookPath } from '@/lib/tenant-host';
import {
  isWhatsappRemindersPhoneRequired,
  resolveDefaultPublicCheckoutWhatsappReminders,
  resolveWhatsappRemindersAfterPhonePrefill,
} from '@/lib/public-checkout-whatsapp.util';
import { useI18n } from '@/i18n';
import { usePublicCustomerAuth } from '@/lib/public-customer-auth';
import { PhoneInput } from '@/components/public-booking/phone-input';
import { SpecialistPickerSheet,
  type SpecialistChoice,
} from '@/components/public-booking/specialist-picker-sheet';
import { BookingSuccessPanel } from '@/components/public-booking/booking-success-panel';
import { ProductRecommendationCards } from '@/components/public-booking/product-recommendation-cards';
import { AppointmentReminderPicker } from '@/components/public-booking/appointment-reminder-picker';
import { defaultCountryFromCallingCode, formatPhoneForApi, isValidPhone } from '@/lib/phone-format';
import { RadioCard, ToggleChoice } from '@/components/ui/radio-choice';
import { isPublicClinicService } from '@/lib/clinic-service';
import { isPublicTourService } from '@/lib/tour-service';
import { PublicCheckoutIntakeStep } from '@/components/public-booking/public-checkout-intake-step';

interface CheckoutFormProps {
  tenant: PublicBusinessProfile;
  employee?: { id: string; name: string; role?: string };
  service: PublicService;
  startTime: string;
  autoAssign?: boolean;
  paymentSessionId?: string;
  clinicOrderToken?: string;
}

export function CheckoutForm({
  tenant,
  employee,
  service,
  startTime,
  autoAssign,
  paymentSessionId,
  clinicOrderToken,
}: CheckoutFormProps) {
  const { t, locale } = useI18n();
  const { customer, loading: authLoading } = usePublicCustomerAuth();
  const primary = tenant.branding.primaryColor || '#7c3aed';
  const currency = resolveTenantPriceCurrency(service.currency, tenant.currency);
  const dueNow = prepaymentDue(service);
  const defaultPhoneCountry = defaultCountryFromCallingCode(tenant.defaultPhoneCountryCode);
  const reminderOptions = tenant.appointmentReminders;
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: undefined as string | undefined,
    notes: '',
    consent: false,
    marketingOptIn: false,
    aiProcessingOptIn: false,
    thirdPartyIntegrationsOptIn: false,
    emailReminders: true,
    // e2e-bug.212 — guests without a phone must not start with WhatsApp ON
    whatsappReminders: resolveDefaultPublicCheckoutWhatsappReminders(),
    reminderHoursBefore: reminderOptions?.defaultHours ?? null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMeta, setSuccessMeta] = useState<{
    bookingId?: string;
    manageToken?: string;
    cashDueLabel?: string | null;
  }>({});
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('online');
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
  const isTour = isPublicTourService(service);
  const isClinic = isPublicClinicService(service);
  const maxPax = service.maxGroupSize && service.maxGroupSize > 0 ? service.maxGroupSize : 99;
  const [paxCount, setPaxCount] = useState(1);
  const [referralNotes, setReferralNotes] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const showIntakeStep = service.offersPreVisitIntake === true && !!customer;
  const [checkoutStep, setCheckoutStep] = useState<'intake' | 'details'>(() =>
    showIntakeStep ? 'intake' : 'details',
  );
  const [preVisitIntakeId, setPreVisitIntakeId] = useState<string | undefined>();

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
    queueMicrotask(() =>
      setForm((prev) => {
        const nextPhone = prev.phone || customer.phone || undefined;
        return {
          ...prev,
          name: prev.name || customer.name,
          email: prev.email || customer.email || '',
          phone: nextPhone,
          whatsappReminders: resolveWhatsappRemindersAfterPhonePrefill({
            previousPhone: prev.phone,
            nextPhone,
            previousWhatsappReminders: prev.whatsappReminders,
          }),
        };
      }),
    );
  }, [authLoading, customer]);

  useEffect(() => {
    if (!customer) {
      queueMicrotask(() => setLoyalty(null));
      queueMicrotask(() => setActiveSubscription(null));
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
      queueMicrotask(() => setSubscriptionPlans([]));
      return;
    }
    void getPublicServiceSubscriptionPlans(tenant.slug, service.id)
      .then(setSubscriptionPlans)
      .catch(() => setSubscriptionPlans([]));
  }, [service.hasSubscriptionPlans, service.id, tenant.slug]);

  // e2e-bug.28 — must be above the quote effect so useSubscriptionId can be threaded in.
  const usingSubscriptionCredit =
    Boolean(activeSubscription?.appointmentsRemaining) &&
    useExistingSubscription &&
    purchaseType === 'one-time';

  useEffect(() => {
    let cancelled = false;
    const requestId = ++quoteRequestId.current;
    queueMicrotask(() => setQuoteLoading(true));
    queueMicrotask(() => setQuoteError(null));
    void quotePublicBooking(
      tenant.slug,
      {
        ...buildQuoteRequest({
          serviceId: service.id,
          purchaseType,
          selectedPlanId,
          promoCode: appliedPromo || undefined,
          loyaltyPointsToRedeem: loyaltyPoints > 0 ? loyaltyPoints : undefined,
          ...(usingSubscriptionCredit && activeSubscription?.id
            ? { useSubscriptionId: activeSubscription.id }
            : {}),
        }),
        ...(isTour ? { paxCount } : {}),
      },
    )
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
  }, [
    tenant.slug,
    service.id,
    appliedPromo,
    loyaltyPoints,
    customer?.id,
    purchaseType,
    selectedPlanId,
    usingSubscriptionCredit,
    activeSubscription?.id,
    isTour,
    paxCount,
    t,
  ]);

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
      : subscriptionCheckoutPayload(purchaseType, selectedPlanId)),
    ...(paymentMethod === 'cash' ? { paymentMethod: 'cash' as const } : {}),
    ...(isTour ? { paxCount } : {}),
    ...(isClinic && service.acceptsPatientNotes
      ? {
          referralNotes: referralNotes.trim() || undefined,
          symptoms: symptoms.trim() || undefined,
        }
      : {}),
    ...(preVisitIntakeId ? { preVisitIntakeId } : {}),
    ...(clinicOrderToken ? { clinicOrderToken } : {}),
    customer: {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: fullPhone() || undefined,
      emailReminders: form.emailReminders,
      whatsappReminders: form.whatsappReminders,
      ...(reminderOptions?.enabled ? { reminderHoursBefore: form.reminderHoursBefore } : {}),
      privacyConsentAccepted: form.consent,
      marketingOptIn: form.marketingOptIn,
      ...(tenant.privacy?.requireAiProcessingConsent
        ? { aiProcessingOptIn: form.aiProcessingOptIn }
        : {}),
      ...(tenant.privacy?.requireThirdPartyIntegrationsConsent
        ? { thirdPartyIntegrationsOptIn: form.thirdPartyIntegrationsOptIn }
        : {}),
    },
  });

  const catalogTotal = isTour ? service.price * paxCount : service.price;
  // Online charge base only — 0 for pay-at-visit (e2e-bug.222). Do not use catalog.
  const onlineChargeBase = dueNow > 0 ? (isTour ? dueNow * paxCount : dueNow) : 0;
  /** @deprecated alias — loyalty max / promo fallbacks use catalog when unpaid online */
  const chargeBase = onlineChargeBase > 0 ? onlineChargeBase : catalogTotal;

  function selectOneTimeVisit() {
    setPurchaseType('one-time');
    setUseExistingSubscription(false);
    setSelectedPlanId('');
  }

  function selectUseExistingSubscription() {
    setPurchaseType('one-time');
    setUseExistingSubscription(true);
    setSelectedPlanId('');
  }

  function selectSubscriptionPlan(planId: string) {
    setPurchaseType('subscription');
    setUseExistingSubscription(false);
    setSelectedPlanId(planId);
  }

  const selectedPlan = subscriptionPlans.find((p) => p.id === selectedPlanId);
  const amountDue = resolveSingleServiceOnlineAmountDue({
    usingSubscriptionCredit,
    quoteAmountDue: quote?.amountDue,
    onlineChargeBase,
    subscriptionPlanPrice:
      purchaseType === 'subscription' && selectedPlan
        ? selectedPlan.preview.pricing.subscriptionPrice
        : undefined,
  });
  const cartTotal = resolvePublicCheckoutCartTotal(quote, catalogTotal);
  const requiresOnlinePayment = requiresSingleServiceOnlinePayment({
    amountDue,
    paymentMethod,
    purchaseType,
    dueNow,
  });
  const showCashOption = showSingleServiceCashPaymentOption({
    acceptCashPayments: tenant.acceptCashPayments === true,
    purchaseType,
    usingSubscriptionCredit,
    amountDue,
    dueNow,
    prepaymentMode: service.prepaymentMode ?? 'none',
  });
  const checkoutSubtotal = resolveCheckoutSubtotal({
    purchaseType,
    quoteSubtotal: quote?.subtotal,
    subscriptionPlanPrice:
      purchaseType === 'subscription' && selectedPlan
        ? selectedPlan.preview.pricing.subscriptionPrice
        : undefined,
    fallback: purchaseType === 'subscription' ? catalogTotal : onlineChargeBase || catalogTotal,
  });
  const hasDiscounts = (quote?.totalDiscount ?? 0) > 0;
  const stickyDisplay = resolvePublicCheckoutStickyDisplay({
    cartTotal,
    amountDue,
    hasDiscounts,
  });
  const promoApplied =
    !!appliedPromo &&
    !!quote &&
    (quote.promoCode?.toUpperCase() === appliedPromo.toUpperCase() ||
      (quote.giftCardCode?.toUpperCase() === appliedPromo.toUpperCase() &&
        quote.giftCardDiscount > 0) ||
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
    if (isWhatsappRemindersPhoneRequired(form.whatsappReminders, fullPhone())) {
      setError(t('public.whatsappPhoneRequired'));
      return;
    }
    if (!form.consent) {
      setError(t('public.consentRequired'));
      return;
    }
    if (tenant.privacy?.requireAiProcessingConsent && !form.aiProcessingOptIn) {
      setError(t('public.aiProcessingConsentRequired'));
      return;
    }
    if (
      tenant.privacy?.requireThirdPartyIntegrationsConsent &&
      !form.thirdPartyIntegrationsOptIn
    ) {
      setError(t('public.thirdPartyConsentRequired'));
      return;
    }
    if (!isSubscriptionCheckoutSelection(purchaseType, selectedPlanId) && purchaseType === 'subscription') {
      setError(t('public.subscriptionPlanRequired'));
      return;
    }

    setSubmitting(true);
    try {
      if (requiresOnlinePayment) {
        const { url } = await createPublicBookingCheckout(tenant.slug, payload());
        window.location.assign(url);
        return;
      }
      const result = await createPublicBooking(tenant.slug, payload());
      setSuccessMeta({
        bookingId: result.booking.id,
        manageToken: result.manageToken,
        cashDueLabel:
          result.paymentMethod === 'cash' && (result.amountDue ?? 0) > 0
            ? t('public.payCashAtVisit', {
                amount: formatPrice(result.amountDue ?? amountDue, currency),
              })
            : null,
      });
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
          {formatBookingDateTimeRange(start, end, locale)}
        </p>
        <p className="text-gray-500 mt-3 text-sm max-w-sm mx-auto">{t('public.reviewAfterVisitHint')}</p>
        <BookingSuccessPanel
          slug={tenant.slug}
          primary={primary}
          bookingId={successMeta.bookingId}
          manageToken={successMeta.manageToken}
          customerEmail={form.email.trim() || undefined}
          cashDueLabel={successMeta.cashDueLabel}
        />
        <ProductRecommendationCards
          slug={tenant.slug}
          service={service}
          currency={currency || tenant.currency || 'USD'}
          bookingId={successMeta.bookingId}
        />
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

  if (checkoutStep === 'intake' && showIntakeStep) {
    return (
      <PublicCheckoutIntakeStep
        slug={tenant.slug}
        serviceId={service.id}
        onSkip={() => setCheckoutStep('details')}
        onCompleted={(intakeId) => {
          setPreVisitIntakeId(intakeId);
          setCheckoutStep('details');
        }}
      />
    );
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="pb-44">
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
                {formatAppointmentDateLabel(start, locale, tenant.timezone || 'UTC')}
              </p>
              <p className="text-sm text-gray-500">{formatScheduleTime(start, locale)}</p>
            </div>
          </div>
          <a href={timeEditHref} className="text-gray-400 hover:text-gray-600">
            <Pencil className="w-4 h-4" />
          </a>
        </div>
      </section>

      {service.offersPreVisitIntake && !customer ? (
        <section className="border-b border-gray-100 pb-4 mb-4">
          <p className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
            {t('clinic.publicIntake.signInPrompt')}
          </p>
        </section>
      ) : null}

      {isClinic && service.acceptsPatientNotes && (
        <section className="border-b border-gray-100 pb-4 mb-4 space-y-4">
          {service.preparationNotes && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              {service.preparationNotes}
            </p>
          )}
          <div>
            <label htmlFor="clinic-symptoms" className="block text-sm font-medium text-gray-700 mb-2">
              {t('clinic.symptoms')}
            </label>
            <textarea
              id="clinic-symptoms"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-gray-900"
              placeholder={t('clinic.symptomsPlaceholder')}
            />
          </div>
          <div>
            <label htmlFor="clinic-referral" className="block text-sm font-medium text-gray-700 mb-2">
              {t('clinic.referralNotes')}
            </label>
            <textarea
              id="clinic-referral"
              value={referralNotes}
              onChange={(e) => setReferralNotes(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-gray-900"
              placeholder={t('clinic.referralNotesPlaceholder')}
            />
          </div>
        </section>
      )}

      {isTour && (
        <section className="border-b border-gray-100 pb-4 mb-4">
          <label htmlFor="tour-pax" className="block text-sm font-medium text-gray-700 mb-2">
            {t('tours.groupSize')}
          </label>
          <div className="flex items-center gap-3">
            <input
              id="tour-pax"
              type="number"
              min={1}
              max={maxPax}
              value={paxCount}
              onChange={(e) => {
                const next = Math.min(maxPax, Math.max(1, parseInt(e.target.value, 10) || 1));
                setPaxCount(next);
              }}
              className="w-24 rounded-xl border border-gray-200 px-3 py-2 text-gray-900"
            />
            <span className="text-sm text-gray-500">
              {t('tours.travelersHint', { max: String(maxPax) })}
            </span>
          </div>
        </section>
      )}

      <section className="border-b border-gray-100 pb-4 mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{t('public.servicesSection')}</p>
            <p className="font-medium text-gray-900">{service.name}</p>
            <p className="text-sm text-gray-500 mt-1">
              {isTour && paxCount > 1
                ? t('tours.lineTotal', {
                    unit: formatPrice(service.price, currency),
                    count: String(paxCount),
                    total: formatPrice(service.price * paxCount, currency),
                  })
                : formatPrice(service.price, currency)}
              {isTour && service.pricePerPerson ? ` ${t('tours.perPersonSuffix')}` : ''}
            </p>
          </div>
          <a href={servicesHref} className="text-gray-400 hover:text-gray-600 mt-1">
            <Pencil className="w-4 h-4" />
          </a>
        </div>
        <div className="flex justify-between mt-4 pt-4 border-t border-gray-50">
          <span className="font-semibold text-gray-900">{t('public.total')}</span>
          <span className="font-semibold text-gray-900" data-testid="checkout-cart-total">
            {usingSubscriptionCredit
              ? formatPrice(0, currency)
              : formatPrice(
                  purchaseType === 'subscription' ? checkoutSubtotal : cartTotal,
                  currency,
                )}
          </span>
        </div>
        {(usingSubscriptionCredit || purchaseType === 'subscription') && (
          <p className="text-sm text-emerald-700 mt-2">
            {usingSubscriptionCredit
              ? `Using subscription — ${Math.max(0, (activeSubscription?.appointmentsRemaining ?? 1) - 1)} visits left after this booking`
              : selectedPlan
                ? `Plan includes ${selectedPlan.includedAppointments} visits — first visit ${selectedPlan.preview.pricing.perAppointmentPrice ? `(${formatPrice(selectedPlan.preview.pricing.perAppointmentPrice, currency)} effective)` : 'included'}`
                : null}
          </p>
        )}
        {dueNow > 0 && purchaseType !== 'subscription' && (
          <p className="text-sm text-violet-700 mt-2">
            {t('public.totalDue')}: {formatPrice(dueNow, currency)}
            {service.prepaymentMode === 'deposit' ? ' (deposit)' : ''}
          </p>
        )}
        {quote && hasDiscounts && (
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>{t('public.totalDue')}</span>
              <span>{formatPrice(quote.subtotal, currency)}</span>
            </div>
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
            {resolveCheckoutTaxDisplayLines(quote).map((line) => (
              <div key={line.id} className="flex justify-between text-gray-600">
                <span>
                  {formatTaxLineLabel(line.name, line.rate)}
                  {quote.taxModel === 'inclusive' ? ` (${t('public.taxIncluded')})` : ''}
                </span>
                <span>
                  {quote.taxModel === 'exclusive' ? '+' : ''}
                  {formatPrice(line.amount, currency)}
                </span>
              </div>
            ))}
            <div className="flex justify-between font-semibold text-gray-900 pt-1">
              <span>
                {stickyDisplay.kind === 'free_after_discounts'
                  ? t('public.freeAfterDiscounts')
                  : stickyDisplay.kind === 'due_now'
                    ? t('public.totalDue')
                    : t('public.total')}
              </span>
              <span>{formatPrice(stickyDisplay.amount, currency)}</span>
            </div>
          </div>
        )}
        {quote && !hasDiscounts && resolveCheckoutTaxDisplayLines(quote).length > 0 && (
          <div className="mt-3 space-y-1 text-sm">
            {resolveCheckoutTaxDisplayLines(quote).map((line) => (
              <div key={line.id} className="flex justify-between text-gray-600">
                <span>
                  {formatTaxLineLabel(line.name, line.rate)}
                  {quote.taxModel === 'inclusive' ? ` (${t('public.taxIncluded')})` : ''}
                </span>
                <span>
                  {quote.taxModel === 'exclusive' ? '+' : ''}
                  {formatPrice(line.amount, currency)}
                </span>
              </div>
            ))}
            <div className="flex justify-between font-semibold text-gray-900 pt-1">
              <span>
                {stickyDisplay.kind === 'due_now' ? t('public.totalDue') : t('public.total')}
              </span>
              <span>{formatPrice(stickyDisplay.amount, currency)}</span>
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
          <h2 className="text-lg font-semibold text-gray-900">{t('public.howToBook')}</h2>
          {activeSubscription && activeSubscription.appointmentsRemaining > 0 && (
            <RadioCard
              name="purchaseOption"
              value="subscription-credit"
              checked={usingSubscriptionCredit}
              onSelect={selectUseExistingSubscription}
              primaryColor={primary}
              className="border-emerald-200 bg-emerald-50/50"
            >
              <p className="font-medium text-gray-900">{t('public.useSubscription')}</p>
              <p className="text-sm text-gray-600">
                {activeSubscription.appointmentsRemaining} of {activeSubscription.appointmentsIncluded}{' '}
                {t('public.appointmentsLeft')} · {t('public.expiresOn')}{' '}
                {formatDateDisplay(new Date(activeSubscription.expiresAt), locale)}
              </p>
              <p className="text-sm text-emerald-700 mt-1">{t('public.freeThisVisit')}</p>
            </RadioCard>
          )}
          <RadioCard
            name="purchaseOption"
            value="one-time"
            checked={purchaseType === 'one-time' && !usingSubscriptionCredit}
            onSelect={selectOneTimeVisit}
            primaryColor={primary}
          >
            <span className="font-medium text-gray-900">{t('public.oneTimeAppointment')}</span>
          </RadioCard>
          {service.hasSubscriptionPlans && subscriptionPlans.length > 0 && (
            <>
              {subscriptionPlans.length === 1 ? (
                <RadioCard
                  name="purchaseOption"
                  value={`plan-${subscriptionPlans[0].id}`}
                  checked={purchaseType === 'subscription' && selectedPlanId === subscriptionPlans[0].id}
                  onSelect={() => selectSubscriptionPlan(subscriptionPlans[0].id)}
                  primaryColor={primary}
                >
                  <p className="font-medium text-gray-900">{t('public.subscribeAndSave')}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {subscriptionPlans[0].name} · {subscriptionPlans[0].includedAppointments} visits /{' '}
                    {subscriptionPlans[0].durationMonths} mo ·{' '}
                    {formatPrice(subscriptionPlans[0].preview.pricing.subscriptionPrice, currency)}
                    <span className="text-emerald-600 ml-1">
                      ({t('public.saveAmount', {
                        amount: formatPrice(subscriptionPlans[0].preview.pricing.savings, currency),
                      })})
                    </span>
                  </p>
                </RadioCard>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-700 px-1">{t('public.chooseSubscriptionPlan')}</p>
                  {subscriptionPlans.map((plan) => (
                    <RadioCard
                      key={plan.id}
                      name="purchaseOption"
                      value={`plan-${plan.id}`}
                      checked={purchaseType === 'subscription' && selectedPlanId === plan.id}
                      onSelect={() => selectSubscriptionPlan(plan.id)}
                      primaryColor={primary}
                      className={
                        purchaseType === 'subscription' && selectedPlanId === plan.id ? 'bg-violet-50' : ''
                      }
                    >
                      <p className="font-medium text-gray-900">{plan.name}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {plan.includedAppointments} visits / {plan.durationMonths} mo ·{' '}
                        {formatPrice(plan.preview.pricing.subscriptionPrice, currency)}
                        <span className="text-emerald-600 ml-1">
                          ({t('public.saveAmount', {
                            amount: formatPrice(plan.preview.pricing.savings, currency),
                          })})
                        </span>
                      </p>
                    </RadioCard>
                  ))}
                </>
              )}
            </>
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
                .replace('{value}', formatPrice(loyalty.pointsValue, currency))}
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

      <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('public.personalInformation')}</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('public.nameLabel')}</label>
          <input
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
            placeholder={t('public.enterNamePlaceholder')}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('public.emailLabel')}</label>
          <input
            type="email"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
            placeholder={t('public.enterEmailPlaceholder')}
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

        <div className="mt-2 space-y-1 border-t border-gray-100 pt-4 mb-2">
          {reminderOptions?.enabled && (
            <AppointmentReminderPicker
              optionsHours={reminderOptions.optionsHours}
              value={form.reminderHoursBefore}
              onChange={(reminderHoursBefore) => setForm((f) => ({ ...f, reminderHoursBefore }))}
            />
          )}

          <ToggleChoice
            checked={form.emailReminders}
            onChange={(emailReminders) => setForm((f) => ({ ...f, emailReminders }))}
            primaryColor={primary}
            label={t('public.emailRemindersCheckout')}
          />
          <div data-testid="checkout-whatsapp-reminders">
            <ToggleChoice
              checked={form.whatsappReminders}
              onChange={(whatsappReminders) => setForm((f) => ({ ...f, whatsappReminders }))}
              primaryColor={primary}
              label={t('public.whatsappReminders')}
            />
          </div>

          <ToggleChoice
            checked={form.consent}
            onChange={(consent) => setForm((f) => ({ ...f, consent }))}
            primaryColor={primary}
            label={t('public.privacyConsent')}
          />
          <ToggleChoice
            checked={form.marketingOptIn}
            onChange={(marketingOptIn) => setForm((f) => ({ ...f, marketingOptIn }))}
            primaryColor={primary}
            label={t('public.marketingOptIn')}
          />
          {tenant.privacy?.requireAiProcessingConsent && (
            <ToggleChoice
              checked={form.aiProcessingOptIn}
              onChange={(aiProcessingOptIn) =>
                setForm((f) => ({ ...f, aiProcessingOptIn }))
              }
              primaryColor={primary}
              label={t('public.aiProcessingConsent')}
            />
          )}
          {tenant.privacy?.requireThirdPartyIntegrationsConsent && (
            <ToggleChoice
              checked={form.thirdPartyIntegrationsOptIn}
              onChange={(thirdPartyIntegrationsOptIn) =>
                setForm((f) => ({ ...f, thirdPartyIntegrationsOptIn }))
              }
              primaryColor={primary}
              label={t('public.thirdPartyIntegrationsConsent')}
            />
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {showCashOption && (
        <section className="border-b border-gray-100 pb-4 mb-4">
          <p className="text-sm font-medium text-gray-900 mb-2">{t('public.paymentMethod')}</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('online')}
              className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                paymentMethod === 'online'
                  ? 'border-transparent text-white'
                  : 'border-gray-200 text-gray-700'
              }`}
              style={paymentMethod === 'online' ? { backgroundColor: primary } : undefined}
            >
              {t('public.payOnline')}
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                paymentMethod === 'cash'
                  ? 'border-transparent text-white'
                  : 'border-gray-200 text-gray-700'
              }`}
              style={paymentMethod === 'cash' ? { backgroundColor: primary } : undefined}
            >
              {t('public.payCashAtVisitShort')}
            </button>
          </div>
        </section>
      )}

      <div
        data-public-sticky-cta
        data-testid="public-sticky-cta"
        className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
      >
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-gray-500">
              {stickyDisplay.kind === 'free_after_discounts'
                ? t('public.freeAfterDiscounts')
                : stickyDisplay.kind === 'due_now'
                  ? t('public.totalDue')
                  : t('public.total')}
            </span>
            <span className="font-semibold text-gray-900" data-testid="checkout-sticky-amount">
              {formatPrice(stickyDisplay.amount, currency)}
            </span>
          </div>
          <button
            type="submit"
            data-testid="checkout-submit"
            disabled={submitting || quoteLoading}
            className="w-full py-3.5 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: primary }}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting
              ? t('public.submitting')
              : paymentMethod === 'cash' && showCashOption
                ? t('public.confirmCashBooking')
                : requiresOnlinePayment
                  ? `Pay ${formatPrice(amountDue, currency)} & book`
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
