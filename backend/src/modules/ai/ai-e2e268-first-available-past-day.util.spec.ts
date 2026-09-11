import {
  E2E268_CLAMP_RULES,
  E2E268_DROP_PAST_KEYS,
} from './ai-e2e268-first-available-past-day.fixtures.js';
import {
  clampFirstAvailableStartIsoDay,
  dropPastFirstAvailableDateKeys,
  isFutureOrTodayIsoDay,
  buildNearestAvailabilityWindowQueries,
  resolveNearestBookableSlotStartDateKey,
} from './ai-nearest-slot-resolver.util.js';
import { getTodayDateKey } from '../../common/utils/date-format.util.js';
import { addDaysToDateKey } from '../../common/utils/timezone.util.js';

describe('e2e-bug.268 first-available never starts on past calendar days', () => {
  const tz = 'UTC';

  it.each(E2E268_CLAMP_RULES.map((row) => [row.id, row] as const))(
    'clampFirstAvailableStartIsoDay %s',
    (_id, row) => {
      const today = getTodayDateKey(tz);
      let requested = row.requestedDate;
      if (row.kind === 'past') {
        // Ensure past relative to live today (use fixed past if already past,
        // otherwise subtract 30 days).
        const candidate = String(row.requestedDate);
        requested =
          candidate < today ? candidate : addDaysToDateKey(today, -30, tz);
      } else if (row.kind === 'today') {
        requested = today;
      } else if (row.kind === 'future') {
        requested = row.requestedDate;
      }

      const clamped = clampFirstAvailableStartIsoDay(requested, tz);
      expect(clamped).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(clamped >= today).toBe(true);

      if (row.expect === 'requested' && requested) {
        expect(clamped).toBe(requested);
      }
      if (row.expect === 'today' || row.expect === 'today-from-empty') {
        expect(clamped).toBe(today);
      }
    },
  );

  it.each(E2E268_DROP_PAST_KEYS.map((row) => [row.id, row] as const))(
    'dropPastFirstAvailableDateKeys %s',
    (_id, row) => {
      const today = getTodayDateKey(tz);
      const kept = dropPastFirstAvailableDateKeys(row.dateKeys, tz);
      for (const dropped of row.mustDrop) {
        expect(kept).not.toContain(dropped);
      }
      for (const key of kept) {
        expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(key >= today).toBe(true);
      }
    },
  );

  it('isFutureOrTodayIsoDay rejects past and non-ISO', () => {
    const today = getTodayDateKey(tz);
    expect(isFutureOrTodayIsoDay(today, tz)).toBe(true);
    expect(isFutureOrTodayIsoDay(addDaysToDateKey(today, 1, tz), tz)).toBe(
      true,
    );
    expect(isFutureOrTodayIsoDay(addDaysToDateKey(today, -1, tz), tz)).toBe(
      false,
    );
    expect(isFutureOrTodayIsoDay('January 8, 2026', tz)).toBe(false);
  });

  it('resolveNearestBookableSlotStartDateKey clamps past params.date', () => {
    const today = getTodayDateKey(tz);
    const past = addDaysToDateKey(today, -40, tz);
    expect(resolveNearestBookableSlotStartDateKey({ date: past }, '', tz)).toBe(
      today,
    );
  });

  it('resolveNearestBookableSlotStartDateKey tomorrow is ≥ today', () => {
    const today = getTodayDateKey(tz);
    const key = resolveNearestBookableSlotStartDateKey(
      {},
      'book the nearest slot tomorrow',
      tz,
    );
    expect(key).toBe(addDaysToDateKey(today, 1, tz));
  });

  it('buildNearestAvailabilityWindowQueries drops past fallback dateKeys', () => {
    const today = getTodayDateKey(tz);
    const past = addDaysToDateKey(today, -10, tz);
    const queries = buildNearestAvailabilityWindowQueries(
      { date: past },
      'book nearest',
      tz,
    );
    expect(queries).toHaveLength(1);
    for (const key of queries[0]?.dateKeys ?? []) {
      expect(key >= today).toBe(true);
    }
  });
});
