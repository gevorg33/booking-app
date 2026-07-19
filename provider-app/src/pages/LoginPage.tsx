import { useEffect, useState } from 'react';
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
import { canAccessProviderApp } from '../lib/provider-access';
import {
  getLoginTenantHint,
  savePreferredBusinessSlug,
  unwrapAuthResult,
  type AuthResult,
} from '../lib/auth-session';
import { useAuthStoreHydrated } from '../lib/use-auth-hydrated';
import { useI18n } from '../i18n';

export default function LoginPage() {
  const { t } = useI18n();
  const history = useHistory();
  const hydrated = useAuthStoreHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [pendingBusinesses, setPendingBusinesses] = useState<AuthResult['businesses'] | null>(null);
  const googleEnabled = isGoogleSignInAvailable();

  // e2e-bug.64 — already-signed-in visits to /login must bounce to today (mirror e2e-bug.45).
  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;
    history.replace('/tabs/today');
  }, [hydrated, history, isAuthenticated]);

  const finishLogin = (result: AuthResult) => {
    if (!canAccessProviderApp(result.employee, result.business?.membershipRole)) {
      setError(t('provider.accessDenied'));
      return;
    }
    if (!result.token || !result.business) {
      setError(t('provider.loginFailedRetry'));
      return;
    }
    setAuth(result.user, result.business, result.token, {
      businesses: result.businesses,
      employee: result.employee,
    });
    savePreferredBusinessSlug(result.business.slug);
    void enableNativePush(result.business.id);
    history.replace('/tabs/today');
  };

  const completeLogin = async (businessId?: string) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', {
        email,
        password,
        ...getLoginTenantHint(),
        ...(businessId ? { businessId } : {}),
      });
      const result = unwrapAuthResult(data);
      if (result.requiresBusinessSelection) {
        setPendingBusinesses(result.businesses);
        return;
      }
      finishLogin(result);
    } catch (err: unknown) {
      setError(readAuthError(err, t));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setPendingBusinesses(null);
    await completeLogin();
  };

  const handleGoogleLogin = async (businessId?: string) => {
    setGoogleLoading(true);
    setError('');
    try {
      const idToken = await getGoogleIdToken();
      const { data } = await api.post('/auth/google', {
        idToken,
        ...getLoginTenantHint(),
        ...(businessId ? { businessId } : {}),
      });
      const result = unwrapAuthResult(data);
      if (result.requiresBusinessSelection) {
        setPendingBusinesses(result.businesses);
        return;
      }
      finishLogin(result);
    } catch (err: unknown) {
      setError(readAuthError(err, t, t('provider.googleSignInFailed')));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgot = async () => {
    setForgotMsg('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      const payload = unwrap<{ message?: string }>(data);
      setForgotMsg(payload.message || t('auth.resetEmailSent'));
    } catch {
      setForgotMsg(t('auth.resetEmailSent'));
    }
  };

  if (!hydrated || isAuthenticated) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" style={{ marginTop: '40vh' }} />
        </IonContent>
      </IonPage>
    );
  }

  if (pendingBusinesses) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{t('auth.selectBusiness')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p className="booking-meta">{t('auth.selectBusinessHint')}</p>
          {pendingBusinesses.map((biz) => (
            <IonButton
              key={biz.id}
              expand="block"
              fill="outline"
              className="ion-margin-bottom"
              disabled={loading || googleLoading}
              onClick={() => void completeLogin(biz.id)}
            >
              {biz.name}
            </IonButton>
          ))}
          <IonButton fill="clear" expand="block" onClick={() => setPendingBusinesses(null)}>
            {t('provider.back')}
          </IonButton>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('provider.signInPageTitle')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p className="booking-meta">{t('provider.signInPageSubtitle')}</p>

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
              {googleLoading ? <IonSpinner name="crescent" /> : t('provider.continueWithGoogle')}
            </IonButton>
            <p className="booking-meta ion-text-center ion-margin-vertical">
              {t('provider.orSignInWithEmail')}
            </p>
          </>
        )}

        <IonList inset>
          <IonItem>
            <IonLabel position="stacked">{t('provider.emailLabel')}</IonLabel>
            <IonInput type="email" value={email} onIonInput={(e) => setEmail(e.detail.value ?? '')} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">{t('provider.passwordLabel')}</IonLabel>
            <IonInput
              type="password"
              value={password}
              onIonInput={(e) => setPassword(e.detail.value ?? '')}
            />
          </IonItem>
        </IonList>

        <IonButton
          expand="block"
          className="ion-margin-top"
          onClick={() => void handleLogin()}
          disabled={loading || googleLoading}
        >
          {loading ? <IonSpinner name="crescent" /> : t('auth.signIn')}
        </IonButton>

        <IonButton fill="clear" expand="block" onClick={() => setForgotOpen((v) => !v)}>
          {t('auth.forgotPassword')}
        </IonButton>

        {forgotOpen && (
          <div className="ion-padding-top">
            <IonButton expand="block" fill="outline" onClick={() => void handleForgot()}>
              {t('auth.sendResetLink')}
            </IonButton>
            {forgotMsg && (
              <IonText color="success">
                <p>{forgotMsg}</p>
              </IonText>
            )}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}

type AuthTranslate = (key: string) => string;

function readAuthError(
  err: unknown,
  t: AuthTranslate,
  fallback = t('provider.loginFailedNetwork'),
): string {
  const ax = err as {
    response?: { data?: { code?: string; message?: string } };
    message?: string;
  };
  if (!ax.response) {
    return ax.message?.includes('cancelled') ? t('provider.signInCancelled') : fallback;
  }
  const code = ax.response.data?.code;
  if (code === 'ACCOUNT_NOT_FOUND') {
    return t('provider.accountNotFoundHint');
  }
  if (code === 'INVALID_CREDENTIALS') {
    return t('auth.invalidCredentials');
  }
  if (code === 'INVALID_GOOGLE_TOKEN') {
    return t('provider.googleTokenInvalid');
  }
  return ax.response.data?.message || fallback;
}
