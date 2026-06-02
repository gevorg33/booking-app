import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { setCustomerSession } from '../lib/customer-auth.js';
import { loginWithGoogle } from '../services/public-api.js';
import { getGoogleIdToken, isGoogleSignInAvailable } from '../services/google-auth.js';

export default function LoginPage() {
  const history = useHistory();
  const { slug, profile, loading, error } = useTenantBootstrap();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const signIn = async () => {
    if (!slug) return;
    setBusy(true);
    setMessage('');
    try {
      const idToken = await getGoogleIdToken();
      const { token, customer } = await loginWithGoogle(slug, idToken);
      setCustomerSession(slug, token, customer);
      history.replace(buildSalonPath(slug, '/account'));
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return null;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={slug ? buildSalonPath(slug, '/account') : '/'} />
          </IonButtons>
          <IonTitle>Sign in</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
          {profile?.name ?? 'Salon'} account
        </h1>
        <p style={{ color: '#6b7280' }}>
          Sign in with Google for this salon only. Your session is stored separately per salon.
        </p>

        {error ? <p style={{ color: '#dc2626' }}>{error}</p> : null}

        {isGoogleSignInAvailable() ? (
          <IonButton expand="block" disabled={busy || !slug} onClick={() => void signIn()}>
            {busy ? 'Signing in…' : 'Continue with Google'}
          </IonButton>
        ) : (
          <p>Google sign-in is not configured. Add Firebase keys in .env and rebuild.</p>
        )}
        {message ? <p className="ion-margin-top">{message}</p> : null}
      </IonContent>
    </IonPage>
  );
}
