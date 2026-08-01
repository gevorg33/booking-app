import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  API_BUG5_LIVE_SCENARIOS,
  API_BUG5_SOURCE_RULES,
  API_BUG5_UNIT_SCENARIOS,
} from './api-bug5-cancel-concurrency.fixtures.js';

describe('api-bug.5 concurrent cancel idempotency guards', () => {
  it.each(API_BUG5_SOURCE_RULES)('$id', ({ file, mustContain }) => {
    const source = readFileSync(resolve(__dirname, file), 'utf8');
    expect(source).toContain(mustContain);
  });

  it.each(API_BUG5_UNIT_SCENARIOS)('$id has description', ({ description }) => {
    expect(description.length).toBeGreaterThan(20);
  });

  it('live scenario inventory covers manage, me, mixed, bad-token, and leak checks', () => {
    const ids = API_BUG5_LIVE_SCENARIOS.map((s) => s.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'api5-live-manage-parallel-three',
        'api5-live-manage-parallel-eight',
        'api5-live-me-parallel-three',
        'api5-live-sequential-recancel',
        'api5-live-mixed-manage-and-me',
        'api5-live-bad-token-parallel',
        'api5-live-no-postgres-leak',
      ]),
    );
    expect(API_BUG5_LIVE_SCENARIOS).toHaveLength(7);
  });

  it('cancelBookingInternal short-circuits before bookingService.cancel when already cancelled', () => {
    const source = readFileSync(
      resolve(__dirname, 'public-customer-booking.service.ts'),
      'utf8',
    );
    const noopIdx = source.indexOf(
      'if (booking.status === BookingStatus.CANCELLED)',
    );
    const cancelIdx = source.indexOf(
      'await this.bookingService.cancel(',
      noopIdx,
    );
    expect(noopIdx).toBeGreaterThan(-1);
    expect(cancelIdx).toBeGreaterThan(noopIdx);
  });
});
