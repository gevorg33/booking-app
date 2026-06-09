import { useEffect } from 'react';
import {
  IonBadge,
  IonIcon,
  IonLabel,
  IonTabBar,
  IonTabButton,
} from '@ionic/react';
import {
  beakerOutline,
  calendarOutline,
  flaskOutline,
  homeOutline,
  personOutline,
} from 'ionicons/icons';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { PublicBusinessProfile } from '../lib/types.js';
import { shouldShowPatientResultsTab } from '../lib/clinic-service.js';
import { getCustomerToken } from '../lib/customer-auth.js';
import { fetchMyClinicLabBookingRequests, fetchMyBookings } from '../services/public-api.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import { useConsumerLocale } from '../hooks/use-consumer-locale.js';
import { useHomeScreenWidgetSync } from '../hooks/use-home-screen-widget-sync.js';
import { buildSalonTabHomePath } from '../lib/salon-tab-route.util.js';
import { ConsumerAiShell } from './ConsumerAiShell.js';
import { ConsumerOfflineBanner } from './ConsumerOfflineBanner.js';

/** Bottom tab bar + chrome for salon tab routes (no nested IonRouterOutlet). */
export function SalonTabChrome({
  slug,
  profile,
  fromCache = false,
  children,
}: {
  slug: string;
  profile: PublicBusinessProfile;
  fromCache?: boolean;
  children: ReactNode;
}) {
  const base = `/s/${slug}`;
  const homePath = buildSalonTabHomePath(slug);
  const showResultsTab = shouldShowPatientResultsTab(profile.businessType);
  const authed = !!getCustomerToken(slug);
  const { copy } = useConsumerCopy(slug, profile);
  const { locale } = useConsumerLocale(slug, profile);

  const pendingLabRequestsQuery = useQuery({
    queryKey: ['clinic-lab-booking-requests', slug],
    queryFn: () => fetchMyClinicLabBookingRequests(slug),
    enabled: showResultsTab && authed,
  });
  const pendingLabCount = pendingLabRequestsQuery.data?.length ?? 0;

  const bookingsQuery = useQuery({
    queryKey: ['bookings', slug],
    queryFn: () => fetchMyBookings(slug),
    enabled: authed,
  });

  useHomeScreenWidgetSync({
    slug,
    profile,
    authed,
    bookings: bookingsQuery.data,
    copy,
    locale,
  });

  useEffect(() => {
    document.body.classList.add('salon-tab-active');
    return () => document.body.classList.remove('salon-tab-active');
  }, []);

  return (
    <>
      <ConsumerOfflineBanner copy={copy} fromCache={fromCache} />
      <ConsumerAiShell slug={slug} profile={profile} copy={copy} locale={locale}>
        {children}
        <div className="salon-bottom-tab-bar">
          <IonTabBar>
            <IonTabButton tab="home" href={homePath}>
              <IonIcon icon={homeOutline} />
              <IonLabel>Home</IonLabel>
            </IonTabButton>
            <IonTabButton tab="book" href={`${base}/services`}>
              <IonIcon icon={calendarOutline} />
              <IonLabel>Book</IonLabel>
            </IonTabButton>
            {showResultsTab ? (
              <IonTabButton tab="lab-to-book" href={`${base}/lab-to-book`}>
                <IonIcon icon={beakerOutline} />
                <IonLabel>{copy.myLabToBookTab}</IonLabel>
                {pendingLabCount > 0 ? (
                  <IonBadge color="danger">{pendingLabCount}</IonBadge>
                ) : null}
              </IonTabButton>
            ) : null}
            {showResultsTab ? (
              <IonTabButton tab="results" href={`${base}/results`}>
                <IonIcon icon={flaskOutline} />
                <IonLabel>{copy.myResultsTab}</IonLabel>
              </IonTabButton>
            ) : null}
            <IonTabButton tab="account" href={`${base}/account`}>
              <IonIcon icon={personOutline} />
              <IonLabel>Account</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </div>
      </ConsumerAiShell>
    </>
  );
}
