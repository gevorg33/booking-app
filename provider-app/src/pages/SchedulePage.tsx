import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import api, { unwrap } from '../services/api';
import { useAuthStore } from '../services/auth-store';
import { formatDateDisplay } from '../lib/date-format';
import { formatBookingBlockHeadline, type BookingSummary } from '../lib/booking-types';
import { isMobileManagerRole, isTeamView } from '../lib/provider-access';
import BookingDetailModal from '../components/BookingDetailModal';
import ProviderAiAssistant from '../components/ProviderAiAssistant';
import { useOperationalEvents } from '../lib/use-operational-events';
import { buildProviderAiScreenContext } from '../lib/provider-ai-context';

export default function SchedulePage() {
  const { business } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refreshBookings = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['provider-schedule-summary', business?.id] });
    void queryClient.invalidateQueries({ queryKey: ['provider-upcoming', business?.id] });
    void queryClient.invalidateQueries({ queryKey: ['provider-today', business?.id] });
    void queryClient.invalidateQueries({ queryKey: ['provider-booking'] });
  }, [queryClient, business?.id]);

  const onOperationalEvent = useCallback(
    (type: string) => {
      if (
        type === 'booking.updated' ||
        type === 'booking.rescheduled' ||
        type === 'booking.cancelled' ||
        type === 'booking.completed' ||
        type === 'availability.updated' ||
        type === 'booking.created'
      ) {
        refreshBookings();
      }
    },
    [refreshBookings],
  );

  useOperationalEvents(business?.id, onOperationalEvent);

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['provider-schedule-summary', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${business!.id}/provider/schedule/summary?days=14`);
      return unwrap<{ days: Array<{ date: string; available: number; booked: number }> }>(res);
    },
    enabled: !!business?.id,
  });

  const { data: upcoming, isLoading: loadingUpcoming } = useQuery({
    queryKey: ['provider-upcoming', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${business!.id}/provider/bookings/upcoming?days=14`);
      return unwrap<{ viewMode?: 'provider' | 'admin'; bookings: BookingSummary[] }>(res);
    },
    enabled: !!business?.id,
  });

  const isLoading = loadingSummary || loadingUpcoming;

  const isManagerView = isMobileManagerRole(business?.membershipRole);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{isManagerView ? 'All appointments' : 'My schedule'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {business?.id && (
          <ProviderAiAssistant
            businessId={business.id}
            screenContext={buildProviderAiScreenContext(
              'schedule',
              {},
              upcoming?.bookings ?? [],
              selectedId,
            )}
          />
        )}

        {isLoading ? (
          <div className="empty-state"><IonSpinner /></div>
        ) : (
          <>
            {summary?.days?.length ? (
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Availability (next 2 weeks)</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList lines="none">
                    {summary.days.map((d) => (
                      <IonItem key={d.date}>
                        <IonLabel>
                          <h3>{formatDateDisplay(d.date)}</h3>
                          <p>{d.booked} booked · {d.available} open</p>
                        </IonLabel>
                      </IonItem>
                    ))}
                  </IonList>
                </IonCardContent>
              </IonCard>
            ) : null}

            <h2 className="ion-padding-start">Upcoming appointments</h2>
            {!upcoming?.bookings?.length ? (
              <p className="empty-state">No upcoming appointments.</p>
            ) : (
              upcoming.bookings.map((b) => (
                <IonCard key={b.id} button onClick={() => setSelectedId(b.id)}>
                  <IonCardContent>
                    <p className="booking-meta">{formatDateDisplay(b.startTime)}</p>
                    <p><strong>{formatBookingBlockHeadline(b)}</strong></p>
                    <p>{b.service?.name} — {b.customer?.name}</p>
                    {b.employee && isTeamView(upcoming?.viewMode) && (
                      <p className="booking-meta">Provider: {b.employee.name}</p>
                    )}
                    <p className="booking-meta">Tap to manage</p>
                  </IonCardContent>
                </IonCard>
              ))
            )}
          </>
        )}

        {business?.id && (
          <BookingDetailModal
            businessId={business.id}
            bookingId={selectedId}
            onClose={() => setSelectedId(null)}
          />
        )}
      </IonContent>
    </IonPage>
  );
}
