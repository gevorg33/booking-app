import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { Capacitor } from '@capacitor/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import { ConsumerAiShell } from '../components/ConsumerAiShell.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { formatPublicMoney } from '../lib/business-currency.js';
import { formatCopy } from '../lib/copy.js';
import { getCustomerToken, getStoredCustomerProfile } from '../lib/customer-auth.js';
import type { PublicGiftCardPurchaseQuote, PublicGiftCardType } from '../lib/gift-card.types.js';
import {
  buildGiftCardPurchasePayload,
  canQuoteGiftCardPurchase,
  parseGiftCardServiceIdsFromSearch,
  resolveGiftCardDeliveryOptions,
  type GiftCardCheckoutFormState,
} from '../lib/gift-card-purchase.util.js';
import { parseGiftCardAssistantPrefill } from '../lib/consumer-gift-card-assistant-prefill.util.js';
import { formatFriendlyNetworkError } from '../lib/consumer-network-ux.util.js';
import {
  confirmPublicBookingPayment,
  createPublicGiftCardCheckout,
  getPublicGiftCardCatalog,
  purchasePublicGiftCard,
  quotePublicGiftCardPurchase,
} from '../services/public-api.js';

function openExternalCheckout(url: string): void {
  if (typeof window === 'undefined') return;
  window.open(url, Capacitor.isNativePlatform() ? '_system' : '_blank', 'noopener,noreferrer');
}

const emptyForm = (): GiftCardCheckoutFormState => ({
  purchaserName: '',
  purchaserEmail: '',
  recipientName: '',
  recipientEmail: '',
  recipientPhone: '',
  personalMessage: '',
  line1: '',
  line2: '',
  city: '',
  stateRegion: '',
  postalCode: '',
  country: 'US',
  instructions: '',
  consent: false,
});

