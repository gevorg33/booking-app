import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import { useConsumerOneTapSignIn } from '../hooks/use-consumer-one-tap-sign-in.js';
import { SalonTabBackButton } from '../components/SalonTabBackButton.js';
import { buildSalonPath } from '../lib/deep-link.js';
import {
  phoneOtpAutocompleteToken,
} from '../lib/phone-auth.util.js';
import { isAppleSignInAvailable } from '../services/apple-auth.js';
import { isGoogleSignInAvailable } from '../services/google-auth.js';
import { isPhoneSignInAvailable } from '../services/phone-auth.js';

export default function LoginPage() {
  const history = useHistory();
  const { slug, profile, loading, error } = useTenantBootstrap();
  const {
    busy,
    message,
    phone,
    setPhone,
    otp,
    setOtp,
    phoneStep,
    setPhoneStep,
    setVerificationId,
    signInWithGoogle,
    signInWithApple,
    sendPhoneCode,
    verifyPhoneCode,
    sanitizeSmsOtpCode,
  } = useConsumerOneTapSignIn(slug, {
    onSuccess: () => {
      if (!slug) return;
      history.replace(buildSalonPath(slug, '/account'));
    },
  });

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" style={{ marginTop: '40vh' }} />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <SalonTabBackButton slug={slug} tab="account" />
          </IonButtons>
          <IonTitle>Sign in</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
          {profile?.name ?? 'Salon'} account
        </h1>
        <p style={{ color: '#6b7280' }}>
          Sign in to save appointments at this salon. Guest bookings made with the same email or
          phone are merged automatically.
        </p>

        {error ? <p style={{ color: '#dc2626' }}>{error}</p> : null}

        {isGoogleSignInAvailable() ? (
          <IonButton
            expand="block"
            disabled={busy || !slug}
            onClick={() => void signInWithGoogle()}
          >
            {busy ? 'Signing in…' : 'Continue with Google'}
          </IonButton>
        ) : (
          <p>Google sign-in is not configured. Add Firebase keys in .env and rebuild.</p>
        )}

        {isAppleSignInAvailable() ? (
          <IonButton
            expand="block"
            fill="outline"
            className="ion-margin-top"
            disabled={busy || !slug}
            onClick={() => void signInWithApple()}
          >
            Continue with Apple
          </IonButton>
        ) : null}

        {isPhoneSignInAvailable() ? (
          <>
            <p style={{ color: '#6b7280', marginTop: 24, marginBottom: 8 }}>
              Or sign in with your phone number
            </p>
            {phoneStep === 'phone' ? (
              <>
                <IonItem>
                  <IonLabel position="stacked">Phone</IonLabel>
                  <IonInput
                    type="tel"
                    value={phone}
                    autocomplete="tel"
                    placeholder="+37499123456"
                    onIonInput={(event) => setPhone(String(event.detail.value ?? ''))}
                  />
                </IonItem>
                <IonButton
                  expand="block"
                  fill="outline"
                  className="ion-margin-top"
                  disabled={busy || !slug}
                  onClick={() => void sendPhoneCode()}
                >
                  Send verification code
                </IonButton>
              </>
            ) : (
              <>
                <IonItem>
                  <IonLabel position="stacked">Verification code</IonLabel>
                  <IonInput
                    value={otp}
                    autocomplete={phoneOtpAutocompleteToken() as 'one-time-code'}
                    inputmode="numeric"
                    onIonInput={(event) =>
                      setOtp(sanitizeSmsOtpCode(String(event.detail.value ?? '')))
                    }
                  />
                </IonItem>
                <IonButton
                  expand="block"
                  className="ion-margin-top"
                  disabled={busy || !slug || !otp}
                  onClick={() => void verifyPhoneCode()}
                >
                  Verify and sign in
                </IonButton>
                <IonButton
                  expand="block"
                  fill="clear"
                  disabled={busy}
                  onClick={() => {
                    setPhoneStep('phone');
                    setOtp('');
                    setVerificationId('');
                  }}
                >
                  Use a different number
                </IonButton>
              </>
            )}
          </>
        ) : null}

        {message ? <p className="ion-margin-top">{message}</p> : null}
      </IonContent>
    </IonPage>
  );
}
