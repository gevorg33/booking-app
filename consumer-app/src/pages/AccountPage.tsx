import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonToast,
} from '@ionic/react';
import { shareOutline } from 'ionicons/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useHistory, useLocation } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PublicBusinessProfile, PublicCustomerBookingItem } from '../lib/types.js';
import { buildSalonPath } from '../lib/deep-link.js';
import type { ConsumerCopy } from '../lib/copy.js';
import { formatDateDisplay, formatScheduleTime } from '../lib/date-format.js';
import { groupBookingsForAccount } from '../lib/group-package-bookings.js';
import {
  clearCustomerSession,
  getCustomerToken,
  getStoredCustomerProfile,
} from '../lib/customer-auth.js';
import { fetchMyBookings, fetchMySubscriptions, getPublicCustomerGiftCards } from '../services/public-api.js';
import { ConsumerGiftCardClaimSection } from '../components/ConsumerGiftCardClaimSection.js';
import { ConsumerGiftCardsOrdersSection } from '../components/ConsumerGiftCardsOrdersSection.js';
import { ConsumerGiftCardsRedeemedSection } from '../components/ConsumerGiftCardsRedeemedSection.js';
import type { PublicGiftCardOrder } from '../lib/gift-card.types.js';
import { ConsumerBookingActions } from '../components/ConsumerBookingActions.js';
import { ConsumerPatientAlertsBanner } from '../components/ConsumerPatientAlertsBanner.js';
import { shouldShowPatientResultsTab } from '../lib/clinic-service.js';
import type { ConsumerPatientAlertRoute } from '../lib/clinic-patient-alerts.js';
import { ConsumerPackageVisitActions } from '../components/ConsumerPackageVisitActions.js';
import { RescheduleConfirmationCard } from '../components/RescheduleConfirmationCard.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import { ConsumerTenantSwitcher } from '../components/ConsumerTenantSwitcher.js';
import { ConsumerRewardsCard } from '../components/ConsumerRewardsCard.js';
import { ConsumerNotificationPreferencesCard } from '../components/ConsumerNotificationPreferencesCard.js';
import { ConsumerAccountGrowthCard } from '../components/ConsumerAccountGrowthCard.js';
import { ConsumerSubscriptionsSection } from '../components/ConsumerSubscriptionsSection.js';
import { ConsumerPrivacyDataSection } from '../components/ConsumerPrivacyDataSection.js';
import { PostVisitReviewPrompt } from '../components/PostVisitReviewPrompt.js';
import { shareBookingLink } from '../lib/consumer-growth-loops.util.js';
import { resolvePostVisitReviewCandidate } from '../lib/store-review-prompt.util.js';

function statusLabel(status: string, copy: ConsumerCopy): string {
  switch (status) {
    case 'completed':
      return copy.bookingStatusCompleted;
    case 'cancelled':
      return copy.bookingStatusCancelled;
    case 'confirmed':
      return copy.bookingStatusConfirmed;
    default:
      return status;
  }
}

