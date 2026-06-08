import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import api, { unwrap } from '../services/api';
import { useAuthStore } from '../services/auth-store';
import { formatDateDisplay, formatTimeDisplay, getTodayDateKey } from '../lib/date-format';
import { formatBookingBlockHeadline, type BookingSummary } from '../lib/booking-types';
import { useBusinessCurrency } from '../lib/use-business-currency';
import { isTeamView } from '../lib/provider-access';
import BookingDetailModal from '../components/BookingDetailModal';
import { ProviderCalendarMonth } from '../components/ProviderCalendarMonth';
import { groupBookingCountsByDate, fetchProviderBookingsByDate } from '../lib/provider-profile';
import { monthKeyFromDateKey } from '../lib/date-picker-calendar.util';
import { useOperationalEvents } from '../lib/use-operational-events';
import { useI18n } from '../i18n';

export default function CalendarPage() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const { currency: businessCurrency } = useBusinessCurrency();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(getTodayDateKey());
  const [monthKey, setMonthKey] = useState(monthKeyFromDateKey(getTodayDateKey()));
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['provider-upcoming', business?.id] });
    void queryClient.invalidateQueries({ queryKey: ['provider-calendar-day', business?.id] });
    void queryClient.invalidateQueries({ queryKey: ['provider-booking'] });
  }, [business?.id, queryClient]);

  useOperationalEvents(business?.id, (type) => {
    if (type.startsWith('booking.')) refresh();
  });

  const { data: upcoming } = useQuery({
    queryKey: ['provider-upcoming', business?.id, 'calendar'],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${business!.id}/provider/bookings/upcoming?days=62`,
      );
      return unwrap<{ viewMode?: 'provider' | 'admin'; bookings: BookingSummary[] }>(res);
    },
    enabled: !!business?.id,
  });

  const appointmentCountsByDate = useMemo(
    () => groupBookingCountsByDate(upcoming?.bookings ?? []),
    [upcoming?.bookings],
  );

  const { data: dayBookings, isLoading } = useQuery({
    queryKey: ['provider-calendar-day', business?.id, selectedDate],
    queryFn: () => fetchProviderBookingsByDate(business!.id, selectedDate),
    enabled: !!business?.id && !!selectedDate,
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('provider.calendarTitle')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardContent>
            <ProviderCalendarMonth
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              monthKey={monthKey}
              onMonthKeyChange={setMonthKey}
              appointmentCountsByDate={appointmentCountsByDate}
            />
          </IonCardContent>
        </IonCard>

        <h2 style={{ fontSize: '1.05rem', margin: '16px 0 8px' }}>
          {formatDateDisplay(selectedDate)}
        </h2>
        <p className="booking-meta">{t('provider.calendarSelectDay')}</p>

        {isLoading ? (
          <div className="empty-state">
            <IonSpinner />
          </div>
        ) : !dayBookings?.bookings?.length ? (
          <p className="empty-state">{t('provider.calendarNoAppointments')}</p>
        ) : (
          dayBookings.bookings.map((booking) => (
            <IonCard key={booking.id} button onClick={() => setSelectedBookingId(booking.id)}>
              <IonCardContent>
                <p className="booking-meta">{formatTimeDisplay(booking.startTime)}</p>
                <p>
                  <strong>{formatBookingBlockHeadline({ ...booking, businessCurrency }, t)}</strong>
                </p>
                <p>
                  {booking.service?.name} — {booking.customer?.name}
                </p>
                {booking.employee && isTeamView(dayBookings.viewMode) ? (
                  <p className="booking-meta">
                    {t('common.provider')}: {booking.employee.name}
                  </p>
                ) : null}
              </IonCardContent>
            </IonCard>
          ))
        )}

        {business?.id ? (
          <BookingDetailModal
            businessId={business.id}
            bookingId={selectedBookingId}
            onClose={() => setSelectedBookingId(null)}
          />
        ) : null}
      </IonContent>
    </IonPage>
  );
}
