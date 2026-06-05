import {
  buildBreachNotificationDraft,
  computeGdprNotificationDeadline,
  GDPR_BREACH_NOTIFICATION_HOURS,
  isGdprDeadlineApproaching,
  isGdprDeadlineOverdue,
} from './breach-notification.util.js';

describe('breach-notification.util', () => {
  const reportedAt = new Date('2026-06-01T10:00:00.000Z');

  it('computes GDPR 72-hour notification deadline', () => {
    const deadline = computeGdprNotificationDeadline(reportedAt);
    expect(deadline.toISOString()).toBe('2026-06-04T10:00:00.000Z');
    expect(GDPR_BREACH_NOTIFICATION_HOURS).toBe(72);
  });

  it('flags approaching and overdue deadlines', () => {
    const deadline = computeGdprNotificationDeadline(reportedAt);
    expect(
      isGdprDeadlineApproaching(deadline, new Date('2026-06-04T02:00:00.000Z')),
    ).toBe(true);
    expect(
      isGdprDeadlineApproaching(deadline, new Date('2026-06-01T12:00:00.000Z')),
    ).toBe(false);
    expect(
      isGdprDeadlineOverdue(deadline, new Date('2026-06-04T11:00:00.000Z')),
    ).toBe(true);
    expect(
      isGdprDeadlineOverdue(deadline, new Date('2026-06-03T12:00:00.000Z')),
    ).toBe(false);
    expect(
      isGdprDeadlineApproaching(
        deadline,
        new Date('2026-06-03T08:00:00.000Z'),
        12,
      ),
    ).toBe(false);
    expect(isGdprDeadlineApproaching(new Date(Date.now() + 3_600_000))).toBe(
      true,
    );
    expect(isGdprDeadlineOverdue(new Date(Date.now() - 3_600_000))).toBe(true);
  });

  it('builds customer notification draft email', () => {
    const draft = buildBreachNotificationDraft({
      businessName: 'City Clinic',
      incidentDescription: 'Unauthorized access to booking records.',
      reportedAt,
      affectedCustomerCount: 12,
    });
    expect(draft.subject).toContain('City Clinic');
    expect(draft.body).toContain('Unauthorized access to booking records.');
    expect(draft.body).toContain('72 hours');
    expect(draft.affectedCustomerCount).toBe(12);
  });
});
