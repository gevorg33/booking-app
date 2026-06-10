import { describe, expect, it } from 'vitest';
import {
  REBOOK_CANDIDATE_BOOKINGS,
  REBOOK_PATH_SCENARIOS,
  REBOOK_PUSH_SCENARIOS,
  REBOOK_QUERY_SCENARIOS,
} from './consumer-rebook.fixtures.js';
import {
  buildRebookBookServicePath,
  buildRebookBookServicePushUrl,
  deriveRebookQueryParams,
  normalizeRebookPrefill,
  readRebookLaunchContext,
  resolveAccountRebookTarget,
} from './consumer-rebook.util.js';

describe('consumer-rebook.util', () => {
  it.each(REBOOK_QUERY_SCENARIOS)(
    'deriveRebookQueryParams $id',
    ({ booking, expectedDate, expectedSlot, expectedEmployeeId }) => {
      expect(deriveRebookQueryParams(booking)).toEqual(
        expect.objectContaining({
          date: expectedDate,
          slot: expectedSlot,
          employeeId: expectedEmployeeId,
          rebook: '1',
          rebookBookingId: booking.id,
        }),
      );
    },
  );

  it.each(REBOOK_PATH_SCENARIOS)(
    'buildRebookBookServicePath $id',
    ({ slug, booking, expectPathContains, expectQueryContains }) => {
      const path = buildRebookBookServicePath(slug, booking);
      expect(path).toContain(expectPathContains);
      for (const part of expectQueryContains) {
        expect(path).toContain(part);
      }
    },
  );

  it.each(REBOOK_PUSH_SCENARIOS)(
    'buildRebookBookServicePushUrl $id',
    ({ slug, booking, expectUrlContains }) => {
      const url = buildRebookBookServicePushUrl(slug, booking);
      for (const part of expectUrlContains) {
        expect(url).toContain(part);
      }
    },
  );

  it('resolves latest completed booking for account rebook', () => {
    const target = resolveAccountRebookTarget(REBOOK_CANDIDATE_BOOKINGS, 'demo-salon');
    expect(target?.booking.id).toBe('bk-rebook-1');
    expect(target?.path).toContain('rebook=1');
  });

  it('reads widget rebook launch context', () => {
    expect(
      readRebookLaunchContext('?rebook=1&rebookSource=widget&rebookBookingId=bk-1'),
    ).toEqual({
      isRebook: true,
      bookingId: 'bk-1',
      source: 'widget',
    });
  });

  it('reads account rebook launch context', () => {
    expect(readRebookLaunchContext('?rebook=1&rebookSource=account')).toEqual({
      isRebook: true,
      bookingId: undefined,
      source: 'account',
    });
  });

  it('builds account rebook path with rebookSource=account', () => {
    const path = buildRebookBookServicePath('demo-salon', REBOOK_CANDIDATE_BOOKINGS[0]!, {
      source: 'account',
    });
    expect(path).toContain('rebookSource=account');
  });

  it('normalizes past rebook dates to today', () => {
    expect(
      normalizeRebookPrefill({
        date: '2026-04-01',
        slot: '2026-04-01T10:00:00.000Z',
        now: new Date('2026-06-09T12:00:00.000Z'),
      }),
    ).toEqual({
      date: '2026-06-09',
      slot: '2026-06-09T10:00:00.000Z',
    });
  });
});
