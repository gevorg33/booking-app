import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { formatDateDisplay, formatScheduleTime } from '../lib/date-format.js';
import type { PublicBookingManageContext, PublicCustomerBookingItem } from '../lib/types.js';
import { fetchBookingManageContext } from '../services/public-api.js';
import { ConsumerBookingActions } from '../components/ConsumerBookingActions.js';
import { ConsumerPackageVisitActions } from '../components/ConsumerPackageVisitActions.js';
import { RescheduleConfirmationCard } from '../components/RescheduleConfirmationCard.js';

function parseQuery(search: string) {
  const params = new URLSearchParams(search);
  return {
    bookingId: params.get('bookingId') ?? '',
    token: params.get('token') ?? '',
  };
}

export default function ManageBookingPage() {
  const history = useHistory();
  const location = useLocation();
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const { slug, profile, loading, error: tenantError } = useTenantBootstrap();
  const { bookingId, token } = useMemo(() => parseQuery(location.search), [location.search]);

  const [context, setContext] = useState<PublicBookingManageContext | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleNotice, setRescheduleNotice] = useState<{
    previousStartTime: string;
    newStartTime: string;
  } | null>(null);

  const effectiveSlug = slug || routeSlug || '';
  const { copy, locale } = useConsumerCopy(effectiveSlug, profile ?? { locale: 'en' });

  useEffect(() => {
    if (!effectiveSlug || !bookingId || !token) {
      setError(copy.manageBookingInvalidLink);
      setLoadingContext(false);
      return;
    }
    let cancelled = false;
    setLoadingContext(true);
    void fetchBookingManageContext(effectiveSlug, bookingId, token)
      .then((ctx) => {
        if (!cancelled) setContext(ctx);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : copy.manageBookingInvalidLink);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingContext(false);
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveSlug, bookingId, token, copy.manageBookingInvalidLink]);

  const reload = async () => {
    if (!effectiveSlug || !bookingId || !token) return;
    const ctx = await fetchBookingManageContext(effectiveSlug, bookingId, token);
    setContext(ctx);
  };

  const bookingItem: PublicCustomerBookingItem | null = context
    ? {
        id: context.bookingId,
        startTime: context.startTime,
        endTime: context.endTime,
        status: context.status,
        paymentStatus: context.paymentStatus,
        serviceName: context.serviceName,
        employeeName: context.employeeName,
        employeeId: context.employeeId,
        serviceId: context.serviceId,
        canCancel: context.canCancel,
        canReschedule: context.canReschedule,
        policyMessage: context.policyMessage,
        rescheduleCount: context.rescheduleCount,
        maxReschedules: context.maxReschedules,
        allowProviderChangeOnReschedule: context.allowProviderChangeOnReschedule,
      }
    : null;

  if (loading || loadingContext) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner style={{ marginTop: '40vh' }} />
        </IonContent>
      </IonPage>
    );
  }

  if (tenantError || !profile || error || !context || !bookingItem) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref={buildSalonPath(effectiveSlug)} />
            </IonButtons>
            <IonTitle>Manage</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>{error ?? tenantError ?? copy.manageBookingInvalidLink}</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={buildSalonPath(effectiveSlug)} />
          </IonButtons>
          <IonTitle>{copy.manageBookingTitle}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="salon-card">
          {context.packageVisit ? (
            <>
              <h2 style={{ fontWeight: 600 }}>{context.packageVisit.packageName}</h2>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {context.packageVisit.appointments.length} appointments
              </p>
            </>
          ) : (
            <>
              <h2 style={{ fontWeight: 600 }}>{bookingItem.serviceName}</h2>
              <p style={{ color: '#6b7280' }}>{bookingItem.employeeName}</p>
              <p style={{ marginTop: 8 }}>
                {formatDateDisplay(bookingItem.startTime, locale)} ·{' '}
                {formatScheduleTime(bookingItem.startTime)} –{' '}
                {formatScheduleTime(bookingItem.endTime)}
              </p>
            </>
          )}
        </div>

        {rescheduleNotice && (
          <RescheduleConfirmationCard
            previousStartTime={rescheduleNotice.previousStartTime}
            newStartTime={rescheduleNotice.newStartTime}
            locale={locale}
          />
        )}

        {context.packageVisit ? (
          <ConsumerPackageVisitActions
            slug={effectiveSlug}
            tenant={profile}
            anchorBookingId={context.bookingId}
            packageVisit={context.packageVisit}
            manageToken={token}
            authed={false}
            copy={copy}
            onUpdated={() => void reload()}
            onRescheduled={(previous, next) => setRescheduleNotice({ previousStartTime: previous, newStartTime: next })}
          />
        ) : (
          <ConsumerBookingActions
            booking={bookingItem}
            slug={effectiveSlug}
            manageToken={token}
            authed={false}
            copy={copy}
            onUpdated={() => void reload()}
            onRescheduled={(previous, next) => setRescheduleNotice({ previousStartTime: previous, newStartTime: next })}
          />
        )}

        <IonButton
          expand="block"
          fill="clear"
          className="ion-margin-top"
          onClick={() => history.push(buildSalonPath(effectiveSlug, '/account'))}
        >
          My appointments (sign in)
        </IonButton>
      </IonContent>
    </IonPage>
  );
}
