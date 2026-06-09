import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { formatBookingDateTimeRange, formatDateDisplay, formatScheduleTime } from '../lib/date-format.js';
import { formatPublicMoney } from '../lib/business-currency.js';
import { formatCopy } from '../lib/copy.js';
import {
  getCustomerToken,
  getStoredCustomerProfile,
  setCustomerSession,
} from '../lib/customer-auth.js';
import {
  hasPackageCheckoutPaymentReturn,
  mergePackageCheckoutReturnQuery,
} from '../lib/consumer-checkout-return.util.js';
import {
  clearPendingPackageCheckoutPayment,
  loadPendingPackageCheckoutByPackage,
  loadPendingPackageCheckoutPayment,
  requiresPackageOnlinePayment,
  resolvePackageAmountDue,
  savePendingPackageCheckoutPayment,
  showPackageCashOption,
  type PackageCheckoutPaymentMethod,
} from '../lib/package-checkout-payment.util.js';
import {
  normalizeGuestContact,
  resolveCheckoutContact,
  validateGuestCheckoutContact,
  type GuestCheckoutContact,
} from '../lib/guest-booking.util.js';
import {
  buildPackageConfirmPath,
  computePackageTotalDurationMinutes,
  expandPackageServiceItems,
  parsePackageBookingLines,
} from '../lib/package-booking.js';
import { resolvePackageItemPricing } from '../lib/package-item-pricing.util.js';
import { ConsumerCheckoutContactForm } from '../components/ConsumerCheckoutContactForm.js';
import { ConsumerCheckoutDiscounts } from '../components/ConsumerCheckoutDiscounts.js';
import { ConsumerCheckoutQuoteSummary } from '../components/ConsumerCheckoutQuoteSummary.js';
import { useCheckoutDiscounts } from '../hooks/use-checkout-discounts.js';
import {
  bookPublicPackage,
  confirmPublicBookingPayment,
  createPublicPackageCheckout,
  fetchPublicPackage,
  getPublicCustomerLoyalty,
  quotePublicPackage,
} from '../services/public-api.js';

function openExternalCheckout(url: string): void {
  if (typeof window === 'undefined') return;
  window.open(url, Capacitor.isNativePlatform() ? '_system' : '_blank', 'noopener,noreferrer');
}

