import { useQuery } from '@tanstack/react-query';
import {
  IonBadge,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import api, { unwrap } from '../services/api';
import { useAuthStore } from '../services/auth-store';
import { formatDateDisplay, formatTimeRangeDisplay } from '../lib/date-format';
import { formatStatusLabel, STATUS_COLOR } from '../lib/booking-types';

interface BookingItem {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  service: { name: string } | null;
  customer: { name: string; phone: string | null; email: string | null } | null;
}

export default function TodayPage() {
  const { business, user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['provider-today', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${business!.id}/provider/bookings/today`);
      return unwrap<{ employee: { name: string }; bookings: BookingItem[] }>(res);
    },
    enabled: !!business?.id,
    refetchInterval: 60_000,
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            {user?.firstName ? `Hello, ${user.firstName}` : 'Today'}
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {data?.employee && <p className="booking-meta">{data.employee.name}</p>}

        {isLoading ? (
          <div className="empty-state"><IonSpinner /></div>
        ) : !data?.bookings?.length ? (
          <p className="empty-state">No appointments scheduled for today.</p>
        ) : (
          data.bookings.map((b) => (
            <IonCard key={b.id}>
              <IonCardHeader>
                <IonCardTitle>{formatTimeRangeDisplay(b.startTime, b.endTime)}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p className="booking-meta">{formatDateDisplay(b.startTime)}</p>
                <IonBadge color={STATUS_COLOR[b.status] ?? 'medium'}>{formatStatusLabel(b.status)}</IonBadge>
                {b.service && <p><strong>{b.service.name}</strong></p>}
                {b.customer && (
                  <>
                    <p>{b.customer.name}</p>
                    {b.customer.phone && (
                      <a className="contact-link" href={`tel:${b.customer.phone}`}>{b.customer.phone}</a>
                    )}
                    {b.customer.email && (
                      <a className="contact-link" href={`mailto:${b.customer.email}`}>{b.customer.email}</a>
                    )}
                  </>
                )}
                {b.notes && <p className="booking-meta">{b.notes}</p>}
              </IonCardContent>
            </IonCard>
          ))
        )}
      </IonContent>
    </IonPage>
  );
}
