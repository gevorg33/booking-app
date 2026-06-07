import { IonSpinner, IonText } from '@ionic/react';
import { useQuery } from '@tanstack/react-query';
import {
  type BookingLabResultSummary,
  type ClinicLabStatusBadgeKind,
} from '@booking-lib/clinic-lab-state';
import api from '../services/api';
import { useI18n } from '../i18n';
import { ClinicLabStatusBadge, ClinicLabStatusBadgeCaption } from './ClinicLabStatusBadge';

export interface BookingLabResultsSectionProps {
  businessId: string;
  bookingId: string;
  results?: BookingLabResultSummary[];
}

function ResultStatusBadges({ result }: { result: BookingLabResultSummary }) {
  const { t } = useI18n();
  const badges: Array<{ kind: ClinicLabStatusBadgeKind; status: string; label: string }> =
    [
      {
        kind: 'order',
        status: result.orderStatus,
        label: t('clinic.labState.resultsTab.order'),
      },
    ];

  if (result.specimenStatus) {
    badges.push({
      kind: 'specimen',
      status: result.specimenStatus,
      label: t('clinic.labState.resultsTab.specimen'),
    });
  }
  if (result.resultStatus) {
    badges.push({
      kind: 'result',
      status: result.resultStatus,
      label: t('clinic.labState.resultsTab.result'),
    });
  }
  if (result.measurementFlag) {
    badges.push({
      kind: 'measurement',
      status: result.measurementFlag,
      label: t('clinic.labState.resultsTab.measurement'),
    });
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        marginTop: '8px',
      }}
    >
      {badges.map(({ kind, status, label }) => (
        <div
          key={`${kind}-${status}`}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ClinicLabStatusBadgeCaption>{label}</ClinicLabStatusBadgeCaption>
          <ClinicLabStatusBadge kind={kind} status={status} />
        </div>
      ))}
    </div>
  );
}

export function BookingLabResultsSection({
  businessId,
  bookingId,
  results,
}: BookingLabResultsSectionProps) {
  const { t } = useI18n();

  const { data: fetchedResults, isLoading } = useQuery({
    queryKey: ['clinic-booking-lab-summaries', businessId, bookingId],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/clinic-test-results/bookings/${bookingId}/summaries`,
      );
      const payload = data.data ?? data;
      return (Array.isArray(payload) ? payload : payload?.data ?? []) as BookingLabResultSummary[];
    },
    enabled: !!businessId && !!bookingId && results === undefined,
  });

  const rows = results ?? fetchedResults ?? [];

  return (
    <section className="booking-lab-results ion-margin-vertical">
      <h3 style={{ marginTop: 0 }}>{t('clinic.labState.resultsTab.title')}</h3>
      {isLoading && results === undefined ? (
        <IonSpinner name="crescent" />
      ) : rows.length === 0 ? (
        <IonText color="medium">
          <p style={{ marginBottom: 0 }}>{t('clinic.labState.resultsTab.empty')}</p>
        </IonText>
      ) : (
        <ul
          className="booking-lab-results__list"
          style={{ listStyle: 'none', padding: 0, margin: 0 }}
        >
          {rows.map((result) => (
            <li
              key={result.id}
              className="booking-lab-results__item"
              style={{
                border: '1px solid var(--ion-color-step-150)',
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '12px',
              }}
            >
              <strong>{result.testName}</strong>
              <ResultStatusBadges result={result} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
