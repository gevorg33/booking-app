import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IonBadge,
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
import { formatDateDisplay } from '../lib/date-format';
import { formatBookingBlockHeadline, type BookingSummary } from '../lib/booking-types';
import {
  floorStatusColor,
  formatFloorStatusLabel,
  type ProviderBookingFloorStatus,
} from '../lib/provider-booking-check-in';
import {
  formatVisitStatusLabel,
  visitStatusBadgeColor,
} from '../lib/provider-booking-visit-status';
import type { ProviderTodayTimelineView } from '../lib/provider-booking-today-timeline';
import { useBusinessCurrency } from '../lib/use-business-currency';
import { isMobileManagerRole, isTeamView } from '../lib/provider-access';
import type { TeamFloorTodayView } from '../lib/provider-team-floor';
import type { TeamWhosNextView } from '../lib/provider-team-whos-next';
import BookingDetailModal from '../components/BookingDetailModal';
import ProviderTodayTimeline from '../components/ProviderTodayTimeline';
import ProviderTeamFloorView from '../components/ProviderTeamFloorView';
import ProviderTeamWhosNextPanel from '../components/ProviderTeamWhosNextPanel';
import ProviderAiSuggestions from '../components/ProviderAiSuggestions';
import { ProviderOfflineBanner } from '../components/ProviderOfflineBanner';
import { useOperationalEvents } from '../lib/use-operational-events';
import { useI18n } from '../i18n';
import { ProviderTabPageShell } from '../components/ProviderTabPageShell';
import { ProviderTabScrollContent } from '../components/ProviderTabScrollContent';
import { PROVIDER_OPEN_BOOKING_EVENT, PROVIDER_TEAM_WHOS_NEXT_EVENT } from '../lib/provider-push-deep-link.util';

export default function TodayPage({ embedded = false }: { embedded?: boolean }) {
  const { t } = useI18n();
  const { business, user } = useAuthStore();
  const { currency: businessCurrency } = useBusinessCurrency();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [floorFilterEmployeeId, setFloorFilterEmployeeId] = useState<string | null>(null);
  const teamWhosNextRef = useRef<HTMLDivElement | null>(null);
  const isManagerView = isMobileManagerRole(business?.membershipRole);

  useEffect(() => {
    const bookingId = new URLSearchParams(location.search).get('bookingId');
    if (bookingId) setSelectedId(bookingId);
  }, [location.search]);

  useEffect(() => {
    const onOpenBooking = (e: Event) => {
      const bookingId = (e as CustomEvent<{ bookingId?: string }>).detail?.bookingId;
      if (bookingId) setSelectedId(bookingId);
    };
    window.addEventListener(PROVIDER_OPEN_BOOKING_EVENT, onOpenBooking);
    return () => window.removeEventListener(PROVIDER_OPEN_BOOKING_EVENT, onOpenBooking);
  }, []);

  useEffect(() => {
    const scrollToTeamWhosNext = () => {
      teamWhosNextRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.addEventListener(PROVIDER_TEAM_WHOS_NEXT_EVENT, scrollToTeamWhosNext);
    return () => window.removeEventListener(PROVIDER_TEAM_WHOS_NEXT_EVENT, scrollToTeamWhosNext);
  }, []);

  const refreshBookings = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['provider-today', business?.id] });
    void queryClient.invalidateQueries({ queryKey: ['provider-team-floor', business?.id] });
    void queryClient.invalidateQueries({ queryKey: ['provider-team-whos-next', business?.id] });
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
    enabled: !!business?.id && !isManagerView,
    refetchInterval: 60_000,
  });

  const { data: teamFloor, isLoading: loadingTeamFloor } = useQuery({
    queryKey: ['provider-team-floor', business?.id, floorFilterEmployeeId],
    queryFn: async () => {
      const params = floorFilterEmployeeId
        ? `?employeeId=${encodeURIComponent(floorFilterEmployeeId)}`
        : '';
      const { data: res } = await api.get(
        `/businesses/${business!.id}/provider/floor/today${params}`,
      );
      return unwrap<TeamFloorTodayView>(res);
    },
    enabled: !!business?.id && isManagerView,
    refetchInterval: 60_000,
  });

  const { data: teamWhosNext, isLoading: loadingTeamWhosNext } = useQuery({
    queryKey: ['provider-team-whos-next', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${business!.id}/provider/floor/whos-next`,
      );
      return unwrap<TeamWhosNextView>(res);
    },
    enabled: !!business?.id && isManagerView,
    refetchInterval: 60_000,
  });

  const { data: scheduleSummary } = useQuery({
    queryKey: ['provider-schedule-summary', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${business!.id}/provider/schedule/summary?days=14`,
      );
      return unwrap<{ todayTimeline?: ProviderTodayTimelineView | null }>(res);
    },
    enabled: !!business?.id,
    refetchInterval: 60_000,
  });

  return (
    <ProviderTabPageShell embedded={embedded}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            {user?.firstName
              ? t('provider.helloName', { name: user.firstName })
              : t('provider.today')}
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <ProviderTabScrollContent className="ion-padding">
        <ProviderOfflineBanner />
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
          </>
        )}

        {isManagerView || isTeamView(data?.viewMode) ? (
          <p className="booking-meta">{t('provider.teamTodayLabel')}</p>
        ) : (
          data?.employee && <p className="booking-meta">{data.employee.name}</p>
        )}

        <ProviderTodayTimeline
          timeline={scheduleSummary?.todayTimeline}
          onSelectBooking={setSelectedId}
        />

        {isManagerView ? (
          <div ref={teamWhosNextRef}>
            <ProviderTeamWhosNextPanel
              queue={teamWhosNext}
              isLoading={loadingTeamWhosNext}
              businessCurrency={businessCurrency}
              onSelectBooking={setSelectedId}
            />
          </div>
        ) : null}

        {isManagerView ? (
          <ProviderTeamFloorView
            floor={teamFloor}
            isLoading={loadingTeamFloor}
            businessCurrency={businessCurrency}
            onSelectBooking={setSelectedId}
            onFilterChange={setFloorFilterEmployeeId}
          />
        ) : isLoading ? (
          <div className="empty-state"><IonSpinner /></div>
        ) : !data?.bookings?.length ? (
          <p className="empty-state">{t('provider.noAppointmentsToday')}</p>
        ) : (
          data.bookings.map((b) => (
            <IonCard key={b.id} button onClick={() => setSelectedId(b.id)}>
              <IonCardHeader>
                <IonCardTitle className="appointment-block-title">
                  {formatBookingBlockHeadline({ ...b, businessCurrency }, t)}
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {b.floorStatus ? (
                  <IonBadge color={floorStatusColor(b.floorStatus as ProviderBookingFloorStatus)}>
                    {formatFloorStatusLabel(b.floorStatus as ProviderBookingFloorStatus, t)}
                  </IonBadge>
                ) : null}
                {b.visitStatus ? (
                  <IonBadge
                    color={visitStatusBadgeColor(b.visitStatus.kind)}
                    style={{ marginLeft: 8 }}
                  >
                    {formatVisitStatusLabel(b.visitStatus, t)}
                  </IonBadge>
                ) : null}
                <p className="booking-meta">{formatDateDisplay(b.startTime)}</p>
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
