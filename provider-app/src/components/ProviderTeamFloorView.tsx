import { useMemo, useState } from 'react';
import {
  IonBadge,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import { formatDateDisplay } from '../lib/date-format';
import { formatBookingBlockHeadline } from '../lib/booking-types';
import {
  ALL_TEAM_FLOOR_PROVIDERS_FILTER,
  formatTeamFloorChipLabel,
  formatTeamFloorStatusSummary,
  teamFloorChipColor,
  type TeamFloorTodayView,
} from '../lib/provider-team-floor';
import {
  formatVisitStatusLabel,
  visitStatusBadgeColor,
} from '../lib/provider-booking-visit-status';
import { useI18n } from '../i18n';
import './provider-team-floor.css';

interface ProviderTeamFloorViewProps {
  floor?: TeamFloorTodayView | null;
  isLoading?: boolean;
  businessCurrency?: string | null;
  onSelectBooking: (bookingId: string) => void;
  onFilterChange: (employeeId: string | null) => void;
}

export default function ProviderTeamFloorView({
  floor,
  isLoading,
  businessCurrency,
  onSelectBooking,
  onFilterChange,
}: ProviderTeamFloorViewProps) {
  const { t } = useI18n();
  const [filterValue, setFilterValue] = useState(
    floor?.filterEmployeeId ?? ALL_TEAM_FLOOR_PROVIDERS_FILTER,
  );

  const selectedFilter = useMemo(
    () => (filterValue === ALL_TEAM_FLOOR_PROVIDERS_FILTER ? null : filterValue),
    [filterValue],
  );

  if (!floor && !isLoading) {
    return null;
  }

  return (
    <section className="provider-team-floor">
      <div className="provider-team-floor-header">
        <h2 className="provider-team-floor-title">{t('provider.teamFloorTitle')}</h2>
        {floor?.providers?.length ? (
          <IonItem lines="none" className="provider-team-floor-filter">
            <IonLabel>{t('provider.teamFloorFilterProvider')}</IonLabel>
            <IonSelect
              interface="popover"
              value={selectedFilter ?? ALL_TEAM_FLOOR_PROVIDERS_FILTER}
              onIonChange={(event) => {
                const next = String(event.detail.value ?? ALL_TEAM_FLOOR_PROVIDERS_FILTER);
                setFilterValue(next);
                onFilterChange(next === ALL_TEAM_FLOOR_PROVIDERS_FILTER ? null : next);
              }}
            >
              <IonSelectOption value={ALL_TEAM_FLOOR_PROVIDERS_FILTER}>
                {t('provider.teamFloorAllProviders')}
              </IonSelectOption>
              {floor.providers.map((provider) => (
                <IonSelectOption key={provider.id} value={provider.id}>
                  {provider.name}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        ) : null}
      </div>

      {isLoading ? (
        <p className="booking-meta">{t('provider.teamFloorLoading')}</p>
      ) : !floor?.columns.length ? (
        <p className="empty-state">{t('provider.noAppointmentsToday')}</p>
      ) : (
        floor.columns.map((column) => (
          <div key={column.employeeId} className="provider-team-floor-column">
            <div className="provider-team-floor-column-header">
              <h3>{column.employeeName}</h3>
              <p className="booking-meta">
                {formatTeamFloorStatusSummary(column.statusCounts, t)}
              </p>
            </div>
            {column.bookings.map((booking) => (
              <IonCard
                key={booking.id}
                button
                className="provider-team-floor-card"
                onClick={() => onSelectBooking(booking.id)}
              >
                <IonCardHeader>
                  <IonCardTitle className="appointment-block-title">
                    {formatBookingBlockHeadline({ ...booking, businessCurrency }, t)}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonBadge color={teamFloorChipColor(booking.teamFloorStatus)}>
                    {formatTeamFloorChipLabel(booking.teamFloorStatus, t)}
                  </IonBadge>
                  {booking.visitStatus ? (
                    <IonBadge
                      color={visitStatusBadgeColor(booking.visitStatus.kind)}
                      style={{ marginLeft: 8 }}
                    >
                      {formatVisitStatusLabel(booking.visitStatus, t)}
                    </IonBadge>
                  ) : null}
                  <p className="booking-meta">{formatDateDisplay(booking.startTime)}</p>
                  {booking.service ? <p><strong>{booking.service.name}</strong></p> : null}
                  {booking.customer ? (
                    <>
                      <p>{booking.customer.name}</p>
                      {booking.customer.phone ? (
                        <a
                          className="contact-link"
                          href={`tel:${booking.customer.phone}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          {booking.customer.phone}
                        </a>
                      ) : null}
                    </>
                  ) : null}
                  <p className="booking-meta">{t('provider.tapToManage')}</p>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        ))
      )}
    </section>
  );
}
