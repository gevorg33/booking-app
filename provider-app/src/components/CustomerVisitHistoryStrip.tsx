import { IonText } from '@ionic/react';
import { useIonActionSheet } from '@ionic/react';
import { formatDateDisplay } from '../lib/date-format';
import type {
  ProviderBookingCompletedVisit,
  ProviderBookingCustomerContext,
} from '../lib/provider-booking-customer-context.types';
import { useI18n } from '../i18n';

interface CustomerVisitHistoryStripProps {
  context: ProviderBookingCustomerContext;
  onViewBooking: (bookingId: string) => void;
  onAiPrompt?: (prompt: string) => void;
}

export default function CustomerVisitHistoryStrip({
  context,
  onViewBooking,
  onAiPrompt,
}: CustomerVisitHistoryStripProps) {
  const { t } = useI18n();
  const [presentActionSheet] = useIonActionSheet();
  const visits = context.recentCompletedVisits ?? [];

  if (visits.length === 0) {
    return (
      <div className="ion-margin-bottom visit-history-strip">
        <h3>{t('provider.visitHistoryTitle')}</h3>
        <IonText color="medium">
          <p className="booking-meta">{t('provider.visitHistoryEmpty')}</p>
        </IonText>
      </div>
    );
  }

  const openVisitActions = (visit: ProviderBookingCompletedVisit) => {
    const buttons = [
      {
        text: t('provider.visitHistoryViewAppointment'),
        handler: () => onViewBooking(visit.bookingId),
      },
      ...(onAiPrompt
        ? [
            {
              text: t('provider.visitHistorySummarizeClient'),
              handler: () => {
                onAiPrompt(
                  t('provider.visitHistorySummarizePrompt', {
                    name: context.name,
                  }),
                );
              },
            },
          ]
        : []),
      { text: t('provider.dismiss'), role: 'cancel' as const },
    ];

    presentActionSheet({
      header: visit.serviceName,
      cssClass: 'provider-picker-sheet',
      buttons,
    });
  };

  return (
    <div className="ion-margin-bottom visit-history-strip">
      <div className="visit-history-strip__header">
        <h3>{t('provider.visitHistoryTitle')}</h3>
        {onAiPrompt && (
          <button
            type="button"
            className="ai-assistant-example visit-history-strip__summarize"
            onClick={() =>
              onAiPrompt(
                t('provider.visitHistorySummarizePrompt', { name: context.name }),
              )
            }
          >
            {t('provider.visitHistorySummarizeClient')}
          </button>
        )}
      </div>
      <div className="visit-history-strip__scroll">
        {visits.map((visit) => (
          <button
            key={visit.bookingId}
            type="button"
            className="visit-history-strip__item"
            onClick={() => openVisitActions(visit)}
          >
            <span className="visit-history-strip__service">{visit.serviceName}</span>
            <span className="visit-history-strip__meta">
              {visit.providerName} · {formatDateDisplay(visit.completedAt)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
