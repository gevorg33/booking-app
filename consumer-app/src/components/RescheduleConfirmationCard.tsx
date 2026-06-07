import { formatDateTimeLabel } from '../lib/date-format.js';
import { consumerCopyForLocale, formatCopy } from '../lib/copy.js';

/** Post-reschedule confirmation — old vs new time (web manage parity). */
export function RescheduleConfirmationCard({
  previousStartTime,
  newStartTime,
  locale = 'en',
}: {
  previousStartTime: string;
  newStartTime: string;
  locale?: string;
}) {
  const copy = consumerCopyForLocale(locale);
  const from = formatDateTimeLabel(previousStartTime, locale);
  const to = formatDateTimeLabel(newStartTime, locale);

  return (
    <div
      className="salon-card"
      style={{
        marginTop: 12,
        borderLeft: '4px solid var(--tenant-primary)',
        background: '#f5f3ff',
      }}
      role="status"
    >
      <p style={{ fontWeight: 600, marginBottom: 8 }}>{copy.rescheduleUpdatedTitle}</p>
      <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: 8 }}>
        {formatCopy(copy.rescheduleSuccessDetail, { from, to })}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.8rem' }}>
        <div>
          <p style={{ color: '#6b7280', marginBottom: 4 }}>{copy.reschedulePreviousLabel}</p>
          <p style={{ fontWeight: 500 }}>{from}</p>
        </div>
        <div>
          <p style={{ color: '#6b7280', marginBottom: 4 }}>{copy.rescheduleNewLabel}</p>
          <p style={{ fontWeight: 500, color: 'var(--tenant-primary)' }}>{to}</p>
        </div>
      </div>
    </div>
  );
}
