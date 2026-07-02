import {
  appendConsumerRebookQueryParams,
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

  it('derives rebook query params from Date and blank employee', () => {
    expect(
      deriveConsumerRebookQueryParams({
        bookingId: 'bk-2',
        startTime: new Date('2026-06-15T14:30:00.000Z'),
        employeeId: '  ',
      }),
    ).toEqual({
      date: '2026-06-15',
      slot: '2026-06-15T14:30:00.000Z',
      employeeId: undefined,
      rebookBookingId: 'bk-2',
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
    expect(buildConsumerRebookAccountPath(input)).toContain(
      '/s/demo-salon/book/svc-1',
    );
    expect(buildConsumerRebookAccountPath(input)).toContain('employeeId=emp-1');
  });

  it('appends rebook query params without optional employee', () => {
    const url = appendConsumerRebookQueryParams(
      'https://book.example/s/demo/book/svc-1',
      {
        date: '2026-05-01',
        slot: '2026-05-01T10:00:00.000Z',
        rebookBookingId: 'bk-1',
        rebook: '1',
      },
    );
    expect(url).toContain('rebook=1');
    expect(url).not.toContain('employeeId=');
  });

  it('appends rebook query params without booking id', () => {
    const url = appendConsumerRebookQueryParams(
      'https://book.example/s/demo/book/svc-1',
      {
        date: '2026-05-01',
        slot: '2026-05-01T10:00:00.000Z',
        rebook: '1',
      },
    );
    expect(url).toContain('rebook=1');
    expect(url).not.toContain('rebookBookingId=');
  });

  it('builds account path without optional employee', () => {
    expect(
      buildConsumerRebookAccountPath({
        slug: ' demo-salon ',
        serviceId: ' svc-1 ',
        bookingId: 'bk-3',
        startTime: '2026-05-01T10:00:00.000Z',
      }),
    ).toBe(
      '/s/demo-salon/book/svc-1?date=2026-05-01&slot=2026-05-01T10%3A00%3A00.000Z&rebook=1&rebookBookingId=bk-3',
    );
  });
});