function BookingCard({
  booking,
  slug,
  businessName,
  locale,
  copy,
  authed,
  onUpdated,
  onRescheduled,
  onReview,
}: {
  booking: PublicCustomerBookingItem;
  slug: string;
  businessName: string;
  locale: string;
  copy: ConsumerCopy;
  authed: boolean;
  onUpdated: () => void;
  onRescheduled: (previous: string, next: string) => void;
  onReview?: (booking: PublicCustomerBookingItem) => void;
}) {
  const [presentToast] = useIonToast();
  const [sharing, setSharing] = useState(false);
  const canShare = booking.status === 'confirmed' || booking.status === 'completed';

  const onShareBooking = async () => {
    setSharing(true);
    try {
      const result = await shareBookingLink({
        slug,
        businessName,
        booking,
      });
      if (result === 'copied') {
        await presentToast({ message: copy.growthShareCopied, duration: 2000 });
      } else if (result === 'unavailable') {
        await presentToast({ message: copy.growthShareUnavailable, duration: 2500 });
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="salon-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <h2 style={{ fontWeight: 600 }}>{booking.serviceName}</h2>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{booking.employeeName}</p>
          <p style={{ fontSize: '0.875rem', marginTop: 8 }}>
            {formatDateDisplay(booking.startTime, locale)} ·{' '}
            {formatScheduleTime(booking.startTime)} – {formatScheduleTime(booking.endTime)}
          </p>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{statusLabel(booking.status, copy)}</span>
      </div>
      {booking.canReview && onReview ? (
        <IonButton
          expand="block"
          fill="outline"
          size="small"
          style={{ marginTop: 8 }}
          onClick={() => onReview(booking)}
        >
          {copy.postBookingTenantReviewAction}
        </IonButton>
      ) : null}
      {canShare ? (
        <IonButton
          expand="block"
          fill="clear"
          size="small"
          style={{ marginTop: 4 }}
          disabled={sharing}
          onClick={() => void onShareBooking()}
        >
          <IonIcon slot="start" icon={shareOutline} />
          {copy.growthShareBookingAction}
        </IonButton>
      ) : null}
      <ConsumerBookingActions
        booking={booking}
        slug={slug}
        authed={authed}
        copy={copy}
        onUpdated={onUpdated}
        onRescheduled={onRescheduled}
      />
    </div>
  );
}

export default function AccountPage({
  slug,
  profile,
}: {
  slug: string;
  profile: PublicBusinessProfile;
}) {
  const history = useHistory();
  const location = useLocation();
  const subscriptionsSectionRef = useRef<HTMLHeadingElement>(null);
  const queryClient = useQueryClient();
  const accountTab = new URLSearchParams(location.search).get('tab');
  const subscriptionIdFromQuery = new URLSearchParams(location.search).get('subscriptionId');
  const token = getCustomerToken(slug);
  const customer = getStoredCustomerProfile(slug);
  const authed = !!token;
  const { locale, copy } = useConsumerCopy(slug, profile);

  const [rescheduleNotice, setRescheduleNotice] = useState<{
    previousStartTime: string;
    newStartTime: string;
  } | null>(null);

  const [reviewPromptBooking, setReviewPromptBooking] =
    useState<PublicCustomerBookingItem | null>(null);

  const bookingsQuery = useQuery({
    queryKey: ['bookings', slug],
    queryFn: () => fetchMyBookings(slug),
    enabled: authed,
  });

  const subsQuery = useQuery({
    queryKey: ['subscriptions', slug],
    queryFn: () => fetchMySubscriptions(slug),
    enabled: authed,
  });

  useEffect(() => {
    if (accountTab !== 'subscriptions' || !subsQuery.isSuccess) return;
    subscriptionsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [accountTab, subsQuery.isSuccess]);

  const giftCardsQuery = useQuery({
    queryKey: ['gift-cards-account', slug],
    queryFn: () => getPublicCustomerGiftCards(slug),
    enabled: authed,
  });

  const updateGiftCardOrder = (order: PublicGiftCardOrder) => {
    queryClient.setQueryData(
      ['gift-cards-account', slug],
      (prev: { orders: PublicGiftCardOrder[]; redeemed: unknown[] } | undefined) =>
        prev
          ? { ...prev, orders: prev.orders.map((row) => (row.id === order.id ? order : row)) }
          : prev,
    );
  };

  const reloadBookings = () => {
    void queryClient.invalidateQueries({ queryKey: ['bookings', slug] });
  };

  useEffect(() => {
    if (!authed || bookingsQuery.isLoading || reviewPromptBooking) return;
    const candidate = resolvePostVisitReviewCandidate(bookingsQuery.data ?? []);
    if (candidate) {
      setReviewPromptBooking(candidate);
    }
  }, [authed, bookingsQuery.data, bookingsQuery.isLoading, reviewPromptBooking]);

  const openReviewPrompt = useCallback((booking: PublicCustomerBookingItem) => {
    setReviewPromptBooking(booking);
  }, []);

  const signOut = () => {
    clearCustomerSession(slug);
    history.replace(buildSalonPath(slug, '/account'));
    window.location.reload();
  };

  const grouped = groupBookingsForAccount(bookingsQuery.data ?? []);
  const showClinicAlerts = shouldShowPatientResultsTab(profile.businessType);

  const navigateToAlertSection = (route: ConsumerPatientAlertRoute, anchorId: string) => {
    const path = buildSalonPath(slug, route);
    if (window.location.pathname !== path) {
      history.push(path);
    }
    window.setTimeout(() => {
      document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Account</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {!authed ? (
          <>
            <p>Sign in to see appointments and subscriptions at {profile.name}.</p>
            <IonButton expand="block" onClick={() => history.push(buildSalonPath(slug, '/login'))}>
              Sign in with Google
            </IonButton>
            <ConsumerTenantSwitcher currentSlug={slug} trigger="button" />
          </>
        ) : (
          <>
            <div className="salon-card">
              <h2 style={{ fontWeight: 600 }}>{customer?.name ?? 'Customer'}</h2>
              {customer?.email ? <p>{customer.email}</p> : null}
              {customer?.phone ? <p>{customer.phone}</p> : null}
            </div>
            <IonButton expand="block" fill="outline" color="medium" onClick={signOut}>
              Sign out
            </IonButton>
            <ConsumerTenantSwitcher currentSlug={slug} trigger="button" />

            <ConsumerPrivacyDataSection
              slug={slug}
              businessName={profile.name}
              copy={copy}
              onDeleted={() => {
                clearCustomerSession(slug);
                history.replace(buildSalonPath(slug, '/account'));
                window.location.reload();
              }}
            />

            <ConsumerRewardsCard
              slug={slug}
              profile={profile}
              copy={copy}
              authed
              onBook={() => history.push(buildSalonPath(slug, '/services'))}
            />

            <ConsumerNotificationPreferencesCard slug={slug} copy={copy} authed />

            <ConsumerAccountGrowthCard
              slug={slug}
              profile={profile}
              copy={copy}
              bookings={bookingsQuery.data ?? []}
              loading={bookingsQuery.isLoading}
            />

            <ConsumerGiftCardClaimSection
              slug={slug}
              copy={copy}
              onClaimed={() => void queryClient.invalidateQueries({ queryKey: ['gift-cards-account', slug] })}
            />

            <h2 id="my-gift-cards" style={{ fontSize: '1.1rem', marginTop: 24 }}>
              {copy.giftCardMyGiftCards}
            </h2>
            <h3 style={{ fontSize: '0.95rem', marginTop: 12, color: '#374151' }}>{copy.giftCardMyOrdered}</h3>
            {giftCardsQuery.isLoading ? (
              <IonSpinner />
            ) : (
              <ConsumerGiftCardsOrdersSection
                slug={slug}
                copy={copy}
                locale={locale}
                tenantCurrency={profile.currency}
                orders={giftCardsQuery.data?.orders ?? []}
                onOrderUpdated={updateGiftCardOrder}
              />
            )}
            <h3 style={{ fontSize: '0.95rem', marginTop: 16, color: '#374151' }}>{copy.giftCardMyRedeemed}</h3>
            {giftCardsQuery.isLoading ? (
              <IonSpinner />
            ) : (
              <ConsumerGiftCardsRedeemedSection
                slug={slug}
                copy={copy}
                locale={locale}
                tenantCurrency={profile.currency}
                redeemed={giftCardsQuery.data?.redeemed ?? []}
              />
            )}

            {profile.giftCardsPurchaseEnabled ? (
              <IonButton
                expand="block"
                fill="outline"
                className="ion-margin-top"
                onClick={() => history.push(buildSalonPath(slug, '/gift-cards'))}
              >
                {copy.giftCardBuyGiftCard}
              </IonButton>
            ) : null}

            {showClinicAlerts ? (
              <>
                <div id="my-intake" />
                <ConsumerPatientAlertsBanner
                  slug={slug}
                  copy={copy}
                  onNavigate={navigateToAlertSection}
                />
              </>
            ) : null}

            {rescheduleNotice && (
              <RescheduleConfirmationCard
                previousStartTime={rescheduleNotice.previousStartTime}
                newStartTime={rescheduleNotice.newStartTime}
                locale={locale}
              />
            )}

            <h2 id="my-bookings" style={{ fontSize: '1.1rem', marginTop: 24 }}>My appointments</h2>
            {bookingsQuery.isLoading ? (
              <IonSpinner />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {grouped.packageGroups.map((visit) => {
                  const start = visit.appointments[0]?.startTime;
                  const end = visit.appointments[visit.appointments.length - 1]?.endTime;
                  return (
                    <div key={visit.packagePurchaseId} className="salon-card">
                      <h2 style={{ fontWeight: 600 }}>{visit.packageName}</h2>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {visit.appointments.length} appointments
                      </p>
                      {start && end && (
                        <p style={{ fontSize: '0.875rem', marginTop: 8 }}>
                          {formatDateDisplay(start, locale)} · {formatScheduleTime(start)} –{' '}
                          {formatScheduleTime(end)}
                        </p>
                      )}
                      <ConsumerPackageVisitActions
                        slug={slug}
                        tenant={profile}
                        anchorBookingId={visit.anchorBookingId}
                        packageVisit={visit}
                        authed={authed}
                        copy={copy}
                        onUpdated={reloadBookings}
                        onRescheduled={(previous, next) =>
                          setRescheduleNotice({ previousStartTime: previous, newStartTime: next })
                        }
                      />
                    </div>
                  );
                })}
                {grouped.standalone.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    slug={slug}
                    businessName={profile.name}
                    locale={locale}
                    copy={copy}
                    authed={authed}
                    onUpdated={reloadBookings}
                    onRescheduled={(previous, next) =>
                      setRescheduleNotice({ previousStartTime: previous, newStartTime: next })
                    }
                    onReview={openReviewPrompt}
                  />
                ))}
                {grouped.standalone.length === 0 && grouped.packageGroups.length === 0 && (
                  <p>No bookings yet.</p>
                )}
              </div>
            )}

            <h2
              ref={subscriptionsSectionRef}
              id="account-subscriptions"
              style={{ fontSize: '1.1rem', marginTop: 24 }}
            >
              {copy.subscriptionsTitle}
            </h2>
            {subsQuery.isLoading ? (
              <IonSpinner />
            ) : (
              <ConsumerSubscriptionsSection
                slug={slug}
                subscriptions={subsQuery.data ?? []}
                primary={profile.branding.primaryColor || '#7c3aed'}
                copy={copy}
                locale={locale}
                initialExpandedSubscriptionId={subscriptionIdFromQuery}
              />
            )}
          </>
        )}
        {reviewPromptBooking ? (
          <PostVisitReviewPrompt
            isOpen={Boolean(reviewPromptBooking)}
            slug={slug}
            booking={reviewPromptBooking}
            copy={copy}
            customerToken={token}
            customerEmail={customer?.email}
            zendeskWidgetConfigured={Boolean(profile.support?.zendeskWidgetKey)}
            onClose={() => setReviewPromptBooking(null)}
            onReviewSubmitted={reloadBookings}
          />
        ) : null}
      </IonContent>
    </IonPage>
  );
}
