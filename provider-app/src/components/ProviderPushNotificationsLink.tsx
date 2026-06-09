import { useQuery } from '@tanstack/react-query';
import { IonBadge, IonButton, IonItem, IonLabel, IonList } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuthStore } from '../services/auth-store';
import { fetchProviderPushNotifications } from '../lib/provider-push-notifications';
import { useI18n } from '../i18n';

export function ProviderPushNotificationsLink() {
  const { t } = useI18n();
  const history = useHistory();
  const businessId = useAuthStore((s) => s.business?.id);

  const { data } = useQuery({
    queryKey: ['provider-push-notifications', businessId],
    enabled: Boolean(businessId),
    queryFn: () => fetchProviderPushNotifications(businessId!),
  });

  return (
    <IonList className="ion-margin-top">
      <IonItem button detail onClick={() => history.push('/tabs/notifications')}>
        <IonLabel>{t('provider.pushNotificationsTitle')}</IonLabel>
        {data && data.unreadCount > 0 ? (
          <IonBadge color="primary">{data.unreadCount}</IonBadge>
        ) : null}
      </IonItem>
    </IonList>
  );
}
