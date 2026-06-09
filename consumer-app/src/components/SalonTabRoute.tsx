import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import { useConsumerNativePush } from '../hooks/use-consumer-native-push.js';
import { captureReferralFromSearch } from '../lib/consumer-referral.util.js';
import type { SalonTabId } from '../lib/salon-tab-route.util.js';
import { SalonTabChrome } from './SalonTabChrome.js';
import { SalonTabPageContent } from './SalonTabPageContent.js';

/** Single-outlet salon tab route: page renders in the app IonRouterOutlet (Android-safe). */
export function SalonTabRoute({ page }: { page: SalonTabId }) {
  const location = useLocation();
  const { slug, profile, loading, error, fromCache } = useTenantBootstrap();
  useConsumerNativePush(slug);

  useEffect(() => {
    if (!slug) return;
    captureReferralFromSearch(location.search, slug);
  }, [location.search, slug]);

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" style={{ marginTop: '40vh' }} />
        </IonContent>
      </IonPage>
    );
  }

  if (error || !profile || !slug) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <p>{error || 'Salon not found'}</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <SalonTabChrome slug={slug} profile={profile} fromCache={fromCache}>
      <SalonTabPageContent
        page={page}
        slug={slug}
        profile={profile}
        fromCache={fromCache}
      />
    </SalonTabChrome>
  );
}
