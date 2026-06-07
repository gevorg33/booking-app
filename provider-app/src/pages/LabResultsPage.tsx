import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import api, { unwrap } from '../services/api';
import { useAuthStore } from '../services/auth-store';
import { useOperationalEvents } from '../lib/use-operational-events';
import { useI18n } from '../i18n';
import { isTeamView } from '../lib/provider-access';
import type { ProviderLabResultsQueue } from '../lib/provider-lab-results';
import { ProviderLabResultsList } from '../components/ProviderLabResultsList';
import BookingDetailModal from '../components/BookingDetailModal';

export default function LabResultsPage() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: ['provider-lab-results', business?.id],
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
    queryKey: ['provider-lab-results', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${business!.id}/provider/lab-results`,
      );
      return unwrap<ProviderLabResultsQueue>(res);
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
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{t('provider.labResultsTitle')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p className="ion-text-center ion-padding">{t('clinic.labState.gate.disabledReason')}</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('provider.labResultsTitle')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p className="booking-meta">{t('provider.labResultsSubtitle')}</p>
        {isTeamView(data?.viewMode) ? (
          <p className="booking-meta">{t('provider.labResultsTeamLabel')}</p>
        ) : (
          data?.employee && <p className="booking-meta">{data.employee.name}</p>
        )}

        <ProviderLabResultsList
          results={data?.results ?? []}
          loading={isLoading}
          showEmployeeName={isTeamView(data?.viewMode)}
          onSelectBooking={setSelectedBookingId}
        />

        {business?.id && (
          <BookingDetailModal
            businessId={business.id}
            bookingId={selectedBookingId}
            onClose={() => setSelectedBookingId(null)}
          />
        )}
      </IonContent>
    </IonPage>
  );
}
