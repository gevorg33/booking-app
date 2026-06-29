import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuthStore } from '../services/auth-store';
import { useAuthStoreHydrated } from '../lib/use-auth-hydrated';

/** Android-safe redirect — always renders IonPage while navigating. */
export function ProviderAppRedirect({ to }: { to: string }) {
  const history = useHistory();

  useEffect(() => {
    history.replace(to);
  }, [history, to]);

  return (
    <IonPage>
      <IonContent className="ion-padding ion-text-center">
        <IonSpinner name="crescent" style={{ marginTop: '40vh' }} />
      </IonContent>
    </IonPage>
  );
}

export function ProviderRootRedirect() {
  const hydrated = useAuthStoreHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const history = useHistory();

  useEffect(() => {
    if (!hydrated) return;
    history.replace(isAuthenticated ? '/tabs/today' : '/login');
  }, [hydrated, history, isAuthenticated]);

  return (
    <IonPage>
      <IonContent className="ion-padding ion-text-center">
        <IonSpinner name="crescent" style={{ marginTop: '40vh' }} />
      </IonContent>
    </IonPage>
  );
}
