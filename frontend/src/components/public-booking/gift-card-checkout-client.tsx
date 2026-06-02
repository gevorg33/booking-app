'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { PublicHeader } from '@/components/public-booking/public-header';
import { PhoneInput } from '@/components/public-booking/phone-input';
import {
  confirmPublicBookingPayment,
  createPublicGiftCardCheckout,
  purchasePublicGiftCard,
  formatPrice,
  quotePublicGiftCardPurchase,
  type PublicBusinessProfile,
  type PublicGiftCardCatalog,
  type PublicGiftCardPurchaseQuote,
  type PublicGiftCardType,
  type PurchasePublicGiftCardBody,
} from '@/lib/public-api';
import { defaultCountryFromCallingCode, formatPhoneForApi } from '@/lib/phone-format';
import type { Country } from 'react-phone-number-input';
import { bookPath } from '@/lib/tenant-host';
import { useI18n } from '@/i18n';
import { usePublicCustomerAuth } from '@/lib/public-customer-auth';

interface GiftCardCheckoutClientProps {
  slug: string;
  tenant: PublicBusinessProfile;
  catalog: PublicGiftCardCatalog;
  paymentSessionId?: string;
}

const inputClassName =
  'w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 bg-white';

export function GiftCardCheckoutClient({
  slug,
  tenant,
  catalog,
  paymentSessionId,
}: GiftCardCheckoutClientProps) {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const { customer, loading: authLoading } = usePublicCustomerAuth();
  const primary = tenant.branding.primaryColor || '#7c3aed';
  const defaultPhoneCountry = defaultCountryFromCallingCode(tenant.defaultPhoneCountryCode);
  const settings = catalog.settings!;

  const cardType = (searchParams.get('cardType') ?? 'monetary') as PublicGiftCardType;
  const amount = searchParams.get('amount') ?? String(settings.presetAmounts[0] ?? 50);
  const serviceIdsFromUrl = useMemo(() => {
    const raw = searchParams.get('serviceIds');
    if (raw) {
      return raw.split(',').map((id) => id.trim()).filter(Boolean);
    }
    const single = searchParams.get('serviceId') ?? settings.purchasableServices[0]?.serviceId ?? '';
    return single ? [single] : [];
  }, [searchParams, settings.purchasableServices]);
  const bundleId = searchParams.get('bundleId') ?? settings.bundles[0]?.id ?? '';
  const packageId =
    searchParams.get('packageId') ?? settings.purchasablePackages?.[0]?.packageId ?? '';
  const subscriptionPlanId =
    searchParams.get('subscriptionPlanId') ??
    settings.purchasableSubscriptionPlans?.[0]?.planId ??
    '';

  const deliveryOptions = useMemo(() => {
    const opts: Array<'digital' | 'physical'> = [];
    if (settings.digitalDeliveryEnabled) opts.push('digital');
    if (settings.physicalDeliveryEnabled) opts.push('physical');
    return opts;
  }, [settings]);

  const [buyForSelf, setBuyForSelf] = useState(true);
  const [deliveryMethod, setDeliveryMethod] = useState<'digital' | 'physical'>(deliveryOptions[0] ?? 'digital');
  const [shippingMethodId, setShippingMethodId] = useState(settings.shippingMethods[0]?.id ?? 'standard');
  const [form, setForm] = useState({
    purchaserName: '',
    purchaserEmail: '',
    recipientName: '',
    recipientEmail: '',
    recipientPhone: undefined as string | undefined,
    personalMessage: '',
    line1: '',
    line2: '',
    city: '',
    stateRegion: '',
    postalCode: '',
    country: defaultPhoneCountry as Country,
    instructions: '',
    consent: false,
  });
  const [quote, setQuote] = useState<PublicGiftCardPurchaseQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const quoteRequestId = useRef(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('online');
  const showCashOption = settings.acceptCashPayments === true && (quote?.total ?? 0) > 0;

  useEffect(() => {
    if (authLoading || !customer) return;
    setForm((prev) => ({
      ...prev,
      purchaserName: prev.purchaserName || customer.name || '',
      purchaserEmail: prev.purchaserEmail || customer.email || '',
      recipientName: prev.recipientName || customer.name,
      recipientEmail: prev.recipientEmail || customer.email || '',
      recipientPhone: prev.recipientPhone || customer.phone || undefined,
    }));
  }, [authLoading, customer]);

  useEffect(() => {
    if (!paymentSessionId || success) return;
    setSubmitting(true);
    confirmPublicBookingPayment(slug, paymentSessionId)
      .then(() => setSuccess(true))
      .catch((err) => setError(err instanceof Error ? err.message : t('public.giftCards.paymentFailed')))
      .finally(() => setSubmitting(false));
  }, [paymentSessionId, slug, success, t]);

  const buildPayload = useCallback((): PurchasePublicGiftCardBody | null => {
    if (!form.purchaserEmail.trim()) return null;
    const purchaserName = form.purchaserName.trim() || customer?.name?.trim() || undefined;
    const payload: PurchasePublicGiftCardBody = {
      cardType,
      deliveryMethod,
      buyForSelf,
      purchaserEmail: form.purchaserEmail.trim(),
      purchaserName,
      personalMessage: form.personalMessage.trim() || undefined,
    };
    if (cardType === 'monetary') payload.amount = Number(amount);
    if (cardType === 'service') {
      if (serviceIdsFromUrl.length === 1) {
        payload.serviceId = serviceIdsFromUrl[0];
      } else if (serviceIdsFromUrl.length > 1) {
        payload.serviceIds = serviceIdsFromUrl;
      }
    }
    if (cardType === 'bundle') payload.bundleId = bundleId;
    if (cardType === 'package') payload.packageId = packageId;
    if (cardType === 'subscription') payload.subscriptionPlanId = subscriptionPlanId;
    if (!buyForSelf || deliveryMethod === 'physical') {
      payload.recipientName = form.recipientName.trim() || undefined;
      payload.recipientEmail = form.recipientEmail.trim() || undefined;
      payload.recipientPhone = form.recipientPhone ? formatPhoneForApi(form.recipientPhone) : undefined;
    } else if (buyForSelf && deliveryMethod === 'digital') {
      payload.recipientEmail = form.purchaserEmail.trim();
      payload.recipientName = purchaserName;
    }
    if (deliveryMethod === 'physical') {
      payload.shippingMethodId = shippingMethodId;
      payload.shippingAddress = {
        recipientName: form.recipientName.trim(),
        phone: form.recipientPhone ? formatPhoneForApi(form.recipientPhone) : undefined,
        line1: form.line1.trim(),
        line2: form.line2.trim() || undefined,
        city: form.city.trim(),
        stateRegion: form.stateRegion.trim() || undefined,
        postalCode: form.postalCode.trim(),
        country: form.country.trim(),
        instructions: form.instructions.trim() || undefined,
      };
    }
    return payload;
  }, [
    amount,
    bundleId,
    packageId,
    subscriptionPlanId,
    buyForSelf,
    cardType,
    deliveryMethod,
    form,
    serviceIdsFromUrl,
    shippingMethodId,
    customer?.name,
  ]);

  useEffect(() => {
    const payload = buildPayload();
    if (!payload?.purchaserEmail) return;
    if (deliveryMethod === 'physical' && (!form.line1 || !form.city || !form.postalCode)) return;

    const requestId = ++quoteRequestId.current;
    setQuoteLoading(true);
    setQuoteError(null);
    void quotePublicGiftCardPurchase(slug, payload)
      .then((q) => {
        if (requestId !== quoteRequestId.current) return;
        setQuote(q);
      })
      .catch((err) => {
        if (requestId !== quoteRequestId.current) return;
        setQuote(null);
        setQuoteError(err instanceof Error ? err.message : t('public.giftCards.quoteFailed'));
      })
      .finally(() => {
        if (requestId === quoteRequestId.current) setQuoteLoading(false);
      });
  }, [buildPayload, deliveryMethod, form.city, form.line1, form.postalCode, slug, t]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = buildPayload();
    if (!payload) {
      setError(t('public.giftCards.emailRequired'));
      return;
    }
    if (!form.consent) {
      setError(t('public.consentRequired'));
      return;
    }
    if (!customer && !form.purchaserName.trim()) {
      setError(t('public.giftCards.purchaserNameRequired'));
      return;
    }
    setSubmitting(true);
    try {
      if (paymentMethod === 'cash' && showCashOption) {
        await purchasePublicGiftCard(slug, { ...payload, paymentMethod: 'cash' });
        setSuccess(true);
        return;
      }
      const checkout = await createPublicGiftCardCheckout(slug, payload);
      window.location.href = checkout.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t('public.giftCards.checkoutFailed'));
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <>
        <PublicHeader tenant={tenant} showBack backHref={bookPath(slug)} />
        <main className="max-w-lg mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('public.giftCards.successTitle')}</h1>
          <p className="text-gray-600">{t('public.giftCards.successBody')}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <PublicHeader
        tenant={tenant}
        showBack
        backHref={bookPath(slug, '/gift-cards')}
      />
      <form onSubmit={onSubmit} className="max-w-lg mx-auto px-4 py-6 pb-36">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{t('public.giftCards.checkoutTitle')}</h1>
        <p className="text-sm text-gray-500 mb-6">{quote?.label ?? t(`public.giftCards.type.${cardType}`)}</p>

        <section className="space-y-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-900">{t('public.giftCards.yourDetailsSection')}</h2>
          {!customer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('public.giftCards.purchaserName')}</label>
              <input
                className={inputClassName}
                required
                value={form.purchaserName}
                onChange={(e) => setForm({ ...form, purchaserName: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('public.giftCards.purchaserEmail')}</label>
            <input
              type="email"
              required
              className={inputClassName}
              value={form.purchaserEmail}
              onChange={(e) => setForm({ ...form, purchaserEmail: e.target.value })}
            />
          </div>
        </section>

        <section className="space-y-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-900">{t('public.giftCards.recipientSection')}</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setBuyForSelf(true)}
              className={`flex-1 rounded-xl border py-2 text-sm font-medium ${
                buyForSelf ? 'border-violet-400 bg-violet-50 text-violet-800' : 'border-gray-200'
              }`}
            >
              {t('public.giftCards.buyForSelf')}
            </button>
            <button
              type="button"
              onClick={() => setBuyForSelf(false)}
              className={`flex-1 rounded-xl border py-2 text-sm font-medium ${
                !buyForSelf ? 'border-violet-400 bg-violet-50 text-violet-800' : 'border-gray-200'
              }`}
            >
              {t('public.giftCards.buyAsGift')}
            </button>
          </div>

          {(!buyForSelf || deliveryMethod === 'physical') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('public.giftCards.recipientName')}</label>
                <input
                  className={inputClassName}
                  value={form.recipientName}
                  onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                />
              </div>
              {!buyForSelf && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('public.giftCards.recipientEmail')}</label>
                  <input
                    type="email"
                    className={inputClassName}
                    value={form.recipientEmail}
                    onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
                  />
                </div>
              )}
            </>
          )}

          <PhoneInput
            label={t('public.phone')}
            placeholder={t('public.phonePlaceholder')}
            searchPlaceholder={t('public.phoneCountrySearch')}
            searchNotFound={t('public.phoneCountryNotFound')}
            defaultCountry={defaultPhoneCountry}
            locale={locale}
            value={form.recipientPhone}
            onChange={(phone) => setForm({ ...form, recipientPhone: phone })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('public.giftCards.personalMessage')}</label>
            <textarea
              className={`${inputClassName} min-h-[80px]`}
              value={form.personalMessage}
              onChange={(e) => setForm({ ...form, personalMessage: e.target.value })}
            />
          </div>
        </section>

        <section className="space-y-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-900">{t('public.giftCards.deliverySection')}</h2>
          <div className="flex gap-2">
            {deliveryOptions.map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setDeliveryMethod(method)}
                className={`flex-1 rounded-xl border py-2 text-sm font-medium ${
                  deliveryMethod === method
                    ? 'border-violet-400 bg-violet-50 text-violet-800'
                    : 'border-gray-200'
                }`}
              >
                {t(`public.giftCards.delivery.${method}`)}
              </button>
            ))}
          </div>

          {deliveryMethod === 'physical' && (
            <div className="space-y-3 rounded-2xl border border-gray-100 p-4 bg-gray-50/50">
              <select
                className={inputClassName}
                value={shippingMethodId}
                onChange={(e) => setShippingMethodId(e.target.value)}
              >
                {settings.shippingMethods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} — {formatPrice(m.fee, quote?.currency ?? 'USD')} ({m.estimatedDays})
                  </option>
                ))}
              </select>
              <input className={inputClassName} placeholder={t('public.giftCards.addressLine1')} value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} required />
              <input className={inputClassName} placeholder={t('public.giftCards.addressLine2')} value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <input className={inputClassName} placeholder={t('public.giftCards.city')} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
                <input className={inputClassName} placeholder={t('public.giftCards.postalCode')} value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} required />
              </div>
              <input className={inputClassName} placeholder={t('public.giftCards.country')} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value as Country })} required />
              <textarea className={`${inputClassName} min-h-[60px]`} placeholder={t('public.giftCards.deliveryInstructions')} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
            </div>
          )}
        </section>

        {quote && (
          <section className="rounded-2xl border border-gray-100 p-4 mb-6 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">{t('public.total')}</span>
              <span>{formatPrice(quote.subtotal, quote.currency)}</span>
            </div>
            {quote.shippingFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">{t('public.giftCards.shipping')}</span>
                <span>{formatPrice(quote.shippingFee, quote.currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-100">
              <span>{t('public.totalDue')}</span>
              <span>{formatPrice(quote.total, quote.currency)}</span>
            </div>
          </section>
        )}
        {quoteError && <p className="text-sm text-red-600 mb-4">{quoteError}</p>}

        <label className="flex items-start gap-3 text-sm text-gray-600 mb-4">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(e) => setForm({ ...form, consent: e.target.checked })}
            className="mt-1 rounded border-gray-300"
          />
          <span>{t('public.privacyConsent')}</span>
        </label>
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {showCashOption && (
          <section className="rounded-2xl border border-gray-100 p-4 mb-4">
            <p className="text-sm font-medium text-gray-900 mb-2">{t('public.paymentMethod')}</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('online')}
                className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                  paymentMethod === 'online' ? 'border-transparent text-white' : 'border-gray-200 text-gray-700'
                }`}
                style={paymentMethod === 'online' ? { backgroundColor: primary } : undefined}
              >
                {t('public.payOnline')}
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                  paymentMethod === 'cash' ? 'border-transparent text-white' : 'border-gray-200 text-gray-700'
                }`}
                style={paymentMethod === 'cash' ? { backgroundColor: primary } : undefined}
              >
                {t('public.payCashAtVisitShort')}
              </button>
            </div>
            {paymentMethod === 'cash' && quote && (
              <p className="text-xs text-gray-600 mt-2">
                {t('public.giftCards.payCashAtVisit', {
                  amount: formatPrice(quote.total, quote.currency, locale),
                })}
              </p>
            )}
          </section>
        )}

        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 p-4">
          <div className="max-w-lg mx-auto">
            <button
              type="submit"
              disabled={submitting || quoteLoading || !quote}
              className="w-full py-3.5 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: primary }}
            >
              {(submitting || quoteLoading) && <Loader2 className="w-4 h-4 animate-spin" />}
              {paymentMethod === 'cash' && showCashOption
                ? t('public.giftCards.confirmCashPurchase')
                : t('public.giftCards.payNow')}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
