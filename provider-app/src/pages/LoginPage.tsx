import { useState } from 'react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import api, { unwrap } from '../services/api';
import { useAuthStore } from '../services/auth-store';
import { getGoogleIdToken, isGoogleSignInAvailable } from '../services/google-auth';
import { enableNativePush } from '../services/native-push';

type AuthResult = {
  user: { id: string; email: string; firstName?: string; lastName?: string };
  business: { id: string; name: string; slug?: string };
  employee: { id: string; name: string } | null;
  token: string;
};

export default function LoginPage() {
  const history = useHistory();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const googleEnabled = isGoogleSignInAvailable();

  const finishLogin = (result: AuthResult) => {
    if (!result.employee) {
      setError('Your account is not linked to a provider profile. Ask your admin to send app access.');
      return;
    }
    setAuth(result.user, result.business, result.token);
    void enableNativePush(result.business.id);
    history.replace('/tabs/today');
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      finishLogin(unwrap<AuthResult>(data));
    } catch (err: unknown) {
      setError(readAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const idToken = await getGoogleIdToken();
      const { data } = await api.post('/auth/google', { idToken });
      finishLogin(unwrap<AuthResult>(data));
    } catch (err: unknown) {
      setError(readAuthError(err, 'Google sign-in failed.'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgot = async () => {
    setForgotMsg('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      const payload = unwrap<{ message?: string }>(data);
      setForgotMsg(payload.message || 'If an account exists, a reset link was sent.');
    } catch {
      setForgotMsg('If an account exists, a reset link was sent.');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Provider sign in</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p className="booking-meta">For service providers — appointments and alerts only.</p>

        {error && (
          <IonText color="danger">
            <p>{error}</p>
          </IonText>
        )}

        {googleEnabled && (
          <>
            <IonButton
              expand="block"
              fill="outline"
              onClick={() => void handleGoogleLogin()}
              disabled={loading || googleLoading}
            >
              {googleLoading ? <IonSpinner name="crescent" /> : 'Continue with Google'}
            </IonButton>
            <p className="booking-meta ion-text-center ion-margin-vertical">or sign in with email</p>
          </>
        )}

        <IonList inset>
          <IonItem>
            <IonLabel position="stacked">Email</IonLabel>
            <IonInput type="email" value={email} onIonInput={(e) => setEmail(e.detail.value ?? '')} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Password</IonLabel>
            <IonInput
              type="password"
              value={password}
              onIonInput={(e) => setPassword(e.detail.value ?? '')}
            />
          </IonItem>
        </IonList>

        <IonButton expand="block" className="ion-margin-top" onClick={() => void handleLogin()} disabled={loading || googleLoading}>
          {loading ? <IonSpinner name="crescent" /> : 'Sign in'}
        </IonButton>

        <IonButton fill="clear" expand="block" onClick={() => setForgotOpen((v) => !v)}>
          Forgot password?
        </IonButton>

        {forgotOpen && (
          <div className="ion-padding-top">
            <IonButton expand="block" fill="outline" onClick={() => void handleForgot()}>
              Send reset link
            </IonButton>
            {forgotMsg && <IonText color="success"><p>{forgotMsg}</p></IonText>}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}

function readAuthError(err: unknown, fallback = 'Login failed. Check API URL and network.'): string {
  const ax = err as {
    response?: { data?: { code?: string; message?: string } };
    message?: string;
  };
  if (!ax.response) {
    return ax.message?.includes('cancelled') ? 'Sign-in was cancelled.' : fallback;
  }
  const code = ax.response.data?.code;
  if (code === 'ACCOUNT_NOT_FOUND') {
    return 'No login yet. Ask your admin to send app access from the Employees page.';
  }
  if (code === 'INVALID_CREDENTIALS') {
    return 'Incorrect password.';
  }
  if (code === 'INVALID_GOOGLE_TOKEN') {
    return 'Google sign-in token was invalid. Try again.';
  }
  return ax.response.data?.message || fallback;
}
