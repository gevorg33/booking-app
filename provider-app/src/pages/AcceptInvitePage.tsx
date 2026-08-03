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
import { useI18n } from '../i18n';
import { buildProviderInviteGuideEntryPath } from '../lib/provider-guide-entry.util';
import { useAuthStore } from '../services/auth-store';
import { canAccessProviderApp } from '../lib/provider-access';
import { finishProviderSession, unwrapAuthResult } from '../lib/auth-session';

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
  const { t } = useI18n();
  const history = useHistory();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
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
      setLoadError(t('provider.inviteInvalidLink'));
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
        setLoadError(ax.response?.data?.message || t('provider.inviteNotFound'));
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
        setPhoneError(t('provider.invitePhoneInvalid'));
        setSubmitting(false);
        return;
      }
      phone = formatPhoneForApi(form.phone);
    }

    try {
      const { data } = await api.post(`/invitations/${token}/accept`, {
        firstName: form.firstName,
        lastName: form.lastName,
        password: form.password || undefined,
        phone,
      });
      // e2e-bug.172 — establish the new employee's own session directly
      // instead of redirecting to /login, where a session already active
      // on this device (shared kiosk, second tab) would silently win.
      const result = unwrapAuthResult(data);
      const ok = finishProviderSession(result, {
        canAccess: canAccessProviderApp,
        setAuth,
        onAccessDenied: () => setSubmitError(t('provider.accessDenied')),
        onMissingSession: () => setSubmitError(t('provider.inviteSetupFailed')),
      });
      if (!ok) return;
      setSuccess(true);
      history.replace('/tabs/today');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setSubmitError(ax.response?.data?.message || t('provider.inviteSetupFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('provider.inviteSetupTitle')}</IonTitle>
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
            <p>{t('provider.inviteSuccessRedirect')}</p>
          </IonText>
        ) : invite ? (
          <>
            <p className="booking-meta">
              {t('provider.inviteJoinBusiness', {
                business: invite.businessName,
                role: invite.role,
              })}
            </p>
            <p className="booking-meta">{invite.email}</p>

            {submitError && (
              <IonText color="danger">
                <p>{submitError}</p>
              </IonText>
            )}

            <IonList inset>
              <IonItem>
                <IonLabel position="stacked">{t('auth.firstName')}</IonLabel>
                <IonInput
                  value={form.firstName}
                  onIonInput={(e) => setForm({ ...form, firstName: e.detail.value ?? '' })}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">{t('auth.lastName')}</IonLabel>
                <IonInput
                  value={form.lastName}
                  onIonInput={(e) => setForm({ ...form, lastName: e.detail.value ?? '' })}
                />
              </IonItem>
            </IonList>

            <ProviderPhoneInput
              label={t('provider.inviteMobilePhone')}
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
            <p className="booking-meta">{t('provider.invitePhoneHint')}</p>

            {!invite.hasExistingAccount && (
              <IonList inset>
                <IonItem>
                  <IonLabel position="stacked">{t('provider.passwordLabel')}</IonLabel>
                  <IonInput
                    type="password"
                    value={form.password}
                    onIonInput={(e) => setForm({ ...form, password: e.detail.value ?? '' })}
                  />
                </IonItem>
              </IonList>
            )}

            {invite.hasExistingAccount && (
              <p className="booking-meta">{t('provider.inviteExistingPasswordHint')}</p>
            )}

            <IonButton expand="block" className="ion-margin-top" onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? <IonSpinner name="crescent" /> : t('provider.inviteCompleteSetup')}
            </IonButton>

            <IonButton
              expand="block"
              fill="clear"
              className="ion-margin-top provider-invite-guide-link"
              onClick={() => history.push(buildProviderInviteGuideEntryPath())}
            >
              {t('provider.inviteGuideLink')}
            </IonButton>
          </>
        ) : null}
      </IonContent>
    </IonPage>
  );
}
