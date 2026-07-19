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
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useTenantBootstrap } from '../hooks/use-tenant-bootstrap.js';
import { useConsumerCopy } from '../hooks/use-consumer-copy.js';
import { useConsumerOneTapSignIn } from '../hooks/use-consumer-one-tap-sign-in.js';
import { SalonTabBackButton } from '../components/SalonTabBackButton.js';
import { getCustomerToken } from '../lib/customer-auth.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { formatCopy } from '../lib/copy.js';
import {
  phoneOtpAutocompleteToken,
} from '../lib/phone-auth.util.js';
import { isAppleSignInAvailable } from '../services/apple-auth.js';
import { isGoogleSignInAvailable } from '../services/google-auth.js';
import { isPhoneSignInAvailable } from '../services/phone-auth.js';

export default function LoginPage() {
  const history = useHistory();
  const { slug, profile, loading, error } = useTenantBootstrap();
  const { copy } = useConsumerCopy(slug ?? '', profile ?? { locale: 'en' });
  const alreadySignedIn = Boolean(slug && getCustomerToken(slug));
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
    copy,
    onSuccess: () => {
      if (!slug) return;
      history.replace(buildSalonPath(slug, '/account'));
    },
  });

  // e2e-bug.45 — already-signed-in visits to /login must bounce to account.
  useEffect(() => {
    if (!slug || !getCustomerToken(slug)) return;
    history.replace(buildSalonPath(slug, '/account'));
  }, [history, slug]);

  if (loading || alreadySignedIn) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" style={{ marginTop: '40vh' }} />
        </IonContent>
      </IonPage>
    );
  }

  const salonName = profile?.name?.trim() || copy.tabAccount;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <SalonTabBackButton slug={slug} tab="account" text={copy.guidePageBack} />
          </IonButtons>
          <IonTitle>{copy.signIn}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
          {formatCopy(copy.loginAccountHeading, { name: salonName })}
        </h1>
        <p style={{ color: '#6b7280' }}>{copy.loginSubtitle}</p>

        {error ? <p style={{ color: '#dc2626' }}>{error}</p> : null}

        {isGoogleSignInAvailable() ? (
          <IonButton
            expand="block"
            color="primary"
            className="consumer-brand-solid-button"
            disabled={busy || !slug}
            onClick={() => void signInWithGoogle()}
          >
            {busy ? copy.postBookingSignInBusy : copy.postBookingSignInGoogle}
          </IonButton>
        ) : (
          <p>{copy.loginGoogleNotConfigured}</p>
        )}

        {isAppleSignInAvailable() ? (
          <IonButton
            expand="block"
            fill="outline"
            color="primary"
            className="ion-margin-top consumer-brand-outline-button"
            disabled={busy || !slug}
            onClick={() => void signInWithApple()}
          >
            {copy.postBookingSignInApple}
          </IonButton>
        ) : null}

        {isPhoneSignInAvailable() ? (
          <>
            <p style={{ color: '#6b7280', marginTop: 24, marginBottom: 8 }}>
              {copy.loginPhoneHint}
            </p>
            {phoneStep === 'phone' ? (
              <>
                <IonItem>
                  <IonLabel position="stacked">{copy.loginPhoneLabel}</IonLabel>
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
                  {copy.loginSendCode}
                </IonButton>
              </>
            ) : (
              <>
                <IonItem>
                  <IonLabel position="stacked">{copy.loginOtpLabel}</IonLabel>
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
                  {copy.loginVerify}
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
                  {copy.loginDifferentNumber}
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
