import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  RefresherEventDetail,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuthStore } from '../services/auth-store';
import { formatDateDisplay, formatTimeDisplay } from '../lib/date-format';
import {
  fetchProviderPushNotifications,
  markAllProviderPushNotificationsRead,
  markProviderPushNotificationRead,
  providerPushNotificationRoute,
  type ProviderPushNotificationItem,
} from '../lib/provider-push-notifications';
import { providerTabPathFromPushUrl } from '../lib/provider-push-deep-link.util';
import { useI18n } from '../i18n';

function formatSentAt(value: string): string {
  const date = new Date(value);
  return `${formatDateDisplay(date.toISOString())} · ${formatTimeDisplay(date.toISOString())}`;
}

function notificationKindLabel(
  kind: ProviderPushNotificationItem['kind'],
  t: (key: string) => string,
): string {
  switch (kind) {
    case 'booking_created':
      return t('provider.pushNotificationKindBookingCreated');
    case 'booking_cancelled':
      return t('provider.pushNotificationKindBookingCancelled');
    case 'booking_rescheduled':
      return t('provider.pushNotificationKindBookingRescheduled');
    case 'payment_received':
      return t('provider.pushNotificationKindPaymentReceived');
    case 'end_of_day':
      return t('provider.pushNotificationKindEndOfDay');
    default:
      return t('provider.pushNotificationKindUpdated');
  }
}

export default function PushNotificationsPage() {
  const { t } = useI18n();
  const history = useHistory();
  const businessId = useAuthStore((s) => s.business?.id);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['provider-push-notifications', businessId],
    enabled: Boolean(businessId),
    queryFn: () => fetchProviderPushNotifications(businessId!),
  });

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refetch();
    event.detail.complete();
  };

  const openNotification = async (item: ProviderPushNotificationItem) => {
    if (!businessId) return;
    if (!item.isRead) {
      await markProviderPushNotificationRead(businessId, item.id);
      void queryClient.invalidateQueries({
        queryKey: ['provider-push-notifications', businessId],
      });
    }
    const route = item.url
      ? providerTabPathFromPushUrl(item.url)
      : providerPushNotificationRoute(item);
    history.push(route);
  };

  const markAllRead = async () => {
    if (!businessId) return;
    await markAllProviderPushNotificationsRead(businessId);
    void queryClient.invalidateQueries({
      queryKey: ['provider-push-notifications', businessId],
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('provider.pushNotificationsTitle')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="ion-padding-horizontal ion-padding-top">
          <IonText color="medium">
            <p className="booking-meta">{t('provider.pushNotificationsSubtitle')}</p>
          </IonText>
          {data && data.unreadCount > 0 ? (
            <IonButton fill="clear" size="small" onClick={() => void markAllRead()}>
              {t('provider.pushNotificationsMarkAllRead')}
            </IonButton>
          ) : null}
        </div>

        {isLoading ? (
          <div className="ion-text-center ion-padding">
            <IonSpinner />
          </div>
        ) : null}

        {isError ? (
          <IonText color="danger">
            <p className="ion-padding">{t('provider.pushNotificationsLoadFailed')}</p>
          </IonText>
        ) : null}

        {!isLoading && data && data.items.length === 0 ? (
          <IonText color="medium">
            <p className="ion-padding">{t('provider.pushNotificationsEmpty')}</p>
          </IonText>
        ) : null}

        {data && data.items.length > 0 ? (
          <IonList>
            {data.items.map((item) => (
              <IonItem
                key={item.id}
                button
                detail
                className={item.isRead ? undefined : 'provider-push-notification--unread'}
                onClick={() => void openNotification(item)}
              >
                <IonLabel>
                  <h2>{item.title}</h2>
                  <p>{item.body}</p>
                  <IonNote>
                    {notificationKindLabel(item.kind, t)} · {formatSentAt(item.sentAt)}
                  </IonNote>
                </IonLabel>
                {!item.isRead ? (
                  <span className="provider-push-notification__unread-dot" aria-hidden />
                ) : null}
              </IonItem>
            ))}
          </IonList>
        ) : null}
      </IonContent>
    </IonPage>
  );
}
