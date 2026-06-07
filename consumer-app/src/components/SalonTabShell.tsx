import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import SalonTabs from './SalonTabs.js';
import { useConsumerNativePush } from '../hooks/use-consumer-native-push.js';

export default function SalonTabShell() {
  const { slug, profile, loading, error } = useTenantBootstrap();
  useConsumerNativePush(slug);

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

  return <SalonTabs slug={slug} profile={profile} />;
}
