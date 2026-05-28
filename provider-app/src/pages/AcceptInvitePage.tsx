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
import { useHistory, useLocation } from 'react-router-dom';
import api, { unwrap } from '../services/api';
import { ProviderPhoneInput } from '../components/ProviderPhoneInput';
import {
  defaultCountryFromCallingCode,
  formatPhoneForApi,
  isValidPhone,
} from '../lib/phone-format';

interface InviteInfo {
  email: string;
  businessName: string;
  role: string;
  employeeName?: string;
  isAppAccess?: boolean;
  hasExistingAccount?: boolean;
  defaultPhoneCountryCode?: string;
}

export default function AcceptInvitePage() {
  const history = useHistory();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token') ?? '';

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', password: '', phone: '' });
  const [submitError, setSubmitError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadError('Invalid invitation link');
      setLoading(false);
      return;
    }
    api
      .get(`/invitations/${token}`)
      .then(({ data }) => {
        const info = unwrap<InviteInfo>(data);
        setInvite(info);
        if (info.employeeName) {
          const parts = info.employeeName.split(' ');
          setForm((f) => ({
            ...f,
            firstName: parts[0] ?? '',
            lastName: parts.slice(1).join(' ') ?? '',
          }));
        }
      })
      .catch((err: unknown) => {
        const ax = err as { response?: { data?: { message?: string } } };
        setLoadError(ax.response?.data?.message || 'Invitation not found');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    setPhoneError('');

    let phone: string | undefined;
    if (form.phone.trim()) {
      if (!isValidPhone(form.phone)) {
        setPhoneError('Enter a valid phone number with country code');
        setSubmitting(false);
        return;
      }
      phone = formatPhoneForApi(form.phone);
    }

    try {
      await api.post(`/invitations/${token}/accept`, {
        firstName: form.firstName,
        lastName: form.lastName,
        password: form.password || undefined,
        phone,
      });
      setSuccess(true);
      setTimeout(() => history.replace('/login'), 2000);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setSubmitError(ax.response?.data?.message || 'Could not complete setup');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Set up account</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {loading ? (
          <div className="ion-text-center ion-padding">
            <IonSpinner />
          </div>
        ) : loadError ? (
          <IonText color="danger">
            <p>{loadError}</p>
          </IonText>
        ) : success ? (
          <IonText color="success">
            <p>Account ready. Redirecting to sign in…</p>
          </IonText>
        ) : invite ? (
          <>
            <p className="booking-meta">
              Join <strong>{invite.businessName}</strong> as {invite.role}
            </p>
            <p className="booking-meta">{invite.email}</p>

            {submitError && (
              <IonText color="danger">
                <p>{submitError}</p>
              </IonText>
            )}

            <IonList inset>
              <IonItem>
                <IonLabel position="stacked">First name</IonLabel>
                <IonInput
                  value={form.firstName}
                  onIonInput={(e) => setForm({ ...form, firstName: e.detail.value ?? '' })}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Last name</IonLabel>
                <IonInput
                  value={form.lastName}
                  onIonInput={(e) => setForm({ ...form, lastName: e.detail.value ?? '' })}
                />
              </IonItem>
            </IonList>

            <ProviderPhoneInput
              label="Mobile phone"
              value={form.phone || undefined}
              onChange={(phone) => {
                setPhoneError('');
                setForm((f) => ({ ...f, phone: phone ?? '' }));
              }}
              defaultCountry={defaultCountryFromCallingCode(invite.defaultPhoneCountryCode)}
            />
            {phoneError && (
              <IonText color="danger">
                <p>{phoneError}</p>
              </IonText>
            )}
            <p className="booking-meta">Include country code for team contact and notifications.</p>

            {!invite.hasExistingAccount && (
              <IonList inset>
                <IonItem>
                  <IonLabel position="stacked">Password</IonLabel>
                  <IonInput
                    type="password"
                    value={form.password}
                    onIonInput={(e) => setForm({ ...form, password: e.detail.value ?? '' })}
                  />
                </IonItem>
              </IonList>
            )}

            {invite.hasExistingAccount && (
              <p className="booking-meta">Use your existing password when you sign in.</p>
            )}

            <IonButton expand="block" className="ion-margin-top" onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? <IonSpinner name="crescent" /> : 'Complete setup'}
            </IonButton>
          </>
        ) : null}
      </IonContent>
    </IonPage>
  );
}
