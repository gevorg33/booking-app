import {
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useEffect, useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import { useConsumerNativePush } from '../hooks/use-consumer-native-push.js';
import { getConsumerCopy } from '../lib/copy.js';
import { captureReferralFromSearch } from '../lib/consumer-referral.util.js';
import { shouldShowPatientResultsTab } from '../lib/clinic-service.js';
import {
  buildSalonTabHomePath,
  isClinicOnlySalonTab,
  type SalonTabId,
} from '../lib/salon-tab-route.util.js';
import { resolveAppConsumerLocale } from '../lib/tenant-locale.js';
import { ConsumerActionButton } from './ConsumerActionButton.js';
import { SalonTabChrome } from './SalonTabChrome.js';
import { SalonTabPageContent } from './SalonTabPageContent.js';

/** Single-outlet salon tab route: page renders in the app IonRouterOutlet (Android-safe). */
export function SalonTabRoute({ page }: { page: SalonTabId }) {
  const history = useHistory();
  const location = useLocation();
  const { slug, profile, loading, error, fromCache } = useTenantBootstrap();
  useConsumerNativePush(slug);
  const copy = useMemo(
    () => getConsumerCopy(resolveAppConsumerLocale()),
    // Re-read when error/slug changes so locale switch on welcome is picked up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [error, slug],
  );

  useEffect(() => {
    if (!slug) return;
    captureReferralFromSearch(location.search, slug);
  }, [location.search, slug]);

  // e2e-bug.43 — clinic-only deep links must not mount for non-clinic businesses.
  const blockClinicTab =
    Boolean(profile && slug) &&
    isClinicOnlySalonTab(page) &&
    !shouldShowPatientResultsTab(profile?.businessType);

  useEffect(() => {
    if (!blockClinicTab || !slug) return;
    history.replace(buildSalonTabHomePath(slug));
  }, [blockClinicTab, history, slug]);

  if (loading || blockClinicTab) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" style={{ marginTop: '40vh' }} />
        </IonContent>
      </IonPage>
    );
  }

  if (error || !profile || !slug) {
    // e2e-bug.20 — friendly not-found with a way back (not a bare axios string).
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{copy.welcomeAppTitle}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p role="alert" style={{ marginBottom: 16 }}>
            {error || copy.salonNotFound}
          </p>
          <ConsumerActionButton expand="block" onClick={() => history.replace('/')}>
            {copy.salonNotFoundBack}
          </ConsumerActionButton>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage key={`salon-tab-${slug}-${page}`}>
      <SalonTabChrome slug={slug} profile={profile} fromCache={fromCache}>
        <SalonTabPageContent
          embedded
          page={page}
          slug={slug}
          profile={profile}
          fromCache={fromCache}
        />
      </SalonTabChrome>
    </IonPage>
  );
}
