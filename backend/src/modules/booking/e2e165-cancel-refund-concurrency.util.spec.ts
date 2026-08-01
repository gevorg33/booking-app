import { E2E165_UNIT_EDGE_CASES } from './e2e165-cancel-refund-concurrency.fixtures.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * e2e-bug.165 — fixture checklist maps to booking.service.cancel.spec.ts +
 * booking-refund.service.spec.ts (behavioral coverage lives there).
 */
describe('e2e-bug.165 cancel refund + concurrency fixtures', () => {
  it('lists the guru edge-case ids', () => {
    expect(E2E165_UNIT_EDGE_CASES.map((c) => c.id)).toEqual([
      'refund-paid-online',
      'keep-paid-until-refund',
      'skip-refund-unpaid',
      'lock-without-relations',
      'version-conflict',
      'idempotent-already-cancelled',
      'legacy-cancelled-missing-refund',
      'idempotency-key-by-pi',
    ]);
  });

  it('cancel + refund specs still cover the e2e-bug.165 contract', () => {
    const cancelSpec = readFileSync(
      join(__dirname, 'booking.service.cancel.spec.ts'),
      'utf8',
    );
    const refundSpec = readFileSync(
      join(__dirname, 'booking-refund.service.spec.ts'),
      'utf8',
    );
    expect(cancelSpec).toContain('e2e-bug.165');
    expect(cancelSpec).toContain('refunds a paid-online booking');
    expect(cancelSpec).toContain('BOOKING_VERSION_CONFLICT');
    expect(cancelSpec).toContain('pessimistic_write');
    expect(cancelSpec).toContain('does not overwrite an already-cancelled');
    expect(refundSpec).toContain('idempotencyKey');
    expect(refundSpec).toContain('booking-refund-pi-');
  });

  it('BookingService.cancel source still refunds + locks without relations', () => {
    const source = readFileSync(join(__dirname, 'booking.service.ts'), 'utf8');
    expect(source).toContain('e2e-bug.165');
    expect(source).toContain("lock: { mode: 'pessimistic_write' }");
    expect(source).toContain('attemptCancelRefund');
    expect(source).toContain('bookingNeedsOnlineRefund');
    // e2e-bug.184 — relations must stay off the locked findOne
    const marker = 'e2e-bug.165 — serialize concurrent cancels';
    const start = source.indexOf(marker);
    expect(start).toBeGreaterThan(-1);
    const lockBlock = source.slice(start, start + 900);
    expect(lockBlock).toContain('pessimistic_write');
    expect(lockBlock).not.toMatch(/relations:\s*\{/);
  });
});
