import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuthStore } from '../services/auth-store';
import { isMobileManagerRole, managerRoleLabel } from '../lib/provider-access';
import { ProviderPushNotificationsLink } from '../components/ProviderPushNotificationsLink';
import PushToggle from '../components/PushToggle';
import { ProviderProfileSection } from '../components/ProviderProfileSection';
import { ProviderLanguagePicker } from '../components/ProviderLanguagePicker';
import { ProviderMyStatsSection } from '../components/ProviderMyStatsSection';
import { enableNativePush, isFcmBuild } from '../services/native-push';
import { useI18n } from '../i18n';
import { ProviderTabPageShell } from '../components/ProviderTabPageShell';
import { ProviderTabScrollContent } from '../components/ProviderTabScrollContent';

export default function ProfilePage({ embedded = false }: { embedded?: boolean }) {
  const { t } = useI18n();
  const history = useHistory();
  const location = useLocation();
  const { user, business, logout } = useAuthStore();
  const isManager = isMobileManagerRole(business?.membershipRole);
  const roleLabel = managerRoleLabel(business?.membershipRole);

  useEffect(() => {
    const enablePush = new URLSearchParams(location.search).get('enablePush');
    if (enablePush !== '1' || !business?.id) return;
    if (!Capacitor.isNativePlatform() || !isFcmBuild()) return;
    void enableNativePush(business.id);
  }, [business?.id, location.search]);

  return (
    <ProviderTabPageShell embedded={embedded}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('provider.profileTitle')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <ProviderTabScrollContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              {user?.firstName} {user?.lastName}
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>{user?.email}</p>
            {business ? (
              <p className="booking-meta">
                {business.name}
                {roleLabel ? ` · ${roleLabel}` : ''}
              </p>
            ) : null}
          </IonCardContent>
        </IonCard>

        <ProviderMyStatsSection />

        <ProviderProfileSection />

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>{t('languages.title')}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <ProviderLanguagePicker />
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>{t('provider.alertsTitle')}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <PushToggle />
            <ProviderPushNotificationsLink />
            <p className="booking-meta">
              {isManager ? t('provider.pushHintTeam') : t('provider.pushHint')}
            </p>
          </IonCardContent>
        </IonCard>

        <IonButton
          expand="block"
          color="danger"
          fill="outline"
          className="ion-margin-top"
          onClick={() => {
            logout();
            history.replace('/login');
          }}
        >
          {t('provider.signOut')}
        </IonButton>
      </ProviderTabScrollContent>
    </ProviderTabPageShell>
  );
}
