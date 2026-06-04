import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
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
import { formatDateDisplay, todayDisplay } from '../lib/date-format';
import { formatBookingBlockHeadline, type BookingSummary } from '../lib/booking-types';
import { isTeamView } from '../lib/provider-access';
import BookingDetailModal from '../components/BookingDetailModal';
import ProviderAiAssistant from '../components/ProviderAiAssistant';
import ProviderAiSuggestions from '../components/ProviderAiSuggestions';
import { useOperationalEvents } from '../lib/use-operational-events';
import { buildProviderAiScreenContext } from '../lib/provider-ai-context';
import { useI18n } from '../i18n';

export default function TodayPage() {
  const { t } = useI18n();
  const { business, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [seedPrompt, setSeedPrompt] = useState<string | null>(null);

  const refreshBookings = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['provider-today', business?.id] });
    void queryClient.invalidateQueries({ queryKey: ['provider-upcoming', business?.id] });
    void queryClient.invalidateQueries({ queryKey: ['provider-schedule-summary', business?.id] });
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

  const { data, isLoading } = useQuery({
    queryKey: ['provider-today', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${business!.id}/provider/bookings/today`);
      return unwrap<{
        viewMode: 'provider' | 'team' | 'admin' | 'owner';
        employee: { name: string } | null;
        bookings: BookingSummary[];
      }>(res);
    },
    enabled: !!business?.id,
    refetchInterval: 60_000,
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            {user?.firstName
              ? t('provider.helloName', { name: user.firstName })
              : t('provider.today')}
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {business?.id && (
          <>
            <ProviderAiSuggestions
              businessId={business.id}
              onSelectPrompt={(prompt) => setSeedPrompt(prompt)}
            />
            <ProviderAiAssistant
              businessId={business.id}
              seedPrompt={seedPrompt}
              onSeedPromptConsumed={() => setSeedPrompt(null)}
              screenContext={buildProviderAiScreenContext(
                'today',
                { date: todayDisplay() },
                data?.bookings ?? [],
                selectedId,
              )}
            />
          </>
        )}

        {isTeamView(data?.viewMode) ? (
          <p className="booking-meta">{t('provider.teamTodayLabel')}</p>
        ) : (
          data?.employee && <p className="booking-meta">{data.employee.name}</p>
        )}

        {isLoading ? (
          <div className="empty-state"><IonSpinner /></div>
        ) : !data?.bookings?.length ? (
          <p className="empty-state">{t('provider.noAppointmentsToday')}</p>
        ) : (
          data.bookings.map((b) => (
            <IonCard key={b.id} button onClick={() => setSelectedId(b.id)}>
              <IonCardHeader>
                <IonCardTitle className="appointment-block-title">
                  {formatBookingBlockHeadline(b, t)}
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p className="booking-meta">{formatDateDisplay(b.startTime)}</p>
                {b.employee && isTeamView(data?.viewMode) && (
                  <p className="booking-meta">
                    {t('common.provider')}: {b.employee.name}
                  </p>
                )}
                {b.service && <p><strong>{b.service.name}</strong></p>}
                {b.customer && (
                  <>
                    <p>{b.customer.name}</p>
                    {b.customer.phone && (
                      <a className="contact-link" href={`tel:${b.customer.phone}`} onClick={(e) => e.stopPropagation()}>{b.customer.phone}</a>
                    )}
                    {b.customer.email && (
                      <a className="contact-link" href={`mailto:${b.customer.email}`} onClick={(e) => e.stopPropagation()}>{b.customer.email}</a>
                    )}
                  </>
                )}
                {b.notes && <p className="booking-meta">{b.notes}</p>}
                <p className="booking-meta">{t('provider.tapToManage')}</p>
              </IonCardContent>
            </IonCard>
          ))
        )}

        {business?.id && (
          <BookingDetailModal
            businessId={business.id}
            bookingId={selectedId}
            onClose={() => setSelectedId(null)}
            onAiPrompt={(prompt) => setSeedPrompt(prompt)}
          />
        )}
      </IonContent>
    </IonPage>
  );
}
