import {
  PROVIDER_RUNNING_LATE_MINUTES_SCENARIOS,
  PROVIDER_VISIT_STATUS_ELIGIBILITY_SCENARIOS,
  PROVIDER_VISIT_STATUS_INVALID_READ_SCENARIOS,
  PROVIDER_VISIT_STATUS_READ_SCENARIOS,
} from './provider-booking-visit-status.fixtures.js';
import {
  applyProviderVisitStatusToMetadata,
  buildProviderVisitStatusEligibility,
  buildProviderVisitStatusSnapshot,
  formatProviderVisitStatusLabel,
  normalizeProviderRunningLateMinutes,
  readProviderVisitStatus,
} from './provider-booking-visit-status.util.js';
import { buildProviderVisitStatusCustomerSms } from '../../common/utils/provider-visit-status-notification.util.js';

describe('provider-booking-visit-status.util (prov-exp-3.2)', () => {
  it.each(PROVIDER_VISIT_STATUS_ELIGIBILITY_SCENARIOS)(
    'buildProviderVisitStatusEligibility — $id',
    ({ booking, allowed }) => {
      expect(buildProviderVisitStatusEligibility(booking).allowed).toBe(allowed);
    },
  );

  it.each(PROVIDER_RUNNING_LATE_MINUTES_SCENARIOS)(
    'normalizeProviderRunningLateMinutes — $id',
    ({ input, expected }) => {
      expect(normalizeProviderRunningLateMinutes(input)).toBe(expected);
    },
  );

  it.each(PROVIDER_VISIT_STATUS_READ_SCENARIOS)(
    'readProviderVisitStatus — $id',
    ({ metadata, expectedKind, expectedMinutes }) => {
      const status = readProviderVisitStatus(metadata);
      expect(status?.kind).toBe(expectedKind);
      expect(status?.minutesLate).toBe(expectedMinutes);
    },
  );

  it.each(PROVIDER_VISIT_STATUS_INVALID_READ_SCENARIOS)(
    'readProviderVisitStatus returns null for invalid metadata — $id',
    ({ metadata }) => {
      expect(readProviderVisitStatus(metadata)).toBeNull();
    },
  );

  it('writes visit status onto booking metadata with markedByUserId', () => {
    const snapshot = buildProviderVisitStatusSnapshot({
      kind: 'running_late',
      minutesLate: 10,
      markedAt: new Date('2026-06-09T09:50:00.000Z'),
      markedByUserId: 'user-1',
    });
    const metadata = applyProviderVisitStatusToMetadata({}, snapshot);
    expect(readProviderVisitStatus(metadata)).toEqual(snapshot);
  });

  it('builds ready-now snapshot without optional fields', () => {
    expect(
      buildProviderVisitStatusSnapshot({
        kind: 'ready_now',
        markedAt: new Date('2026-06-09T09:50:00.000Z'),
      }),
    ).toEqual({
      kind: 'ready_now',
      markedAt: '2026-06-09T09:50:00.000Z',
    });
  });

  it('ignores malformed providerVisitStatus metadata', () => {
    expect(readProviderVisitStatus({ providerVisitStatus: 'bad' })).toBeNull();
    expect(readProviderVisitStatus(null)).toBeNull();
  });

  it('builds customer SMS copy', () => {
    expect(
      buildProviderVisitStatusCustomerSms({
        kind: 'running_late',
        minutesLate: 10,
        businessName: 'Glow Salon',
        providerName: 'Alex',
        serviceName: 'Haircut',
      }),
    ).toContain('10 minutes late');
    expect(
      buildProviderVisitStatusCustomerSms({
        kind: 'ready_now',
        businessName: 'Glow Salon',
        providerName: 'Alex',
        serviceName: 'Haircut',
      }),
    ).toContain('ready for you now');
  });

  it('formats provider-facing labels', () => {
    expect(
      formatProviderVisitStatusLabel({ kind: 'running_late', minutesLate: 10 }),
    ).toBe('Running 10m late');
    expect(formatProviderVisitStatusLabel({ kind: 'ready_now' })).toBe(
      'Ready now',
    );
  });
});