export default function PackageCheckoutPage() {
  const history = useHistory();
  const location = useLocation();
  const { slug, packageId } = useParams<{ slug: string; packageId: string }>();
  const { profile, loading, error } = useTenantBootstrap();
  const { copy, locale } = useConsumerCopy(slug ?? '', profile ?? { locale: 'en' });
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const lines = useMemo(() => parsePackageBookingLines(params.get('lines')), [params]);
  const employeeName = params.get('employeeName')?.trim() ?? '';

  const [guestContact, setGuestContact] = useState<GuestCheckoutContact>(() =>
    normalizeGuestContact({}),
  );
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PackageCheckoutPaymentMethod>('online');
  const [awaitingPaymentReturn, setAwaitingPaymentReturn] = useState(false);
  const [bookedWithCash, setBookedWithCash] = useState(false);

  const packageQuery = useQuery({
    queryKey: ['public-package', slug, packageId],
    queryFn: () => fetchPublicPackage(slug!, packageId!),
    enabled: Boolean(slug && packageId),
  });
  const pkg = packageQuery.data?.package;

  const profileStored = slug ? getStoredCustomerProfile(slug) : null;
  const authed = slug ? !!getCustomerToken(slug) : false;
  const turnover = profile?.multiService?.turnoverBufferMinutes ?? 5;
  const scheduleStart = lines[0]?.startTime;
  const hasSchedule = lines.length > 0;
  const isPaymentReturn = useMemo(
    () => Boolean(slug && packageId && hasPackageCheckoutPaymentReturn(params, slug, packageId)),
    [packageId, params, slug],
  );

  const expandedItems = useMemo(() => (pkg ? expandPackageServiceItems(pkg) : []), [pkg]);
  const pricedItems = useMemo(() => (pkg ? resolvePackageItemPricing(pkg) : []), [pkg]);
  const totalDuration = useMemo(
    () => (pkg ? computePackageTotalDurationMinutes(pkg, turnover) : 0),
    [pkg, turnover],
  );

  const { data: loyalty } = useQuery({
    queryKey: ['customer-loyalty', slug],
    queryFn: () => getPublicCustomerLoyalty(slug!),
    enabled: Boolean(slug && authed),
  });

  const fallbackSubtotal = pkg?.pricing.packagePrice ?? 0;
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
    enabled: Boolean(slug && packageId && pkg),
    fetchQuote: (discounts) =>
      quotePublicPackage(slug!, { packageId: packageId!, ...discounts }),
    loyalty: loyalty ?? null,
    fallbackSubtotal,
    quoteFailedMessage: copy.networkLoadFailed,
    deps: [packageId],
  });

  useEffect(() => {
    if (!slug || !packageId || hasSchedule) return;
    if (!isPaymentReturn) return;
    const merged = mergePackageCheckoutReturnQuery(slug, packageId, params);
    if (!merged.get('lines')?.trim()) return;
    history.replace(`${location.pathname}?${merged.toString()}`);
  }, [hasSchedule, history, isPaymentReturn, location.pathname, packageId, params, slug]);

  useEffect(() => {
    if (!slug || !packageId) return;
    if (!hasSchedule && !isPaymentReturn) {
      history.replace(buildPackageConfirmPath(slug, packageId));
    }
  }, [hasSchedule, history, isPaymentReturn, packageId, slug]);

  useEffect(() => {
    if (isPaymentReturn) setAwaitingPaymentReturn(true);
  }, [isPaymentReturn]);

  const amountDue = resolvePackageAmountDue(quote, fallbackSubtotal);
  const cashAvailable = profile ? showPackageCashOption(profile, amountDue) : false;

  const confirmPendingPayment = useCallback(async () => {
    if (!slug || !packageId) return false;
    const sessionFromUrl = params.get('session_id');
    const pending =
      loadPendingPackageCheckoutPayment(slug, packageId, lines) ??
      loadPendingPackageCheckoutByPackage(slug, packageId);
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
      clearPendingPackageCheckoutPayment();
      setAwaitingPaymentReturn(false);
      setSuccess(true);
      return true;
    } catch {
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [lines, packageId, params, slug]);

  useEffect(() => {
    if (!slug || !packageId || !isPaymentReturn) return;
    void confirmPendingPayment();
  }, [confirmPendingPayment, isPaymentReturn, packageId, slug]);

  useEffect(() => {
    if (!slug || !Capacitor.isNativePlatform() || !awaitingPaymentReturn) return;
    const handle = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) void confirmPendingPayment();
    });
    return () => {
      void handle.then((listener) => listener.remove());
    };
  }, [awaitingPaymentReturn, confirmPendingPayment, slug]);

  const submitBooking = async (options?: { paymentOverride?: PackageCheckoutPaymentMethod }) => {
    if (!slug || !profile || !packageId || !pkg || !hasSchedule) return;
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
      packageId,
      lines,
      ...discountPayload,
      ...(method === 'cash' ? { markPaid: true as const } : {}),
      customer: {
        name: customer.name,
        email: customer.email || undefined,
        phone: customer.phone || undefined,
        privacyConsentAccepted: true,
      },
    };

    setSubmitting(true);
    setMessage('');
    try {
      if (requiresPackageOnlinePayment(profile, amountDue, method)) {
        const checkout = await createPublicPackageCheckout(slug, payload);
        savePendingPackageCheckoutPayment({
          slug,
          sessionId: checkout.sessionId,
          packageId,
          lines,
        });
        setAwaitingPaymentReturn(true);
        openExternalCheckout(checkout.url);
        setMessage(copy.packagePaymentReturnHint);
        return;
      }
      await bookPublicPackage(slug, payload);
      clearPendingPackageCheckoutPayment();
      setAwaitingPaymentReturn(false);
      setBookedWithCash(method === 'cash' && cashAvailable);
      setSuccess(true);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : copy.assistantErrorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || packageQuery.isLoading || (isPaymentReturn && !hasSchedule && submitting)) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" style={{ marginTop: '40vh' }} />
          {isPaymentReturn ? (
            <p style={{ color: '#6b7280', marginTop: 16 }}>{copy.packageCompletePayment}</p>
          ) : null}
        </IonContent>
      </IonPage>
    );
  }

  if (error || !profile || !slug || !packageId || !pkg) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref={buildSalonPath(slug ?? '', '/services')} />
            </IonButtons>
            <IonTitle>{copy.packageCheckoutTitle}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>{error || 'Booking is not available for this salon.'}</p>
        </IonContent>
      </IonPage>
    );
  }

  if (!hasSchedule && !isPaymentReturn) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref={buildSalonPath(slug, '/services')} />
            </IonButtons>
            <IonTitle>{copy.packageCheckoutTitle}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>Missing package schedule. Pick a time to continue.</p>
        </IonContent>
      </IonPage>
    );
  }

  if (success) {
    const confirmedTotal = amountDue;
    const scheduleEnd = scheduleStart
      ? new Date(new Date(scheduleStart).getTime() + totalDuration * 60_000).toISOString()
      : null;

    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{copy.packageBookedTitle}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p style={{ fontSize: 48, textAlign: 'center', marginTop: 24 }}>✓</p>
          <h2 style={{ textAlign: 'center' }}>{copy.packageBookedTitle}</h2>
          <p style={{ color: '#6b7280', textAlign: 'center' }}>{copy.packageBookedHint}</p>
          {bookedWithCash && confirmedTotal > 0 ? (
            <p style={{ color: '#b45309', textAlign: 'center', marginTop: 8 }}>
              {formatCopy(copy.giftCardPayCashAtVisit, {
                amount: formatPublicMoney(confirmedTotal, pkg.currency, profile.currency),
              })}
            </p>
          ) : null}

          {scheduleStart ? (
            <IonItem lines="none">
              <IonLabel>
                <h3 style={{ fontWeight: 600 }}>
                  {formatBookingDateTimeRange(scheduleStart, scheduleEnd ?? scheduleStart, locale)}
                </h3>
                <p>{totalDuration} min</p>
                {employeeName ? (
                  <p>{copy.multiServiceWithProvider.replace('{name}', employeeName)}</p>
                ) : null}
              </IonLabel>
            </IonItem>
          ) : null}

          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 16 }}>{copy.packageIncludedServices}</p>
          <p style={{ fontWeight: 600 }}>{pkg.name}</p>
          <IonList>
            {expandedItems.map((item, index) => {
              const line = lines[index];
              const priced = pricedItems.find((entry) => entry.serviceId === item.serviceId);
              const discountedUnit =
                priced && priced.quantity > 0
                  ? priced.discountedLineTotal / priced.quantity
                  : priced?.unitPrice;
              return (
                <IonItem key={`${item.serviceId}-${index}`} lines="none">
                  <IonLabel>
                    <h3>{item.serviceName}</h3>
                    <p>{item.durationMinutes + item.bufferMinutes} min</p>
                    {line ? (
                      <p style={{ fontSize: 12, color: '#6b7280' }}>
                        {formatDateDisplay(line.startTime, locale)} ·{' '}
                        {formatScheduleTime(line.startTime, locale)}
                      </p>
                    ) : null}
                  </IonLabel>
                  {discountedUnit != null ? (
                    <IonLabel slot="end">
                      {formatPublicMoney(discountedUnit, pkg.currency, profile.currency)}
                    </IonLabel>
                  ) : null}
                </IonItem>
              );
            })}
          </IonList>

          <IonItem lines="none">
            <IonLabel>
              <h3>{copy.totalDue}</h3>
            </IonLabel>
            <IonLabel slot="end">
              <strong>
                {formatPublicMoney(confirmedTotal, pkg.currency, profile.currency)}
              </strong>
            </IonLabel>
          </IonItem>

          <IonButton
            expand="block"
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
  const scheduleEnd = scheduleStart
    ? new Date(new Date(scheduleStart).getTime() + totalDuration * 60_000).toISOString()
    : null;
  const submitLabel =
    amountDue > 0 && profile.onlinePaymentsEnabled && paymentMethod !== 'cash'
      ? copy.packagePayAndBook
      : copy.packageBook;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={buildPackageConfirmPath(slug, packageId)} />
          </IonButtons>
          <IonTitle>{copy.packageCheckoutTitle}</IonTitle>
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

        <p style={{ fontSize: 12, color: '#6b7280' }}>{copy.packageIncludedServices}</p>
        <p style={{ fontWeight: 600, marginBottom: 8 }}>{pkg.name}</p>

        <IonList>
          {expandedItems.map((item, index) => {
            const line = lines[index];
            const priced = pricedItems.find((entry) => entry.serviceId === item.serviceId);
            return (
              <IonItem key={`${item.serviceId}-${index}`}>
                <IonLabel>
                  <h3>{item.serviceName}</h3>
                  {line?.startTime ? (
                    <p style={{ fontSize: 12, color: '#6b7280' }}>
                      {formatDateDisplay(line.startTime, locale)} ·{' '}
                      {formatScheduleTime(line.startTime, locale)}
                    </p>
                  ) : null}
                </IonLabel>
                {priced ? (
                  <IonLabel slot="end">
                    {formatPublicMoney(
                      priced.discountedLineTotal / Math.max(priced.quantity, 1),
                      pkg.currency,
                      profile.currency,
                    )}
                  </IonLabel>
                ) : null}
              </IonItem>
            );
          })}
        </IonList>

        <ConsumerCheckoutContactForm value={guestContact} onChange={setGuestContact} />

        <ConsumerCheckoutDiscounts
          copy={copy}
          currency={quote?.currency ?? pkg.currency}
          tenantCurrency={profile!.currency}
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
            tenantCurrency={profile!.currency}
            copy={copy}
          />
        ) : null}

        {cashAvailable ? (
          <IonList>
            <IonItem
              button
              color={paymentMethod === 'online' ? 'primary' : undefined}
              onClick={() => setPaymentMethod('online')}
            >
              <IonLabel>{copy.giftCardPayOnline}</IonLabel>
            </IonItem>
            <IonItem
              button
              color={paymentMethod === 'cash' ? 'primary' : undefined}
              onClick={() => setPaymentMethod('cash')}
            >
              <IonLabel>{copy.giftCardPayCashShort}</IonLabel>
            </IonItem>
          </IonList>
        ) : null}

        {message ? <p style={{ color: '#b91c1c' }}>{message}</p> : null}

        {awaitingPaymentReturn ? (
          <IonButton
            expand="block"
            fill="outline"
            style={{ marginTop: 8 }}
            disabled={submitting}
            onClick={() => void confirmPendingPayment()}
          >
            {copy.packageConfirmPaymentReturn}
          </IonButton>
        ) : null}

        <IonButton
          expand="block"
          disabled={submitting || quoteLoading}
          style={{ marginTop: 16, '--background': primary }}
          onClick={() => void submitBooking()}
        >
          {submitting ? copy.packageCompletePayment : submitLabel}
        </IonButton>
      </IonContent>
    </IonPage>
  );
}