export default function GiftCardCheckoutPage() {
  const history = useHistory();
  const location = useLocation();
  const { slug, profile, loading, error } = useTenantBootstrap();
  const { copy, locale } = useConsumerCopy(slug ?? '', profile ?? { locale: 'en' });
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const assistantPrefill = useMemo(
    () => parseGiftCardAssistantPrefill(params),
    [params],
  );
  const paymentSessionId = params.get('session_id')?.trim() ?? '';

  const catalogQuery = useQuery({
    queryKey: ['gift-card-catalog', slug],
    queryFn: () => getPublicGiftCardCatalog(slug!),
    enabled: Boolean(slug),
  });

  const settings = catalogQuery.data?.settings;
  const cardType = (params.get('cardType') ?? 'monetary') as PublicGiftCardType;
  const amount = params.get('amount') ?? String(settings?.presetAmounts[0] ?? 50);
  // e2e-bug.6 / e2e-bug.37 — parse returns a new array every call; memoize so buildPayload stays stable.
  const serviceIds = useMemo(
    () => parseGiftCardServiceIdsFromSearch(params),
    [params],
  );
  const bundleId = params.get('bundleId') ?? settings?.bundles[0]?.id ?? '';
  const packageId = params.get('packageId') ?? settings?.purchasablePackages?.[0]?.packageId ?? '';
  const subscriptionPlanId =
    params.get('subscriptionPlanId') ?? settings?.purchasableSubscriptionPlans?.[0]?.planId ?? '';

  // e2e-bug.6 / e2e-bug.37 — getStoredCustomerProfile JSON.parses a new object each call; memoize by slug.
  const customer = useMemo(
    () => (slug ? getStoredCustomerProfile(slug) : null),
    [slug],
  );
  const authed = slug ? !!getCustomerToken(slug) : false;

  const deliveryOptions = useMemo(
    () =>
      settings
        ? resolveGiftCardDeliveryOptions(settings)
        : (['digital'] as Array<'digital' | 'physical'>),
    [settings],
  );

  const [buyForSelf, setBuyForSelf] = useState(() => !assistantPrefill.buyAsGift);
  const [deliveryMethod, setDeliveryMethod] = useState<'digital' | 'physical'>(
    assistantPrefill.deliveryMethod ?? deliveryOptions[0] ?? 'digital',
  );
  const [shippingMethodId, setShippingMethodId] = useState(
    settings?.shippingMethods[0]?.id ?? 'standard',
  );
  const [form, setForm] = useState<GiftCardCheckoutFormState>(() => ({
    ...emptyForm(),
    ...(assistantPrefill.recipientName
      ? { recipientName: assistantPrefill.recipientName }
      : {}),
    ...(assistantPrefill.recipientEmail
      ? { recipientEmail: assistantPrefill.recipientEmail }
      : {}),
  }));
  const [quote, setQuote] = useState<PublicGiftCardPurchaseQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('online');
  const quoteRequestId = useRef(0);

  // Keep shipping method valid once catalog settings load (may arrive after first paint).
  useEffect(() => {
    const methods = settings?.shippingMethods ?? [];
    if (methods.length === 0) return;
    setShippingMethodId((prev) =>
      methods.some((method) => method.id === prev) ? prev : methods[0]!.id,
    );
  }, [settings?.shippingMethods]);

  useEffect(() => {
    if (!customer) return;
    setForm((prev) => {
      const purchaserName = prev.purchaserName || customer.name || '';
      const purchaserEmail = prev.purchaserEmail || customer.email || '';
      const recipientName = assistantPrefill.buyAsGift
        ? prev.recipientName
        : prev.recipientName || customer.name || '';
      const recipientEmail = assistantPrefill.buyAsGift
        ? prev.recipientEmail
        : prev.recipientEmail || customer.email || '';
      const recipientPhone = assistantPrefill.buyAsGift
        ? prev.recipientPhone
        : prev.recipientPhone || customer.phone || '';
      if (
        purchaserName === prev.purchaserName &&
        purchaserEmail === prev.purchaserEmail &&
        recipientName === prev.recipientName &&
        recipientEmail === prev.recipientEmail &&
        recipientPhone === prev.recipientPhone
      ) {
        return prev;
      }
      return {
        ...prev,
        purchaserName,
        purchaserEmail,
        recipientName,
        recipientEmail,
        recipientPhone,
      };
    });
  }, [
    assistantPrefill.buyAsGift,
    customer,
    customer?.email,
    customer?.name,
    customer?.phone,
  ]);

  useEffect(() => {
    if (!paymentSessionId || success) return;
    setSubmitting(true);
    void confirmPublicBookingPayment(slug!, paymentSessionId)
      .then(() => setSuccess(true))
      .catch(() => setErrorMessage(copy.giftCardPaymentFailed))
      .finally(() => setSubmitting(false));
  }, [copy.giftCardPaymentFailed, paymentSessionId, slug, success]);

  const buildPayload = useCallback(
    () =>
      buildGiftCardPurchasePayload({
        cardType,
        amount,
        serviceIds,
        bundleId,
        packageId,
        subscriptionPlanId,
        deliveryMethod,
        buyForSelf,
        shippingMethodId,
        form,
        customerName: customer?.name,
      }),
    [
      amount,
      bundleId,
      buyForSelf,
      cardType,
      customer?.name,
      deliveryMethod,
      form,
      packageId,
      serviceIds,
      shippingMethodId,
      subscriptionPlanId,
    ],
  );

  useEffect(() => {
    if (!slug || !settings) return;
    const payload = buildPayload();
    if (!canQuoteGiftCardPurchase({ payload, deliveryMethod, form })) return;

    const requestId = ++quoteRequestId.current;
    setQuoteLoading(true);
    setQuoteError(null);
    void quotePublicGiftCardPurchase(slug, payload!)
      .then((q) => {
        if (requestId !== quoteRequestId.current) return;
        setQuote(q);
      })
      .catch((err: unknown) => {
        if (requestId !== quoteRequestId.current) return;
        setQuote(null);
        setQuoteError(formatFriendlyNetworkError(err, copy.giftCardQuoteFailed));
      })
      .finally(() => {
        if (requestId === quoteRequestId.current) setQuoteLoading(false);
      });
  }, [buildPayload, copy.giftCardQuoteFailed, deliveryMethod, form, slug, settings]);

  const showCashOption = settings?.acceptCashPayments === true && (quote?.total ?? 0) > 0;
  const primary = profile?.branding.primaryColor || '#7c3aed';

  const onSubmit = async () => {
    if (!slug) return;
    setErrorMessage(null);
    const payload = buildPayload();
    if (!payload) {
      setErrorMessage(copy.giftCardEmailRequired);
      return;
    }
    if (!form.consent) {
      setErrorMessage(copy.giftCardConsentRequired);
      return;
    }
    if (!authed && !form.purchaserName.trim()) {
      setErrorMessage(copy.giftCardPurchaserNameRequired);
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
      openExternalCheckout(checkout.url);
    } catch (err: unknown) {
      setErrorMessage(
        formatFriendlyNetworkError(err, copy.giftCardCheckoutFailed),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || catalogQuery.isLoading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" style={{ marginTop: '40vh' }} />
        </IonContent>
      </IonPage>
    );
  }

  if (success) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{copy.giftCardSuccessTitle}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding ion-text-center">
          <p style={{ fontSize: 48, marginTop: 48 }}>🎁</p>
          <h2>{copy.giftCardSuccessTitle}</h2>
          <p style={{ color: '#6b7280' }}>{copy.giftCardSuccessBody}</p>
          <IonButton
            style={{ marginTop: 24, '--background': primary }}
            onClick={() => history.push(buildSalonPath(slug!, '/account'))}
          >
            {copy.giftCardMyGiftCards}
          </IonButton>
        </IonContent>
      </IonPage>
    );
  }

  if (error || !profile || !slug || !settings) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <p>{error || copy.networkLoadFailed}</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <ConsumerAiShell slug={slug} profile={profile} copy={copy} locale={locale}>
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={buildSalonPath(slug, '/gift-cards')}  text={copy.guidePageBack} />
          </IonButtons>
          <IonTitle>{copy.giftCardCheckoutTitle}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p style={{ color: '#6b7280', marginBottom: 16 }}>{quote?.label ?? cardType}</p>

        <h3 style={{ fontSize: 15, fontWeight: 600 }}>{copy.giftCardYourDetails}</h3>
        {!authed ? (
          <IonItem>
            <IonLabel position="stacked">{copy.giftCardPurchaserName}</IonLabel>
            <IonInput
              value={form.purchaserName}
              onIonInput={(e) => setForm({ ...form, purchaserName: String(e.detail.value ?? '') })}
            />
          </IonItem>
        ) : null}
        <IonItem>
          <IonLabel position="stacked">{copy.giftCardPurchaserEmail}</IonLabel>
          <IonInput
            type="email"
            value={form.purchaserEmail}
            onIonInput={(e) => setForm({ ...form, purchaserEmail: String(e.detail.value ?? '') })}
          />
        </IonItem>

        <h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 16 }}>{copy.giftCardRecipientSection}</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <IonButton fill={buyForSelf ? 'solid' : 'outline'} onClick={() => setBuyForSelf(true)}>
            {copy.giftCardBuyForSelf}
          </IonButton>
          <IonButton fill={!buyForSelf ? 'solid' : 'outline'} onClick={() => setBuyForSelf(false)}>
            {copy.giftCardBuyAsGift}
          </IonButton>
        </div>

        {(!buyForSelf || deliveryMethod === 'physical') ? (
          <>
            <IonItem>
              <IonLabel position="stacked">{copy.giftCardRecipientName}</IonLabel>
              <IonInput
                value={form.recipientName}
                onIonInput={(e) => setForm({ ...form, recipientName: String(e.detail.value ?? '') })}
              />
            </IonItem>
            {!buyForSelf ? (
              <IonItem>
                <IonLabel position="stacked">{copy.giftCardRecipientEmail}</IonLabel>
                <IonInput
                  type="email"
                  value={form.recipientEmail}
                  onIonInput={(e) => setForm({ ...form, recipientEmail: String(e.detail.value ?? '') })}
                />
              </IonItem>
            ) : null}
          </>
        ) : null}

        <IonItem>
          <IonLabel position="stacked">{copy.giftCardRecipientPhone}</IonLabel>
          <IonInput
            type="tel"
            value={form.recipientPhone}
            onIonInput={(e) => setForm({ ...form, recipientPhone: String(e.detail.value ?? '') })}
          />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">{copy.giftCardPersonalMessage}</IonLabel>
          <IonTextarea
            value={form.personalMessage}
            onIonInput={(e) => setForm({ ...form, personalMessage: String(e.detail.value ?? '') })}
          />
        </IonItem>

        <h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 16 }}>{copy.giftCardDeliverySection}</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {deliveryOptions.map((method) => (
            <IonButton
              key={method}
              fill={deliveryMethod === method ? 'solid' : 'outline'}
              onClick={() => setDeliveryMethod(method)}
            >
              {method === 'digital' ? copy.giftCardDeliveryDigital : copy.giftCardDeliveryPhysical}
            </IonButton>
          ))}
        </div>

        {deliveryMethod === 'physical' ? (
          <div className="salon-card" style={{ marginBottom: 16 }}>
            {(settings?.shippingMethods?.length ?? 0) > 0 ? (
              <IonItem>
                <IonLabel position="stacked">{copy.giftCardShippingMethod}</IonLabel>
                <IonSelect
                  value={shippingMethodId}
                  interface="popover"
                  onIonChange={(e) => setShippingMethodId(String(e.detail.value ?? ''))}
                >
                  {(settings?.shippingMethods ?? []).map((method) => (
                    <IonSelectOption key={method.id} value={method.id}>
                      {method.label} —{' '}
                      {formatPublicMoney(
                        method.fee,
                        quote?.currency ?? profile?.currency,
                        profile?.currency,
                      )}{' '}
                      ({method.estimatedDays})
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            ) : null}
            <IonItem>
              <IonLabel position="stacked">{copy.giftCardAddressLine1}</IonLabel>
              <IonInput value={form.line1} onIonInput={(e) => setForm({ ...form, line1: String(e.detail.value ?? '') })} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">{copy.giftCardAddressLine2}</IonLabel>
              <IonInput value={form.line2} onIonInput={(e) => setForm({ ...form, line2: String(e.detail.value ?? '') })} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">{copy.giftCardCity}</IonLabel>
              <IonInput value={form.city} onIonInput={(e) => setForm({ ...form, city: String(e.detail.value ?? '') })} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">{copy.giftCardStateRegion}</IonLabel>
              <IonInput
                value={form.stateRegion}
                onIonInput={(e) => setForm({ ...form, stateRegion: String(e.detail.value ?? '') })}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">{copy.giftCardPostalCode}</IonLabel>
              <IonInput
                value={form.postalCode}
                onIonInput={(e) => setForm({ ...form, postalCode: String(e.detail.value ?? '') })}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">{copy.giftCardCountry}</IonLabel>
              <IonInput
                value={form.country}
                onIonInput={(e) => setForm({ ...form, country: String(e.detail.value ?? '') })}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">{copy.giftCardDeliveryInstructions}</IonLabel>
              <IonTextarea
                value={form.instructions}
                onIonInput={(e) => setForm({ ...form, instructions: String(e.detail.value ?? '') })}
              />
            </IonItem>
          </div>
        ) : null}

        {quote ? (
          <div className="salon-card" style={{ marginBottom: 16, fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{copy.giftCardTotal}</span>
              <span>{formatPublicMoney(quote.subtotal, quote.currency, profile.currency)}</span>
            </div>
            {quote.shippingFee > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span>{copy.giftCardShipping}</span>
                <span>{formatPublicMoney(quote.shippingFee, quote.currency, profile.currency)}</span>
              </div>
            ) : null}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 8,
                paddingTop: 8,
                borderTop: '1px solid #e5e7eb',
                fontWeight: 600,
              }}
            >
              <span>{copy.giftCardTotalDue}</span>
              <span>{formatPublicMoney(quote.total, quote.currency, profile.currency)}</span>
            </div>
          </div>
        ) : null}

        {quoteLoading ? <IonSpinner name="dots" /> : null}
        {quoteError ? <p style={{ color: '#b91c1c', fontSize: 14 }}>{quoteError}</p> : null}

        <IonItem lines="none">
          <IonCheckbox
            checked={form.consent}
            onIonChange={(e) => setForm({ ...form, consent: e.detail.checked })}
          />
          <IonLabel style={{ marginLeft: 8 }}>{copy.giftCardPrivacyConsent}</IonLabel>
        </IonItem>

        {showCashOption ? (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontWeight: 600 }}>{copy.giftCardPaymentMethod}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <IonButton
                expand="block"
                fill={paymentMethod === 'online' ? 'solid' : 'outline'}
                onClick={() => setPaymentMethod('online')}
              >
                {copy.giftCardPayOnline}
              </IonButton>
              <IonButton
                expand="block"
                fill={paymentMethod === 'cash' ? 'solid' : 'outline'}
                onClick={() => setPaymentMethod('cash')}
              >
                {copy.giftCardPayCashShort}
              </IonButton>
            </div>
            {paymentMethod === 'cash' && quote ? (
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
                {formatCopy(copy.giftCardPayCashAtVisit, {
                  amount: formatPublicMoney(quote.total, quote.currency, profile.currency),
                })}
              </p>
            ) : null}
          </div>
        ) : null}

        {errorMessage ? <p style={{ color: '#b91c1c', fontSize: 14 }}>{errorMessage}</p> : null}

        <IonButton
          expand="block"
          disabled={submitting || quoteLoading || !quote}
          style={{ marginTop: 16, '--background': primary }}
          onClick={() => void onSubmit()}
        >
          {submitting ? (
            <IonSpinner name="crescent" />
          ) : paymentMethod === 'cash' && showCashOption ? (
            copy.giftCardConfirmCashPurchase
          ) : (
            copy.giftCardPayNow
          )}
        </IonButton>
      </IonContent>
    </IonPage>
    </ConsumerAiShell>
  );
}
