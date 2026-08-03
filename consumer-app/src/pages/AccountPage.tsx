import {
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonToast,
} from '@ionic/react';
import { repeatOutline, shareOutline } from 'ionicons/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useHistory, useLocation } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PublicBusinessProfile, PublicCustomerBookingItem } from '../lib/types.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { buildConsumerGuidePath } from '../lib/consumer-guide.util.js';
import type { ConsumerCopy } from '../lib/copy.js';
import { formatCopy } from '../lib/copy.js';
import { formatDateDisplay, formatScheduleTime } from '../lib/date-format.js';
import { groupBookingsForAccount } from '../lib/group-package-bookings.js';
import {
  clearCustomerSession,
  getCustomerToken,
  getStoredCustomerProfile,
} from '../lib/customer-auth.js';
import { fetchMyBookings, fetchMySubscriptions, getPublicCustomerGiftCards } from '../services/public-api.js';
import { ConsumerActionButton } from '../components/ConsumerActionButton.js';
import { ConsumerGiftCardClaimSection } from '../components/ConsumerGiftCardClaimSection.js';
import { ConsumerGuideEntryRow } from '../components/ConsumerGuideEntryRow.js';
import { ConsumerGiftCardsOrdersSection } from '../components/ConsumerGiftCardsOrdersSection.js';
import { ConsumerGiftCardsRedeemedSection } from '../components/ConsumerGiftCardsRedeemedSection.js';
import type { PublicGiftCardOrder } from '../lib/gift-card.types.js';
import { ConsumerBookingActions } from '../components/ConsumerBookingActions.js';
import { ConsumerPatientAlertsBanner } from '../components/ConsumerPatientAlertsBanner.js';
import { shouldShowPatientResultsTab } from '../lib/clinic-service.js';
import type { ConsumerPatientAlertRoute } from '../lib/clinic-patient-alerts.js';
import { ConsumerPackageVisitActions } from '../components/ConsumerPackageVisitActions.js';
import { ConsumerMultiServiceVisitActions } from '../components/ConsumerMultiServiceVisitActions.js';
import { RescheduleConfirmationCard } from '../components/RescheduleConfirmationCard.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import { ConsumerTenantSwitcher } from '../components/ConsumerTenantSwitcher.js';
import { ConsumerRewardsCard } from '../components/ConsumerRewardsCard.js';
import { ConsumerNotificationPreferencesCard } from '../components/ConsumerNotificationPreferencesCard.js';
import { ConsumerAccountGrowthCard } from '../components/ConsumerAccountGrowthCard.js';
import { ConsumerSubscriptionsSection } from '../components/ConsumerSubscriptionsSection.js';
import { ConsumerPrivacyDataSection } from '../components/ConsumerPrivacyDataSection.js';
import { ConsumerWaitlistSection } from '../components/ConsumerWaitlistSection.js';
import { ConsumerTabPageShell } from '../components/ConsumerTabPageShell.js';
import { PostVisitReviewPrompt } from '../components/PostVisitReviewPrompt.js';
import { shareBookingLinkWithReward, formatShareRewardToast } from '../lib/consumer-share-flow.util.js';
import { claimShareReward } from '../services/public-api.js';
import { resolvePostVisitReviewCandidate } from '../lib/store-review-prompt.util.js';
import { buildRebookBookServicePath } from '../lib/consumer-rebook.util.js';
import { canRebookBooking } from '../lib/home-screen-widget.util.js';
import { trackRebookTap } from '../lib/consumer-growth-loops.util.js';
import { useHomeScreenWidgetSync } from '../hooks/use-home-screen-widget-sync.js';
import { enableConsumerNativePush } from '../services/native-push.js';
import { openNotificationSettings } from '../lib/push-reachability.util.js';

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

