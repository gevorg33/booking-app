import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import type { PublicService } from '../lib/types.js';
import {
  formatClinicServiceTypeBadge,
  isPublicClinicService,
} from '../lib/clinic-service.js';

export function ConsumerClinicServiceBadges({
  service,
  copy,
}: {
  service: PublicService;
  copy: ConsumerCopy;
}) {
  if (!isPublicClinicService(service)) return null;

  const typeBadge = formatClinicServiceTypeBadge(service.clinicServiceType, copy);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
      {typeBadge ? (
        <span
          style={{
            display: 'inline-block',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#0369a1',
            background: '#f0f9ff',
            padding: '2px 8px',
            borderRadius: 999,
          }}
        >
          {typeBadge}
        </span>
      ) : null}
      {service.requiresFasting ? (
        <span
          style={{
            display: 'inline-block',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#b45309',
            background: '#fffbeb',
            padding: '2px 8px',
            borderRadius: 999,
          }}
        >
          {copy.clinicFastingRequired}
        </span>
      ) : null}
    </div>
  );
}
