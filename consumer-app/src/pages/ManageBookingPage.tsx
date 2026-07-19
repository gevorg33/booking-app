import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { formatDateDisplay, formatScheduleTime } from '../lib/date-format.js';
import {
  formatFriendlyNetworkError,
  getHttpErrorStatus,
} from '../lib/consumer-network-ux.util.js';
import type { PublicBookingManageContext, PublicCustomerBookingItem } from '../lib/types.js';
import { fetchBookingManageContext } from '../services/public-api.js';
import { ConsumerAiShell } from '../components/ConsumerAiShell.js';
import { ConsumerBookingActions } from '../components/ConsumerBookingActions.js';
import { ConsumerPackageVisitActions } from '../components/ConsumerPackageVisitActions.js';
import { ConsumerNetworkErrorCard } from '../components/ConsumerNetworkErrorCard.js';
import { ConsumerOfflineBanner } from '../components/ConsumerOfflineBanner.js';
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
  const { slug, profile, loading, error: tenantError, fromCache } = useTenantBootstrap();
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

  const loadContext = useCallback(async () => {
    if (!effectiveSlug || !bookingId || !token) {
      setError(copy.manageBookingInvalidLink);
      setLoadingContext(false);
      return;
    }
    setLoadingContext(true);
    setError(null);
    try {
      const ctx = await fetchBookingManageContext(effectiveSlug, bookingId, token);
      setContext(ctx);
    } catch (err: unknown) {
      setContext(null);
      // e2e-bug.3 — wrong/expired manage token is a 403; show the friendly link copy.
      const status = getHttpErrorStatus(err);
      if (status === 401 || status === 403 || status === 404) {
        setError(copy.manageBookingInvalidLink);
      } else {
        setError(formatFriendlyNetworkError(err, copy.networkLoadFailed));
      }
    } finally {
      setLoadingContext(false);
    }
  }, [bookingId, copy.manageBookingInvalidLink, copy.networkLoadFailed, effectiveSlug, token]);

  useEffect(() => {
    void loadContext();
  }, [loadContext]);

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

  if (tenantError || !profile) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref={buildSalonPath(effectiveSlug)}  text={copy.guidePageBack} />
            </IonButtons>
            <IonTitle>Manage</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <ConsumerOfflineBanner copy={copy} fromCache={fromCache} />
          <ConsumerNetworkErrorCard
            message={tenantError || copy.networkLoadFailed}
            retryLabel={copy.networkRetryAction}
            onRetry={() => window.location.reload()}
          />
        </IonContent>
      </IonPage>
    );
  }

  if (error || !context || !bookingItem) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref={buildSalonPath(effectiveSlug)}  text={copy.guidePageBack} />
            </IonButtons>
            <IonTitle>Manage</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <ConsumerOfflineBanner copy={copy} fromCache={fromCache} />
          <ConsumerNetworkErrorCard
            message={error ?? copy.manageBookingInvalidLink}
            retryLabel={copy.networkRetryAction}
            onRetry={() => void loadContext()}
          />
          <IonButton
            expand="block"
            fill="clear"
            className="ion-margin-top"
            onClick={() => history.push(buildSalonPath(effectiveSlug))}
          >
            Back to salon
          </IonButton>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <ConsumerAiShell slug={effectiveSlug} profile={profile} copy={copy} locale={locale}>
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={buildSalonPath(effectiveSlug)}  text={copy.guidePageBack} />
          </IonButtons>
          <IonTitle>{copy.manageBookingTitle}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <ConsumerOfflineBanner copy={copy} fromCache={fromCache} />
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
            onUpdated={() => void loadContext()}
            onRescheduled={(previous, next) => setRescheduleNotice({ previousStartTime: previous, newStartTime: next })}
          />
        ) : (
          <ConsumerBookingActions
            booking={bookingItem}
            slug={effectiveSlug}
            manageToken={token}
            authed={false}
            copy={copy}
            onUpdated={() => void loadContext()}
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
    </ConsumerAiShell>
  );
}
