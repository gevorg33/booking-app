import {
  buildConsumerRebookAccountPath,
  buildConsumerRebookPushUrl,
  deriveConsumerRebookQueryParams,
} from './consumer-rebook.util.js';

describe('consumer-rebook.util', () => {
  it('derives rebook query params from booking start time', () => {
    expect(
      deriveConsumerRebookQueryParams({
        bookingId: 'bk-1',
        startTime: '2026-05-01T10:00:00.000Z',
        employeeId: 'emp-1',
      }),
    ).toEqual({
      date: '2026-05-01',
      slot: '2026-05-01T10:00:00.000Z',
      employeeId: 'emp-1',
      rebookBookingId: 'bk-1',
      rebook: '1',
    });
  });

  it('builds push and account paths with time prefill', () => {
    const input = {
      slug: 'demo-salon',
      serviceId: 'svc-1',
      bookingId: 'bk-1',
      startTime: '2026-05-01T10:00:00.000Z',
      employeeId: 'emp-1',
    };
    expect(buildConsumerRebookPushUrl(input)).toContain('rebook=1');
    expect(buildConsumerRebookPushUrl(input)).toContain('slot=2026-05-01');
    expect(buildConsumerRebookAccountPath(input)).toContain('/s/demo-salon/book/svc-1');
    expect(buildConsumerRebookAccountPath(input)).toContain('employeeId=emp-1');
  });
});
