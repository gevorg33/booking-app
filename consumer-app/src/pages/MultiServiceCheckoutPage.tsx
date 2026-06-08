import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { formatBookingDateTimeRange, formatDateDisplay, formatScheduleTime } from '../lib/date-format.js';
import { formatPublicMoney, resolveTenantPriceCurrency } from '../lib/business-currency.js';
import {
  getCustomerToken,
  getStoredCustomerProfile,
  setCustomerSession,
} from '../lib/customer-auth.js';
import {
  hasMultiCheckoutPaymentReturn,
  mergeMultiCheckoutReturnQuery,
} from '../lib/consumer-checkout-return.util.js';
import {
  clearPendingMultiCheckoutPayment,
  loadPendingMultiCheckoutBySlug,
  loadPendingMultiCheckoutPayment,
  requiresMultiServiceOnlinePayment,
  resolveMultiServiceAmountDue,
  savePendingMultiCheckoutPayment,
  showMultiServiceCashOption,
  type MultiCheckoutPaymentMethod,
} from '../lib/multi-service-checkout-payment.util.js';
import {
  normalizeGuestContact,
  resolveCheckoutContact,
  validateGuestCheckoutContact,
  type GuestCheckoutContact,
} from '../lib/guest-booking.util.js';
import {
  buildMultiServiceSchedulePath,
  parseMultiServiceIds,
  persistMultiServiceCart,
  resolvePathAfterRemovingService,
  sumMultiServiceDuration,
  sumMultiServicePrice,
} from '../lib/multi-service-booking.js';
import { ConsumerCheckoutContactForm } from '../components/ConsumerCheckoutContactForm.js';
import { ConsumerCheckoutDiscounts } from '../components/ConsumerCheckoutDiscounts.js';
import { ConsumerCheckoutQuoteSummary } from '../components/ConsumerCheckoutQuoteSummary.js';
import { useCheckoutDiscounts } from '../hooks/use-checkout-discounts.js';
import {
  bookPublicMultiService,
  confirmPublicBookingPayment,
  createPublicMultiServiceCheckout,
  fetchPublicServices,
  getPublicCustomerLoyalty,
  quotePublicMultiService,
} from '../services/public-api.js';

type ScheduleLine = {
  serviceId: string;
  employeeId: string;
  startTime: string;
  employeeName?: string;
};

function openExternalCheckout(url: string): void {
  if (typeof window === 'undefined') return;
  window.open(url, Capacitor.isNativePlatform() ? '_system' : '_blank', 'noopener,noreferrer');
}

