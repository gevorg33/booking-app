import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import api, { unwrap } from '../services/api';
import { useAuthStore } from '../services/auth-store';
import { useOperationalEvents } from '../lib/use-operational-events';
import { useI18n } from '../i18n';

type GiftCardOrder = {
  id: string;
  code?: string;
  cardType: string;
  deliveryMethod: string;
  fulfillmentStatus: string;
  recipientName?: string | null;
  purchaseAmount?: number;
  shippingAddress?: { city?: string; line1?: string } | null;
  personalMessage?: string | null;
  serviceCredits?: Array<{ serviceName: string; quantityRemaining: number }>;
};

export default function GiftCardQueuesPage() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const queryClient = useQueryClient();
  const [queue, setQueue] = useState<'creation' | 'delivery'>('creation');

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['provider-gift-cards', business?.id] });
  }, [queryClient, business?.id]);

  useOperationalEvents(business?.id, (type) => {
    if (type === 'payment.received') refresh();
  });

  const { data: creationOrders = [], isLoading: creationLoading } = useQuery({
    queryKey: ['provider-gift-cards', business?.id, 'creation'],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}/provider/gift-cards/card-creation`);
      return unwrap<{ orders: GiftCardOrder[] }>(data).orders;
    },
    enabled: !!business?.id && queue === 'creation',
    refetchInterval: 60_000,
  });

  const { data: deliveryOrders = [], isLoading: deliveryLoading } = useQuery({
    queryKey: ['provider-gift-cards', business?.id, 'delivery'],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}/provider/gift-cards/delivery`);
      return unwrap<{ orders: GiftCardOrder[] }>(data).orders;
    },
    enabled: !!business?.id && queue === 'delivery',
    refetchInterval: 60_000,
  });

  const markReadyMutation = useMutation({
    mutationFn: async (giftCardId: string) => {
      const { data } = await api.put(
        `/businesses/${business!.id}/provider/gift-cards/card-creation/${giftCardId}/ready`,
      );
      return unwrap(data);
    },
    onSuccess: refresh,
  });

  const outForDeliveryMutation = useMutation({
    mutationFn: async (giftCardId: string) => {
      const { data } = await api.put(
        `/businesses/${business!.id}/provider/gift-cards/delivery/${giftCardId}/out-for-delivery`,
      );
      return unwrap(data);
    },
    onSuccess: refresh,
  });

  const deliveredMutation = useMutation({
    mutationFn: async (giftCardId: string) => {
      const { data } = await api.put(
        `/businesses/${business!.id}/provider/gift-cards/delivery/${giftCardId}/delivered`,
      );
      return unwrap(data);
    },
    onSuccess: refresh,
  });

  const orders = queue === 'creation' ? creationOrders : deliveryOrders;
  const loading = queue === 'creation' ? creationLoading : deliveryLoading;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('provider.navGiftCards')}</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={queue} onIonChange={(e) => setQueue(e.detail.value as 'creation' | 'delivery')}>
            <IonSegmentButton value="creation">
              <span>{t('provider.giftCardCreationTab')}</span>
            </IonSegmentButton>
            <IonSegmentButton value="delivery">
              <span>{t('provider.giftCardDeliveryTab')}</span>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {loading ? (
          <div className="ion-text-center ion-padding">
            <IonSpinner />
          </div>
        ) : orders.length === 0 ? (
          <p className="ion-text-center ion-padding">{t('provider.giftCardQueueEmpty')}</p>
        ) : (
          orders.map((order) => (
            <IonCard key={order.id}>
              <IonCardHeader>
                <IonCardTitle>
                  {order.recipientName ?? t('provider.giftCardOrderFallback')}
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>Type: {order.cardType}</p>
                <p>Status: {order.fulfillmentStatus}</p>
                {order.personalMessage && <p>Message: {order.personalMessage}</p>}
                {order.shippingAddress && (
                  <p>
                    Ship to: {order.shippingAddress.line1}, {order.shippingAddress.city}
                  </p>
                )}
                {(order.serviceCredits ?? []).map((c) => (
                  <p key={c.serviceName}>
                    {c.serviceName} × {c.quantityRemaining}
                  </p>
                ))}
                {queue === 'creation' && order.fulfillmentStatus === 'awaiting_card_creation' && (
                  <IonButton
                    expand="block"
                    className="ion-margin-top"
                    disabled={markReadyMutation.isPending}
                    onClick={() => markReadyMutation.mutate(order.id)}
                  >
                    {t('provider.giftCardMarkReady')}
                  </IonButton>
                )}
                {queue === 'delivery' && order.fulfillmentStatus === 'ready_for_delivery' && (
                  <IonButton
                    expand="block"
                    className="ion-margin-top"
                    disabled={outForDeliveryMutation.isPending}
                    onClick={() => outForDeliveryMutation.mutate(order.id)}
                  >
                    {t('provider.giftCardAcceptPickup')}
                  </IonButton>
                )}
                {queue === 'delivery' && order.fulfillmentStatus === 'out_for_delivery' && (
                  <IonButton
                    expand="block"
                    color="success"
                    className="ion-margin-top"
                    disabled={deliveredMutation.isPending}
                    onClick={() => deliveredMutation.mutate(order.id)}
                  >
                    {t('provider.giftCardMarkDelivered')}
                  </IonButton>
                )}
              </IonCardContent>
            </IonCard>
          ))
        )}
      </IonContent>
    </IonPage>
  );
}
