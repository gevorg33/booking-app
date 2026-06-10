import {
  IonButton,
  IonCard,
  IonCardContent,
  IonSpinner,
} from '@ionic/react';
import { useQuery } from '@tanstack/react-query';
import api, { unwrap } from '../services/api';
import {
  buildFillGapAiPrompt,
  formatGapDurationLabel,
  type ProviderScheduleGapView,
} from '../lib/provider-open-shifts.util';
import { useI18n } from '../i18n';

export function ProviderCalendarGapsPanel({
  businessId,
  selectedDate,
  onFillGap,
}: {
  businessId: string;
  selectedDate: string;
  onFillGap: (prompt: string) => void;
}) {
  const { t } = useI18n();

  const { data, isLoading } = useQuery({
    queryKey: ['provider-schedule-gaps', businessId, selectedDate],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${businessId}/provider/schedule/gaps?date=${encodeURIComponent(selectedDate)}`,
      );
      return unwrap<{ gaps: ProviderScheduleGapView[] }>(res);
    },
    enabled: !!businessId && !!selectedDate,
  });

  if (isLoading) {
    return (
      <div className="empty-state">
        <IonSpinner />
      </div>
    );
  }

  if (!data?.gaps?.length) {
    return null;
  }

  return (
    <section aria-label={t('provider.openShiftsTitle')}>
      <h2 style={{ fontSize: '1.05rem', margin: '16px 0 8px' }}>
        {t('provider.openShiftsTitle')}
      </h2>
      <p className="booking-meta">{t('provider.openShiftsDescription')}</p>
      {data.gaps.map((gap) => (
        <IonCard
          key={`${gap.startTime}-${gap.endTime}`}
          className="provider-open-shift-gap"
          style={{
            borderLeft: '4px solid var(--ion-color-warning, #f59e0b)',
          }}
        >
          <IonCardContent>
            <p className="booking-meta">
              {gap.startTime} – {gap.endTime} · {formatGapDurationLabel(gap.durationMinutes)}{' '}
              {t('provider.openShiftsOpen')}
            </p>
            <IonButton
              expand="block"
              fill="outline"
              size="small"
              onClick={() =>
                onFillGap(buildFillGapAiPrompt(selectedDate, gap))
              }
            >
              {t('provider.openShiftsFillGap')}
            </IonButton>
          </IonCardContent>
        </IonCard>
      ))}
    </section>
  );
}
