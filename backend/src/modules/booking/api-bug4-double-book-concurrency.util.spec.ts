import { readFileSync } from 'fs';
import { resolve } from 'path';
import { formatBookingOverlapConflict } from '../../common/utils/booking-conflict-messages.util.js';
import {
  API_BUG4_CONFLICT_MESSAGE_SCENARIOS,
  API_BUG4_LIVE_SCENARIOS,
  API_BUG4_SOURCE_RULES,
} from './api-bug4-double-book-concurrency.fixtures.js';

describe('api-bug.4 double-book concurrency guards', () => {
  const bookingServiceSource = readFileSync(
    resolve(__dirname, 'booking.service.ts'),
    'utf8',
  );

  it.each(API_BUG4_SOURCE_RULES)('$id', ({ mustContain }) => {
    expect(bookingServiceSource).toContain(mustContain);
  });

  it.each(API_BUG4_CONFLICT_MESSAGE_SCENARIOS)(
    '$id',
    ({ input, expectIncludes }) => {
      expect(formatBookingOverlapConflict(input)).toContain(expectIncludes);
    },
  );

  it('live scenario inventory covers parallel + sequential + distinct + DB checks', () => {
    const ids = API_BUG4_LIVE_SCENARIOS.map((s) => s.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'api4-live-parallel-four-one-wins',
        'api4-live-parallel-eight-one-wins',
        'api4-live-sequential-second-conflict',
        'api4-live-two-distinct-slots-both-ok',
        'api4-live-winner-removed-from-slots',
        'api4-live-no-postgres-leak',
        'api4-live-db-single-active-row',
      ]),
    );
    expect(API_BUG4_LIVE_SCENARIOS).toHaveLength(7);
  });

  it('create() transaction still documents api-bug.4 claim before conflict check', () => {
    const claimIdx = bookingServiceSource.indexOf(
      'await this.claimSlotsInWindowForUpdate(',
    );
    const conflictIdx = bookingServiceSource.indexOf(
      ".setLock('pessimistic_write')",
      claimIdx + 1,
    );
    expect(claimIdx).toBeGreaterThan(-1);
    expect(conflictIdx).toBeGreaterThan(claimIdx);
  });
});
