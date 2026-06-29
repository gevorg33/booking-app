import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonHeader,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import api, { unwrap } from '../services/api';
import { useAuthStore } from '../services/auth-store';
import { formatDateDisplay, formatTimeDisplay } from '../lib/date-format';
import { useOperationalEvents } from '../lib/use-operational-events';
import { useI18n } from '../i18n';
import { ProviderTabPageShell } from '../components/ProviderTabPageShell';
import { ProviderTabScrollContent } from '../components/ProviderTabScrollContent';
import { isTeamView } from '../lib/provider-access';
import type { ProviderLabCollectionQueue } from '../lib/provider-lab-collection';
import { ClinicLabStatusBadge } from '../components/ClinicLabStatusBadge';
import BookingDetailModal from '../components/BookingDetailModal';

export default function LabCollectionPage({ embedded = false }: { embedded?: boolean }) {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: ['provider-lab-collection', business?.id],
    });
  }, [queryClient, business?.id]);

  useOperationalEvents(business?.id, (type) => {
    if (
      type === 'booking.updated' ||
      type === 'booking.created' ||
      type === 'booking.cancelled'
    ) {
      refresh();
    }
  });

  const { data, isLoading } = useQuery({
    queryKey: ['provider-lab-collection', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${business!.id}/provider/lab-collection/today`,
      );
      return unwrap<ProviderLabCollectionQueue>(res);
    },
    enabled: !!business?.id,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (data && !data.labFeaturesEnabled) {
      setSelectedBookingId(null);
    }
  }, [data]);

  if (data && !data.labFeaturesEnabled) {
    return (
      <ProviderTabPageShell embedded={embedded}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{t('provider.labCollectionTitle')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <ProviderTabScrollContent className="ion-padding">
          <p className="ion-text-center ion-padding">{t('clinic.labState.gate.disabledReason')}</p>
        </ProviderTabScrollContent>
      </ProviderTabPageShell>
    );
  }

  return (
    <ProviderTabPageShell embedded={embedded}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('provider.labCollectionTitle')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <ProviderTabScrollContent className="ion-padding">
        <p className="booking-meta">{t('provider.labCollectionSubtitle')}</p>
        {isTeamView(data?.viewMode) ? (
          <p className="booking-meta">{t('provider.labCollectionTeamLabel')}</p>
        ) : (
          data?.employee && <p className="booking-meta">{data.employee.name}</p>
        )}

        {isLoading ? (
          <div className="empty-state">
            <IonSpinner />
          </div>
        ) : !data?.orders?.length ? (
          <p className="empty-state">{t('provider.labCollectionEmpty')}</p>
        ) : (
          data.orders.map((order) => (
            <IonCard
              key={order.id}
              button={!!order.bookingId}
              onClick={() => {
                if (order.bookingId) setSelectedBookingId(order.bookingId);
              }}
            >
              <IonCardHeader>
                <IonCardTitle>{order.displayNames ?? t('clinic.labState.ordersTab.unnamedOrder')}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div style={{ marginBottom: '8px' }}>
                  <ClinicLabStatusBadge kind="order" status={order.status} />
                </div>
                {order.customerName && <p>{order.customerName}</p>}
                {order.bookingStartTime && (
                  <p className="booking-meta">
                    {formatDateDisplay(order.bookingStartTime)}{' '}
                    {formatTimeDisplay(order.bookingStartTime)}
                  </p>
                )}
                {order.department && (
                  <p className="booking-meta">{order.department}</p>
                )}
                {isTeamView(data.viewMode) && order.employeeName && (
                  <p className="booking-meta">
                    {t('common.provider')}: {order.employeeName}
                  </p>
                )}
                {order.bookingId && (
                  <p className="booking-meta">{t('provider.labCollectionTapBooking')}</p>
                )}
              </IonCardContent>
            </IonCard>
          ))
        )}

        {business?.id && (
          <BookingDetailModal
            businessId={business.id}
            bookingId={selectedBookingId}
            onClose={() => setSelectedBookingId(null)}
          />
        )}
      </ProviderTabScrollContent>
    </ProviderTabPageShell>
  );
}
