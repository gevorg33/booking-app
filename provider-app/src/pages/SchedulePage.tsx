import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import api, { unwrap } from '../services/api';
import { useAuthStore } from '../services/auth-store';
import { formatDateDisplay } from '../lib/date-format';
import { formatBookingBlockHeadline, type BookingSummary } from '../lib/booking-types';
import { useBusinessCurrency } from '../lib/use-business-currency';
import { isMobileManagerRole, isTeamView } from '../lib/provider-access';
import BookingDetailModal from '../components/BookingDetailModal';
import ProviderAiSuggestions from '../components/ProviderAiSuggestions';
import ProviderScheduleBlockForm from '../components/ProviderScheduleBlockForm';
import ProviderScheduleTimeOffForm from '../components/ProviderScheduleTimeOffForm';
import ProviderScheduleTimeOffList from '../components/ProviderScheduleTimeOffList';
import { useOperationalEvents } from '../lib/use-operational-events';
import { useProviderSelfBlockFormVisible } from '../lib/use-provider-self-block-enabled';
import { useProviderTimeOffFormVisible } from '../lib/use-provider-time-off-enabled';
import type { ProviderTimeOffRequestSummary } from '../lib/provider-time-off.util';
import { useI18n } from '../i18n';
import { ProviderTabPageShell } from '../components/ProviderTabPageShell';
import { ProviderTabScrollContent } from '../components/ProviderTabScrollContent';

export default function SchedulePage({ embedded = false }: { embedded?: boolean }) {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const { currency: businessCurrency } = useBusinessCurrency();
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
      return unwrap<{
        days: Array<{ date: string; available: number; booked: number }>;
        timeOffRequests?: ProviderTimeOffRequestSummary[];
      }>(res);
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
  const showSelfBlockForm = useProviderSelfBlockFormVisible();
  const showTimeOffForm = useProviderTimeOffFormVisible();

  return (
    <ProviderTabPageShell embedded={embedded}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            {isManagerView ? t('provider.scheduleAllAppointments') : t('provider.scheduleTitle')}
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <ProviderTabScrollContent className="ion-padding">
        {business?.id && (
          <>
            <ProviderAiSuggestions
              businessId={business.id}
              onSelectPrompt={(prompt) => {
                window.dispatchEvent(
                  new CustomEvent('provider:ai-prompt', { detail: { prompt } }),
                );
              }}
            />
            {showSelfBlockForm ? (
              <ProviderScheduleBlockForm
                businessId={business.id}
                onBlocked={refreshBookings}
              />
            ) : null}
            {showTimeOffForm ? (
              <ProviderScheduleTimeOffForm
                businessId={business.id}
                onSubmitted={refreshBookings}
              />
            ) : null}
            {showTimeOffForm ? (
              <ProviderScheduleTimeOffList
                businessId={business.id}
                requests={summary?.timeOffRequests ?? []}
                loading={loadingSummary}
              />
            ) : null}
          </>
        )}

        {isLoading ? (
          <div className="empty-state"><IonSpinner /></div>
        ) : (
          <>
            {summary?.days?.length ? (
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>{t('provider.availability')}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList lines="none">
                    {summary.days.map((d) => (
                      <IonItem key={d.date}>
                        <IonLabel>
                          <h3>{formatDateDisplay(d.date)}</h3>
                          <p>
                            {d.booked} {t('provider.booked')} · {d.available} {t('provider.open')}
                          </p>
                        </IonLabel>
                      </IonItem>
                    ))}
                  </IonList>
                </IonCardContent>
              </IonCard>
            ) : null}

            <h2 className="ion-padding-start">{t('provider.upcomingAppointments')}</h2>
            {!upcoming?.bookings?.length ? (
              <p className="empty-state">{t('provider.noUpcoming')}</p>
            ) : (
              upcoming.bookings.map((b) => (
                <IonCard key={b.id} button onClick={() => setSelectedId(b.id)}>
                  <IonCardContent>
                    <p className="booking-meta">{formatDateDisplay(b.startTime)}</p>
                    <p>
                      <strong>{formatBookingBlockHeadline({ ...b, businessCurrency }, t)}</strong>
                    </p>
                    <p>{b.service?.name} — {b.customer?.name}</p>
                    {b.employee && isTeamView(upcoming?.viewMode) && (
                      <p className="booking-meta">
                        {t('common.provider')}: {b.employee.name}
                      </p>
                    )}
                    <p className="booking-meta">{t('provider.tapToManage')}</p>
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
            onAiPrompt={(prompt) => {
              window.dispatchEvent(
                new CustomEvent('provider:ai-prompt', { detail: { prompt } }),
              );
            }}
          />
        )}
      </ProviderTabScrollContent>
    </ProviderTabPageShell>
  );
}
