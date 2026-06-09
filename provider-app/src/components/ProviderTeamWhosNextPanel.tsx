import {
  IonBadge,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/react';
import { formatDateDisplay } from '../lib/date-format';
import { formatBookingBlockHeadline } from '../lib/booking-types';
import {
  formatTeamFloorChipLabel,
  teamFloorChipColor,
} from '../lib/provider-team-floor';
import {
  formatTeamWhosNextWindowLabel,
  type TeamWhosNextView,
} from '../lib/provider-team-whos-next';
import {
  formatVisitStatusLabel,
  visitStatusBadgeColor,
} from '../lib/provider-booking-visit-status';
import { useI18n } from '../i18n';
import './provider-team-whos-next.css';

interface ProviderTeamWhosNextPanelProps {
  queue?: TeamWhosNextView | null;
  isLoading?: boolean;
  businessCurrency?: string | null;
  onSelectBooking: (bookingId: string) => void;
}

export default function ProviderTeamWhosNextPanel({
  queue,
  isLoading,
  businessCurrency,
  onSelectBooking,
}: ProviderTeamWhosNextPanelProps) {
  const { t } = useI18n();

  if (!queue && !isLoading) {
    return null;
  }

  return (
    <section
      id="provider-team-whos-next-panel"
      className="provider-team-whos-next"
    >
      <div className="provider-team-whos-next-header">
        <h2 className="provider-team-whos-next-title">
          {t('provider.teamWhosNextTitle')}
        </h2>
        {queue ? (
          <p className="booking-meta">{formatTeamWhosNextWindowLabel(queue, t)}</p>
        ) : null}
      </div>

      {isLoading ? (
        <p className="booking-meta">{t('provider.teamWhosNextLoading')}</p>
      ) : !queue?.columns.length || queue.totalQueued === 0 ? (
        <p className="empty-state">{t('provider.teamWhosNextEmpty')}</p>
      ) : (
        queue.columns.map((column) => (
          <div key={column.employeeId} className="provider-team-whos-next-column">
            <div className="provider-team-whos-next-column-header">
              <h3>{column.employeeName}</h3>
              <p className="booking-meta">
                {t('provider.teamWhosNextQueueCount', { count: column.queue.length })}
              </p>
            </div>
            {column.queue.map((booking) => (
              <IonCard
                key={booking.id}
                button
                className={`provider-team-whos-next-card${
                  booking.isNext ? ' provider-team-whos-next-card--next' : ''
                }`}
                onClick={() => onSelectBooking(booking.id)}
              >
                <IonCardHeader>
                  <IonCardTitle className="appointment-block-title">
                    {formatBookingBlockHeadline({ ...booking, businessCurrency }, t)}
                    <span className="provider-team-whos-next-position">
                      #{booking.queuePosition}
                    </span>
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {booking.isNext ? (
                    <IonBadge color="primary">{t('provider.teamWhosNextBadge')}</IonBadge>
                  ) : null}
                  <IonBadge
                    color={teamFloorChipColor(booking.teamFloorStatus)}
                    style={{ marginLeft: booking.isNext ? 8 : 0 }}
                  >
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
