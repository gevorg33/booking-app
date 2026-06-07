import { IonSpinner } from '@ionic/react';
import { consumerCopyForLocale } from '../lib/copy.js';
import { formatDateDisplay } from '../lib/date-format.js';
import {
  formatClinicMeasurementFlagLabel,
  formatClinicResultStatusLabel,
  getClinicMeasurementFlagChipClass,
  getClinicResultStatusChipClass,
} from '../lib/clinic-lab-state.js';
import {
  formatReleasedClinicMeasurementValue,
  hasReleasedClinicResultMeasurements,
  isReleasedClinicResultStatus,
  type PublicCustomerReleasedClinicResult,
} from '../lib/public-clinic-results.js';

export interface ConsumerMyResultsListProps {
  results: PublicCustomerReleasedClinicResult[];
  loading: boolean;
  error: string | null;
  locale: string;
}

export function ConsumerMyResultsList({
  results,
  loading,
  error,
  locale,
}: ConsumerMyResultsListProps) {
  const copy = consumerCopyForLocale(locale);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
        <IonSpinner />
      </div>
    );
  }

  if (error) {
    return <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{error}</p>;
  }

  if (results.length === 0) {
    return (
      <div className="salon-card" style={{ textAlign: 'center' }}>
        <p style={{ color: '#6b7280' }}>{copy.myResultsEmpty}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {results.map((result) => (
        <article key={result.id} className="salon-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontWeight: 600 }}>
                {result.testName ?? copy.myResultsUnnamed}
              </h2>
              {result.releasedAt ? (
                <p style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: 8 }}>
                  {copy.myResultsReleasedOn}{' '}
                  {formatDateDisplay(result.releasedAt, locale)}
                </p>
              ) : null}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 8,
                flexShrink: 0,
              }}
            >
              {isReleasedClinicResultStatus(result.status) ? (
                <span className={getClinicResultStatusChipClass(result.status)}>
                  {formatClinicResultStatusLabel(result.status, locale)}
                </span>
              ) : null}
              {result.measurementFlag ? (
                <span className={getClinicMeasurementFlagChipClass(result.measurementFlag)}>
                  {formatClinicMeasurementFlagLabel(result.measurementFlag, locale)}
                </span>
              ) : null}
            </div>
          </div>
          {hasReleasedClinicResultMeasurements(result) ? (
            <div style={{ marginTop: 16, overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 420, fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f3f4f6', color: '#6b7280' }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px 8px 0' }}>
                      {copy.myResultsMeasurement}
                    </th>
                    <th style={{ textAlign: 'left', padding: '8px 12px 8px 0' }}>
                      {copy.myResultsValue}
                    </th>
                    <th style={{ textAlign: 'left', padding: '8px 12px 8px 0' }}>
                      {copy.myResultsReferenceRange}
                    </th>
                    <th style={{ textAlign: 'left', padding: '8px 0' }}>
                      {copy.myResultsFlag}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.measurements.map((measurement) => {
                    const formattedValue = formatReleasedClinicMeasurementValue(measurement);
                    return (
                      <tr
                        key={measurement.id}
                        style={{ borderBottom: '1px solid #f9fafb', verticalAlign: 'top' }}
                      >
                        <td style={{ padding: '8px 12px 8px 0' }}>{measurement.name}</td>
                        <td style={{ padding: '8px 12px 8px 0' }}>
                          {formattedValue ?? '—'}
                        </td>
                        <td style={{ padding: '8px 12px 8px 0', color: '#4b5563' }}>
                          {measurement.referenceRange ?? '—'}
                        </td>
                        <td style={{ padding: '8px 0' }}>
                          {measurement.measurementFlag ? (
                            <span
                              className={getClinicMeasurementFlagChipClass(
                                measurement.measurementFlag,
                              )}
                            >
                              {formatClinicMeasurementFlagLabel(
                                measurement.measurementFlag,
                                locale,
                              )}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
