import { useQuery } from '@tanstack/react-query';
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
import { formatDateDisplay, formatTimeRangeDisplay } from '../lib/date-format';

export default function SchedulePage() {
  const { business } = useAuthStore();

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
      return unwrap<{
        bookings: Array<{
          id: string;
          startTime: string;
          endTime: string;
          service: { name: string } | null;
          customer: { name: string } | null;
        }>;
      }>(res);
    },
    enabled: !!business?.id,
  });

  const isLoading = loadingSummary || loadingUpcoming;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>My schedule</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
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
                <IonCard key={b.id}>
                  <IonCardContent>
                    <p><strong>{formatDateDisplay(b.startTime)}</strong></p>
                    <p className="booking-meta">{formatTimeRangeDisplay(b.startTime, b.endTime)}</p>
                    <p>{b.service?.name} — {b.customer?.name}</p>
                  </IonCardContent>
                </IonCard>
              ))
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
}
