import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useHistory } from 'react-router-dom';
import { useState } from 'react';
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
import { fetchMyBookings, fetchMySubscriptions } from '../services/public-api.js';
import { ConsumerBookingActions } from '../components/ConsumerBookingActions.js';
import { ConsumerPatientAlertsBanner } from '../components/ConsumerPatientAlertsBanner.js';
import { shouldShowPatientResultsTab } from '../lib/clinic-service.js';
import type { ConsumerPatientAlertRoute } from '../lib/clinic-patient-alerts.js';
import { ConsumerPackageVisitActions } from '../components/ConsumerPackageVisitActions.js';
import { RescheduleConfirmationCard } from '../components/RescheduleConfirmationCard.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';

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
  locale,
  copy,
  authed,
  onUpdated,
  onRescheduled,
}: {
  booking: PublicCustomerBookingItem;
  slug: string;
  locale: string;
  copy: ConsumerCopy;
  authed: boolean;
  onUpdated: () => void;
  onRescheduled: (previous: string, next: string) => void;
}) {
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
  const queryClient = useQueryClient();
  const token = getCustomerToken(slug);
  const customer = getStoredCustomerProfile(slug);
  const authed = !!token;
  const { locale, copy } = useConsumerCopy(slug, profile);

  const [rescheduleNotice, setRescheduleNotice] = useState<{
    previousStartTime: string;
    newStartTime: string;
  } | null>(null);

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

  const reloadBookings = () => {
    void queryClient.invalidateQueries({ queryKey: ['bookings', slug] });
  };

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
                    locale={locale}
                    copy={copy}
                    authed={authed}
                    onUpdated={reloadBookings}
                    onRescheduled={(previous, next) =>
                      setRescheduleNotice({ previousStartTime: previous, newStartTime: next })
                    }
                  />
                ))}
                {grouped.standalone.length === 0 && grouped.packageGroups.length === 0 && (
                  <p>No bookings yet.</p>
                )}
              </div>
            )}

            <h2 style={{ fontSize: '1.1rem', marginTop: 24 }}>Subscriptions</h2>
            {subsQuery.isLoading ? (
              <IonSpinner />
            ) : (
              <>
                {(subsQuery.data ?? []).map((s) => (
                  <div key={s.id} className="salon-card">
                    <h2 style={{ fontWeight: 600 }}>{s.planName}</h2>
                    <p>
                      {s.status} · {s.appointmentsRemaining} visits left
                    </p>
                    <p>Expires {formatDateDisplay(new Date(s.expiresAt))}</p>
                  </div>
                ))}
                {(subsQuery.data ?? []).length === 0 && <p>No active subscriptions.</p>}
              </>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
}
