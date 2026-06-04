import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuthStore } from '../services/auth-store';
import { isMobileManagerRole, managerRoleLabel } from '../lib/provider-access';
import PushToggle from '../components/PushToggle';
import { useI18n } from '../i18n';

export default function ProfilePage() {
  const { t } = useI18n();
  const history = useHistory();
  const { user, business, logout } = useAuthStore();
  const isManager = isMobileManagerRole(business?.membershipRole);
  const roleLabel = managerRoleLabel(business?.membershipRole);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('provider.profileTitle')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>{user?.firstName} {user?.lastName}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>{user?.email}</p>
            {business && (
              <p className="booking-meta">
                {business.name}
                {roleLabel ? ` · ${roleLabel}` : ''}
              </p>
            )}
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>{t('provider.alertsTitle')}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <PushToggle />
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
      </IonContent>
    </IonPage>
  );
}