export default function MultiServiceCheckoutPage() {
  const history = useHistory();
  const location = useLocation();
  const { slug, profile, loading, error } = useTenantBootstrap();
  const { copy, locale } = useConsumerCopy(slug ?? '', profile ?? { locale: 'en' });
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const serviceIds = useMemo(() => parseMultiServiceIds(params.get('services')), [params]);
  const startTime = params.get('startTime')?.trim() ?? '';
  const employeeId = params.get('employeeId')?.trim() ?? '';
  const employeeName = params.get('employeeName')?.trim() ?? '';
  const linesRaw = params.get('lines');

  const lines = useMemo(() => {
    if (!linesRaw) return undefined;
    try {
      return JSON.parse(linesRaw) as ScheduleLine[];
    } catch {
      return undefined;
    }
  }, [linesRaw]);

  const [guestContact, setGuestContact] = useState<GuestCheckoutContact>(() =>
    normalizeGuestContact({}),
  );
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<MultiCheckoutPaymentMethod>('online');
  const [awaitingPaymentReturn, setAwaitingPaymentReturn] = useState(false);

  const servicesQuery = useQuery({
    queryKey: ['public-services', slug],
    queryFn: () => fetchPublicServices(slug!),
    enabled: Boolean(slug),
  });

  const selectedServices = useMemo(
    () =>
      serviceIds
        .map((id) => servicesQuery.data?.find((svc) => svc.id === id))
        .filter(Boolean) ?? [],
    [serviceIds, servicesQuery.data],
  );

  const profileStored = slug ? getStoredCustomerProfile(slug) : null;
  const authed = slug ? !!getCustomerToken(slug) : false;
  const schedulingMode = profile?.multiService?.schedulingMode ?? 'same_visit';
  const scheduleStart = startTime || lines?.[0]?.startTime;
  const hasSchedule = Boolean(scheduleStart || lines?.length);
  const isPaymentReturn = useMemo(
    () => Boolean(slug && hasMultiCheckoutPaymentReturn(params, slug, serviceIds)),
    [params, serviceIds, slug],
  );

  const { data: loyalty } = useQuery({
    queryKey: ['customer-loyalty', slug],
    queryFn: () => getPublicCustomerLoyalty(slug!),
    enabled: Boolean(slug && authed),
  });

  const fallbackSubtotal = sumMultiServicePrice(
    selectedServices as Array<{ price: number }>,
  );
  const {
    promoCode,
    setPromoCode,
    appliedPromo,
    promoError,
    loyaltyPoints,
    setLoyaltyPoints,
    quote,
    quoteLoading,
    quoteError,
    applyPromoCode,
    clearPromoCode,
    useMaxLoyaltyPoints,
    discountPayload,
  } = useCheckoutDiscounts({
    enabled: Boolean(slug && serviceIds.length >= 2 && hasSchedule),
    fetchQuote: (discounts) =>
      quotePublicMultiService(slug!, { serviceIds, ...discounts }),
    loyalty: loyalty ?? null,
    fallbackSubtotal,
    quoteFailedMessage: copy.networkLoadFailed,
    deps: [serviceIds.join(',')],
  });

  useEffect(() => {
    if (!slug || serviceIds.length < 2) return;
    if (!hasSchedule && isPaymentReturn) {
      const merged = mergeMultiCheckoutReturnQuery(slug, params);
      if (merged.get('services')?.trim() && !params.get('services')?.trim()) {
        history.replace(`${location.pathname}?${merged.toString()}`);
      }
      return;
    }
    if (!hasSchedule && !isPaymentReturn) {
      history.replace(buildMultiServiceSchedulePath(slug, serviceIds, schedulingMode));
    }
  }, [
    hasSchedule,
    history,
    isPaymentReturn,
    location.pathname,
    params,
    schedulingMode,
    serviceIds,
    slug,
  ]);

  useEffect(() => {
    if (isPaymentReturn) setAwaitingPaymentReturn(true);
  }, [isPaymentReturn]);

  const amountDue = resolveMultiServiceAmountDue(
    quote,
    sumMultiServicePrice(selectedServices as Array<{ price: number }>),
  );
  const cashAvailable = profile
    ? showMultiServiceCashOption(profile, amountDue)
    : false;

  const confirmPendingPayment = useCallback(async () => {
    if (!slug) return false;
    const sessionFromUrl = params.get('session_id');
    const pending =
      (serviceIds.length >= 2
        ? loadPendingMultiCheckoutPayment(slug, serviceIds)
        : null) ?? loadPendingMultiCheckoutBySlug(slug);
    const sessionId = sessionFromUrl?.trim() || pending?.sessionId;
    if (!sessionId) return false;

    setSubmitting(true);
    setMessage('');
    try {
      const result = await confirmPublicBookingPayment(slug, sessionId);
      if (result.customer) {
        const token = getCustomerToken(slug);
        setCustomerSession(slug, token, result.customer);
      }
      clearPendingMultiCheckoutPayment();
      persistMultiServiceCart(slug, []);
      setAwaitingPaymentReturn(false);
      setSuccess(true);
      return true;
    } catch {
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [params, serviceIds, slug]);

  useEffect(() => {
    if (!slug || !isPaymentReturn) return;
    void confirmPendingPayment();
  }, [confirmPendingPayment, isPaymentReturn, slug]);

  useEffect(() => {
    if (!slug || !Capacitor.isNativePlatform() || !awaitingPaymentReturn) return;
    const handle = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) void confirmPendingPayment();
    });
    return () => {
      void handle.then((listener) => listener.remove());
    };
  }, [awaitingPaymentReturn, confirmPendingPayment, slug]);

  const removeService = (removeId: string) => {
    if (!slug) return;
    persistMultiServiceCart(
      slug,
      serviceIds.filter((id) => id !== removeId),
    );
    history.push(resolvePathAfterRemovingService(slug, serviceIds, removeId, schedulingMode));
  };

  const submitBooking = async (options?: { paymentOverride?: MultiCheckoutPaymentMethod }) => {
    if (!slug || !profile || serviceIds.length < 2 || !hasSchedule) return;
    const customer = resolveCheckoutContact(profileStored, guestContact);
    const validationError = customer
      ? validateGuestCheckoutContact(customer)
      : 'Enter your contact details to book.';
    if (!customer || validationError) {
      setMessage(validationError ?? 'Enter your contact details to book.');
      return;
    }

    const method = options?.paymentOverride ?? paymentMethod;
    const payload = {
      serviceIds,
      ...(startTime ? { blockStartTime: startTime, employeeId: employeeId || undefined } : {}),
      ...(lines?.length ? { lines } : {}),
      ...discountPayload,
      ...(method === 'cash' ? { markPaid: true as const } : {}),
      customer: {
        name: customer.name,
        email: customer.email || undefined,
        phone: customer.phone || undefined,
      },
    };

    setSubmitting(true);
    setMessage('');
    try {
      if (requiresMultiServiceOnlinePayment(profile, amountDue, method)) {
        const checkout = await createPublicMultiServiceCheckout(slug, payload);
        savePendingMultiCheckoutPayment({
          slug,
          sessionId: checkout.sessionId,
          serviceIds,
        });
        setAwaitingPaymentReturn(true);
        openExternalCheckout(checkout.url);
        setMessage(copy.multiServicePaymentReturnHint);
        return;
      }
      await bookPublicMultiService(slug, payload);
      clearPendingMultiCheckoutPayment();
      persistMultiServiceCart(slug, []);
      setAwaitingPaymentReturn(false);
      setSuccess(true);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : copy.assistantErrorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || servicesQuery.isLoading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" style={{ marginTop: '40vh' }} />
        </IonContent>
      </IonPage>
    );
  }

  if (error || !profile || !slug || serviceIds.length < 2) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref={buildSalonPath(slug ?? '', '/services')} />
            </IonButtons>
            <IonTitle>{copy.multiServiceCheckoutTitle}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>{error || 'Missing booking details.'}</p>
        </IonContent>
      </IonPage>
    );
  }

  if (success) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{copy.multiServiceBookedTitle}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding ion-text-center">
          <p style={{ fontSize: 48, marginTop: 48 }}>✓</p>
          <h2>{copy.multiServiceBookedTitle}</h2>
          <p style={{ color: '#6b7280' }}>{copy.multiServiceBookedHint}</p>
          <IonButton
            style={{ marginTop: 24, '--background': profile.branding.primaryColor || '#7c3aed' }}
            onClick={() => history.push(buildSalonPath(slug))}
          >
            {copy.bookAnother}
          </IonButton>
        </IonContent>
      </IonPage>
    );
  }

  const primary = profile.branding.primaryColor || '#7c3aed';
  const turnover = profile.multiService?.turnoverBufferMinutes ?? 5;
  const totalDuration = sumMultiServiceDuration(
    selectedServices as Array<{ durationMinutes: number; bufferMinutes?: number }>,
    turnover,
  );
  const subtotal = sumMultiServicePrice(selectedServices as Array<{ price: number }>);
  const currency = resolveTenantPriceCurrency(selectedServices[0]?.currency, profile.currency);
  const scheduleEnd = scheduleStart
    ? new Date(new Date(scheduleStart).getTime() + totalDuration * 60_000).toISOString()
    : null;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton
              defaultHref={buildMultiServiceSchedulePath(slug, serviceIds, schedulingMode)}
            />
          </IonButtons>
          <IonTitle>{copy.multiServiceCheckoutTitle}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {scheduleStart ? (
          <IonItem lines="none">
            <IonLabel>
              <h2 style={{ fontWeight: 600 }}>
                {formatBookingDateTimeRange(scheduleStart, scheduleEnd ?? scheduleStart, locale)}
              </h2>
              <p>{totalDuration} min</p>
              {employeeName ? (
                <p>{copy.multiServiceWithProvider.replace('{name}', employeeName)}</p>
              ) : null}
            </IonLabel>
          </IonItem>
        ) : null}

        <IonList>
          {selectedServices.map((service) => {
            const line = lines?.find((entry) => entry.serviceId === service!.id);
            return (
              <IonItem key={service!.id}>
                <IonLabel>
                  <h3>{service!.name}</h3>
                  <p>
                    {formatPublicMoney(service!.price, service!.currency, profile.currency)}
                  </p>
                  {line?.startTime ? (
                    <p style={{ fontSize: 12, color: '#6b7280' }}>
                      {formatDateDisplay(line.startTime, locale)} ·{' '}
                      {formatScheduleTime(line.startTime, locale)}
                      {line.employeeName
                        ? ` · ${copy.multiServiceWithProvider.replace('{name}', line.employeeName)}`
                        : ''}
                    </p>
                  ) : null}
                </IonLabel>
                <IonButton
                  slot="end"
                  fill="clear"
                  color="medium"
                  aria-label={copy.removeService}
                  onClick={() => removeService(service!.id)}
                >
                  <IonIcon icon={trashOutline} />
                </IonButton>
              </IonItem>
            );
          })}
        </IonList>

        <ConsumerCheckoutDiscounts
          copy={copy}
          currency={quote?.currency ?? currency}
          tenantCurrency={profile.currency}
          authed={authed}
          loyalty={loyalty ?? null}
          quote={quote}
          quoteLoading={quoteLoading}
          promoCode={promoCode}
          appliedPromo={appliedPromo}
          promoError={promoError}
          quoteError={quoteError}
          loyaltyPoints={loyaltyPoints}
          fallbackSubtotal={fallbackSubtotal}
          onPromoCodeChange={setPromoCode}
          onApplyPromo={applyPromoCode}
          onClearPromo={clearPromoCode}
          onLoyaltyPointsChange={setLoyaltyPoints}
          onUseMaxLoyalty={useMaxLoyaltyPoints}
        />

        {quote ? (
          <ConsumerCheckoutQuoteSummary
            quote={quote}
            tenantCurrency={profile.currency}
            copy={copy}
          />
        ) : (
          <IonItem lines="none">
            <IonLabel>
              <p style={{ fontWeight: 600 }}>
                {copy.totalDue}: {formatPublicMoney(amountDue, currency, profile.currency)}
              </p>
            </IonLabel>
          </IonItem>
        )}

        <ConsumerCheckoutContactForm value={guestContact} onChange={setGuestContact} />

        {cashAvailable ? (
          <div className="ion-margin-top">
            <p style={{ fontWeight: 600, marginBottom: 8 }}>{copy.giftCardPaymentMethod}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
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
          </div>
        ) : null}

        {message ? (
          <p style={{ color: awaitingPaymentReturn ? '#374151' : '#b91c1c', fontSize: 14 }}>
            {message}
          </p>
        ) : null}

        {awaitingPaymentReturn ? (
          <div style={{ marginTop: 8 }}>
            <IonSpinner name="dots" style={{ marginRight: 8 }} />
            <IonButton fill="clear" size="small" onClick={() => void confirmPendingPayment()}>
              {copy.multiServiceConfirmPaymentReturn}
            </IonButton>
          </div>
        ) : null}

        <IonButton
          expand="block"
          disabled={submitting || awaitingPaymentReturn}
          style={{ marginTop: 16, '--background': primary }}
          onClick={() => void submitBooking()}
        >
          {submitting ? (
            <IonSpinner name="crescent" />
          ) : awaitingPaymentReturn ? (
            copy.multiServiceCompletePayment
          ) : (
            copy.multiServiceConfirmAction
          )}
        </IonButton>
      </IonContent>
    </IonPage>
  );
}