/** Exported for e2e-bug.253 light-DOM CTA unit coverage. */
export function BookingCard({
  booking,
  slug,
  businessName,
  locale,
  copy,
  authed,
  onUpdated,
  onRescheduled,
  onReview,
  onRebook,
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
  onRebook?: (booking: PublicCustomerBookingItem) => void;
}) {
  const [presentToast] = useIonToast();
  const [sharing, setSharing] = useState(false);
  const canShare = booking.status === 'confirmed' || booking.status === 'completed';

  const onShareBooking = async () => {
    setSharing(true);
    try {
      const { status, reward } = await shareBookingLinkWithReward({
        slug,
        businessName,
        booking,
        claimReward: () =>
          claimShareReward(slug, 'booking', booking.id),
      });
      const rewardMessage = formatShareRewardToast(reward, copy.growthShareRewardEarned);
      if (rewardMessage) {
        await presentToast({ message: rewardMessage, duration: 3000 });
      } else if (status === 'copied') {
        await presentToast({ message: copy.growthShareCopied, duration: 2000 });
      } else if (status === 'unavailable') {
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
        <ConsumerActionButton
          expand="block"
          fill="outline"
          size="small"
          style={{ marginTop: 8 }}
          onClick={() => onReview(booking)}
        >
          {copy.postBookingTenantReviewAction}
        </ConsumerActionButton>
      ) : null}
      {canRebookBooking(booking) && onRebook ? (
        <ConsumerActionButton
          expand="block"
          fill="outline"
          size="small"
          style={{ marginTop: 8 }}
          onClick={() => onRebook(booking)}
        >
          <IonIcon icon={repeatOutline} aria-hidden="true" />
          {copy.growthRebookAction}
        </ConsumerActionButton>
      ) : null}
      {canShare ? (
        <ConsumerActionButton
          expand="block"
          fill="clear"
          size="small"
          style={{ marginTop: 4 }}
          disabled={sharing}
          onClick={() => void onShareBooking()}
        >
          <IonIcon icon={shareOutline} aria-hidden="true" />
          {copy.growthShareBookingAction}
        </ConsumerActionButton>
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
  embedded = false,
}: {
  slug: string;
  profile: PublicBusinessProfile;
  embedded?: boolean;
}) {
  const history = useHistory();
  const location = useLocation();
  const subscriptionsSectionRef = useRef<HTMLHeadingElement>(null);
  const giftCardsSectionRef = useRef<HTMLHeadingElement>(null);
  const bookingsSectionRef = useRef<HTMLHeadingElement>(null);
  const privacySectionRef = useRef<HTMLDivElement>(null);
  const growthSectionRef = useRef<HTMLDivElement>(null);
  const giftCardClaimSectionRef = useRef<HTMLElement>(null);
  const queryClient = useQueryClient();
  const searchParams = new URLSearchParams(location.search);
  const accountTab = searchParams.get('tab');
  const accountSection = searchParams.get('section');
  const giftCardCodeFromQuery = searchParams.get('giftCardCode') ?? undefined;
  const privacyActionFromQuery = searchParams.get('privacyAction');
  const privacyAutoAction =
    privacyActionFromQuery === 'export' || privacyActionFromQuery === 'delete'
      ? privacyActionFromQuery
      : undefined;
  const reviewBookingIdFromQuery = searchParams.get('reviewBookingId');
  const supportBookingIdFromQuery = searchParams.get('supportBookingId');
  const subscriptionIdFromQuery = searchParams.get('subscriptionId');
  const enablePushFromQuery = searchParams.get('enablePush');
  const openPushSettingsFromQuery = searchParams.get('openPushSettings');
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

  const [supportPromptBooking, setSupportPromptBooking] =
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

  useEffect(() => {
    if (accountTab !== 'giftCards' || !authed) return;
    giftCardsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [accountTab, authed]);

  // e2e-bug.52 — assistant my_appointments / list bookings navigate here
  useEffect(() => {
    const wantsBookings =
      accountTab === 'bookings' || accountSection === 'bookings';
    if (!wantsBookings || !authed || bookingsQuery.isLoading) return;
    bookingsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [accountTab, accountSection, authed, bookingsQuery.isLoading]);

  useEffect(() => {
    if (accountSection !== 'privacy' || !authed) return;
    privacySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [accountSection, authed]);

  useEffect(() => {
    if (accountSection !== 'growth' || !authed) return;
    growthSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [accountSection, authed]);

  useEffect(() => {
    if (accountSection !== 'gift-card-claim' || !authed) return;
    giftCardClaimSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [accountSection, authed]);

  useEffect(() => {
    if (!authed || enablePushFromQuery !== '1') return;
    void enableConsumerNativePush(slug);
    const next = new URLSearchParams(location.search);
    next.delete('enablePush');
    const qs = next.toString();
    history.replace(buildSalonPath(slug, `/account${qs ? `?${qs}` : ''}`));
  }, [authed, enablePushFromQuery, history, location.search, slug]);

  useEffect(() => {
    if (!authed || openPushSettingsFromQuery !== '1') return;
    void openNotificationSettings();
    const next = new URLSearchParams(location.search);
    next.delete('openPushSettings');
    const qs = next.toString();
    history.replace(buildSalonPath(slug, `/account${qs ? `?${qs}` : ''}`));
  }, [authed, history, location.search, openPushSettingsFromQuery, slug]);

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
    if (!authed || bookingsQuery.isLoading || supportPromptBooking) return;
    if (supportBookingIdFromQuery) {
      const booking = (bookingsQuery.data ?? []).find(
        (row) => row.id === supportBookingIdFromQuery,
      );
      if (booking) {
        setSupportPromptBooking(booking);
      }
    }
  }, [
    authed,
    bookingsQuery.data,
    bookingsQuery.isLoading,
    supportBookingIdFromQuery,
    supportPromptBooking,
  ]);

  useEffect(() => {
    if (!authed || bookingsQuery.isLoading || reviewPromptBooking) return;
    if (reviewBookingIdFromQuery) {
      const booking = (bookingsQuery.data ?? []).find(
        (row) => row.id === reviewBookingIdFromQuery,
      );
      if (booking && booking.canReview !== false) {
        setReviewPromptBooking(booking);
        return;
      }
    }
    const candidate = resolvePostVisitReviewCandidate(bookingsQuery.data ?? []);
    if (candidate) {
      setReviewPromptBooking(candidate);
    }
  }, [
    authed,
    bookingsQuery.data,
    bookingsQuery.isLoading,
    reviewPromptBooking,
    reviewBookingIdFromQuery,
  ]);

  const openReviewPrompt = useCallback((booking: PublicCustomerBookingItem) => {
    setReviewPromptBooking(booking);
  }, []);

  const onRebookBooking = useCallback(
    (booking: PublicCustomerBookingItem) => {
      trackRebookTap(booking.id, slug, 'account');
      history.push(buildRebookBookServicePath(slug, booking, { source: 'account' }));
    },
    [history, slug],
  );

  useHomeScreenWidgetSync({
    slug,
    profile,
    authed,
    bookings: bookingsQuery.data,
    copy,
    locale,
  });

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
    <ConsumerTabPageShell embedded={embedded}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{copy.tabAccount}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <ConsumerGuideEntryRow
          copy={copy}
          primaryColor={profile.branding.primaryColor || undefined}
          onOpen={() => history.push(buildConsumerGuidePath(slug))}
        />
        {!authed ? (
          <>
            <p>Sign in to see appointments and subscriptions at {profile.name}.</p>
            <ConsumerActionButton
              expand="block"
              color={profile.branding.primaryColor || '#7c3aed'}
              onClick={() => history.push(buildSalonPath(slug, '/login'))}
            >
              {copy.signInWithGoogle}
            </ConsumerActionButton>
            <ConsumerTenantSwitcher currentSlug={slug} trigger="button" copy={copy} />
          </>
        ) : (
          <>
            <div className="salon-card">
              <h2 style={{ fontWeight: 600 }}>{customer?.name ?? 'Customer'}</h2>
              {customer?.email ? <p>{customer.email}</p> : null}
              {customer?.phone ? <p>{customer.phone}</p> : null}
            </div>
            <ConsumerActionButton expand="block" fill="outline" color="medium" onClick={signOut}>
              Sign out
            </ConsumerActionButton>
            <ConsumerTenantSwitcher currentSlug={slug} trigger="button" copy={copy} />

            <ConsumerActionButton
              expand="block"
              fill="outline"
              className="ion-margin-top"
              onClick={() => history.push(buildSalonPath(slug, '/profile'))}
            >
              {copy.profileViewDetails}
            </ConsumerActionButton>

            <div ref={privacySectionRef}>
              <ConsumerPrivacyDataSection
                slug={slug}
                businessName={profile.name}
                copy={copy}
                autoAction={privacyAutoAction}
                onDeleted={() => {
                  clearCustomerSession(slug);
                  history.replace(buildSalonPath(slug, '/account'));
                  window.location.reload();
                }}
              />
            </div>

            <ConsumerRewardsCard
              slug={slug}
              profile={profile}
              copy={copy}
              authed
              onBook={() => history.push(buildSalonPath(slug, '/services'))}
            />

            <ConsumerNotificationPreferencesCard slug={slug} copy={copy} authed />

            <ConsumerWaitlistSection slug={slug} copy={copy} authed />

            <ConsumerAccountGrowthCard
              slug={slug}
              profile={profile}
              copy={copy}
              bookings={bookingsQuery.data ?? []}
              loading={bookingsQuery.isLoading}
              sectionRef={growthSectionRef}
            />

            <ConsumerGiftCardClaimSection
              slug={slug}
              copy={copy}
              initialCode={giftCardCodeFromQuery}
              sectionRef={giftCardClaimSectionRef}
              onClaimed={() => void queryClient.invalidateQueries({ queryKey: ['gift-cards-account', slug] })}
            />

            <h2
              id="my-gift-cards"
              ref={giftCardsSectionRef}
              style={{ fontSize: '1.1rem', marginTop: 24 }}
            >
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
              <ConsumerActionButton
                expand="block"
                fill="outline"
                className="ion-margin-top"
                onClick={() => history.push(buildSalonPath(slug, '/gift-cards'))}
              >
                {copy.giftCardBuyGiftCard}
              </ConsumerActionButton>
            ) : null}

            {showClinicAlerts ? (
              <>
                <div id="my-intake" />
                <ConsumerPatientAlertsBanner
                  slug={slug}
                  copy={copy}
                  businessType={profile.businessType}
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

            <h2
              id="my-bookings"
              ref={bookingsSectionRef}
              style={{ fontSize: '1.1rem', marginTop: 24 }}
            >
              My appointments
            </h2>
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
                {grouped.multiServiceGroups.map((visit) => {
                  const start = visit.appointments[0]?.startTime;
                  const end = visit.appointments[visit.appointments.length - 1]?.endTime;
                  return (
                    <div key={visit.multiServiceGroupId} className="salon-card">
                      <h2 style={{ fontWeight: 600 }}>{visit.label}</h2>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {formatCopy(copy.multiServiceVisitAppointmentCount, {
                          count: visit.appointments.length,
                        })}
                      </p>
                      {start && end && (
                        <p style={{ fontSize: '0.875rem', marginTop: 8 }}>
                          {formatDateDisplay(start, locale)} · {formatScheduleTime(start)} –{' '}
                          {formatScheduleTime(end)}
                        </p>
                      )}
                      <ConsumerMultiServiceVisitActions
                        slug={slug}
                        tenant={profile}
                        anchorBookingId={visit.anchorBookingId}
                        visit={visit}
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
                    onRebook={onRebookBooking}
                  />
                ))}
                {grouped.standalone.length === 0 &&
                  grouped.packageGroups.length === 0 &&
                  grouped.multiServiceGroups.length === 0 && (
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
                onCancelled={() => void subsQuery.refetch()}
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
        {supportPromptBooking ? (
          <PostVisitReviewPrompt
            isOpen={Boolean(supportPromptBooking)}
            slug={slug}
            booking={supportPromptBooking}
            copy={copy}
            customerToken={token}
            customerEmail={customer?.email}
            zendeskWidgetConfigured={Boolean(profile.support?.zendeskWidgetKey)}
            openSupportImmediately
            onClose={() => setSupportPromptBooking(null)}
          />
        ) : null}
      </IonContent>
    </ConsumerTabPageShell>
  );
}
