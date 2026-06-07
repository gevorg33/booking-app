import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSpinner,
} from '@ionic/react';
import { useI18n } from '../i18n';
import { formatDateDisplay, formatTimeDisplay } from '../lib/date-format';
import type { ProviderLabResultItem } from '../lib/provider-lab-results';
import { ClinicLabStatusBadge } from './ClinicLabStatusBadge';

export interface ProviderLabResultsListProps {
  results: ProviderLabResultItem[];
  loading: boolean;
  showEmployeeName: boolean;
  onSelectBooking: (bookingId: string) => void;
}

export function ProviderLabResultsList({
  results,
  loading,
  showEmployeeName,
  onSelectBooking,
}: ProviderLabResultsListProps) {
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="empty-state">
        <IonSpinner />
      </div>
    );
  }

  if (!results.length) {
    return <p className="empty-state">{t('provider.labResultsEmpty')}</p>;
  }

  return (
    <>
      {results.map((result) => (
        <IonCard
          key={result.id}
          button={!!result.bookingId}
          onClick={() => {
            if (result.bookingId) onSelectBooking(result.bookingId);
          }}
        >
          <IonCardHeader>
            <IonCardTitle>
              {result.testName ?? t('clinic.labState.resultsTab.unnamedResult')}
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              {result.orderStatus ? (
                <ClinicLabStatusBadge kind="order" status={result.orderStatus} />
              ) : null}
              <ClinicLabStatusBadge kind="result" status={result.status} />
              {result.measurementFlag ? (
                <ClinicLabStatusBadge kind="measurement" status={result.measurementFlag} />
              ) : null}
            </div>
            {result.customerName && <p>{result.customerName}</p>}
            {result.bookingStartTime && (
              <p className="booking-meta">
                {formatDateDisplay(result.bookingStartTime)}{' '}
                {formatTimeDisplay(result.bookingStartTime)}
              </p>
            )}
            {result.department && <p className="booking-meta">{result.department}</p>}
            {showEmployeeName && result.employeeName && (
              <p className="booking-meta">
                {t('common.provider')}: {result.employeeName}
              </p>
            )}
            {result.bookingId && (
              <p className="booking-meta">{t('provider.labResultsTapBooking')}</p>
            )}
          </IonCardContent>
        </IonCard>
      ))}
    </>
  );
}
