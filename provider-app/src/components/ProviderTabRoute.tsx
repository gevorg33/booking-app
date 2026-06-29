import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuthStore } from '../services/auth-store';
import { useAuthStoreHydrated } from '../lib/use-auth-hydrated';
import type { ProviderTabContentPage, ProviderTabId } from '../lib/provider-tab-route.util';
import { ProviderTabChrome } from './ProviderTabChrome';
import { ProviderTabPageContent } from './ProviderTabPageContent';

function resolveActiveTab(page: ProviderTabContentPage): ProviderTabId {
  if (page === 'notifications') return 'profile';
  if (page === 'patient-chart') return 'patients';
  return page;
}

/** Single-outlet provider tab route — IonPage is the direct Route output (Android-safe). */
export function ProviderTabRoute({ page }: { page: ProviderTabContentPage }) {
  const hydrated = useAuthStoreHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const history = useHistory();

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      history.replace('/login');
    }
  }, [hydrated, history, isAuthenticated]);

  if (!hydrated || !isAuthenticated) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" style={{ marginTop: '40vh' }} />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage key={`provider-tab-${page}`}>
      <ProviderTabChrome activeTab={resolveActiveTab(page)}>
        <ProviderTabPageContent page={page} embedded />
      </ProviderTabChrome>
    </IonPage>
  );
}
