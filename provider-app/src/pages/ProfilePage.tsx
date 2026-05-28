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

export default function ProfilePage() {
  const history = useHistory();
  const { user, business, logout } = useAuthStore();
  const isManager = isMobileManagerRole(business?.membershipRole);
  const roleLabel = managerRoleLabel(business?.membershipRole);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Profile</IonTitle>
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
            <IonCardTitle>Alerts</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <PushToggle />
            <p className="booking-meta">
              {isManager
                ? 'Get notified when any provider receives a new booking.'
                : 'Get notified when a new appointment is booked for you.'}
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
          Sign out
        </IonButton>
      </IonContent>
    </IonPage>
  );
}
