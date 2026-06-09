import {
  IonBadge,
  IonButton,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { useQuery } from '@tanstack/react-query';
import api, { unwrap } from '../services/api';
import { formatDateDisplay } from '../lib/date-format';
import { buildProviderDashboardUrl } from '../lib/provider-dashboard-url';
import type { ProviderPreVisitIntakeSummary } from '../lib/provider-booking-pre-visit-intake.types';
import { useI18n } from '../i18n';

interface BookingPreVisitIntakeSectionProps {
  businessId: string;
  bookingId: string;
}

function intakeStatusLabelKey(
  status: ProviderPreVisitIntakeSummary['status'],
): string {
  if (status === 'none') return 'provider.preVisitIntakeStatusNone';
  return `provider.preVisitIntakeStatus.${status}`;
}

export default function BookingPreVisitIntakeSection({
  businessId,
  bookingId,
}: BookingPreVisitIntakeSectionProps) {
  const { t } = useI18n();

  const { data, isLoading } = useQuery({
    queryKey: ['provider-booking-pre-visit-intake', businessId, bookingId],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${businessId}/provider/bookings/${bookingId}/pre-visit-intake-summary`,
      );
      return unwrap<ProviderPreVisitIntakeSummary>(res);
    },
    enabled: !!businessId && !!bookingId,
  });

  if (isLoading) {
    return (
      <div className="ion-margin-bottom empty-state">
        <IonSpinner name="crescent" />
      </div>
    );
  }

  if (!data?.visible) return null;

  const dashboardLink = data.dashboardFullAnswers?.canOpen
    ? buildProviderDashboardUrl(data.dashboardFullAnswers.path)
    : null;

  return (
    <div className="ion-margin-bottom booking-pre-visit-intake">
      <h3>{t('provider.preVisitIntakeTitle')}</h3>
      <IonText color="medium">
        <p className="booking-meta">{t('provider.preVisitIntakeReadOnlyNotice')}</p>
      </IonText>

      <div className="booking-pre-visit-intake__meta">
        {data.questionnaireTitle && (
          <IonText>
            <p className="booking-meta">
              <strong>{data.questionnaireTitle}</strong>
            </p>
          </IonText>
        )}
        <IonBadge
          color={data.status === 'completed' ? 'success' : 'medium'}
          className="booking-pre-visit-intake__badge"
        >
          {t(intakeStatusLabelKey(data.status))}
        </IonBadge>
        {data.completedAt && (
          <IonText color="medium">
            <p className="booking-meta">
              {t('provider.preVisitIntakeCompletedAt', {
                date: formatDateDisplay(data.completedAt),
              })}
            </p>
          </IonText>
        )}
      </div>

      {data.status === 'none' ? (
        <IonText color="medium">
          <p className="booking-meta">{t('provider.preVisitIntakeNotStarted')}</p>
        </IonText>
      ) : data.answers.length === 0 ? (
        <IonText color="medium">
          <p className="booking-meta">{t('provider.preVisitIntakeNoAnswersYet')}</p>
        </IonText>
      ) : (
        <ul className="booking-pre-visit-intake__answers">
          {data.answers.map((row) => (
            <li key={row.questionId} className="booking-pre-visit-intake__answer">
              <span className="booking-pre-visit-intake__question">
                {row.questionText}
              </span>
              <span className="booking-pre-visit-intake__answer-text">
                {row.answerText}
              </span>
            </li>
          ))}
        </ul>
      )}

      {data.hasMoreAnswers && (
        <IonText color="medium">
          <p className="booking-meta">
            {t('provider.preVisitIntakeMoreAnswers', {
              count: data.totalAnswerCount - data.answers.length,
            })}
          </p>
        </IonText>
      )}

      {dashboardLink && (
        <IonButton
          expand="block"
          fill="outline"
          className="ion-margin-top"
          href={dashboardLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('provider.preVisitIntakeOpenDashboard')}
        </IonButton>
      )}
    </div>
  );
}
