import { buildNearestBookableSlotQuery } from './ai-nearest-slot-resolver.util.js';
import {
  applyChosenAvailabilityWindowToParams,
  buildNearestAvailabilityWindowQueries,
  pickEarliestNearestAvailabilityWindow,
} from './ai-nearest-slot-resolver.util.js';
import {
  FLEXIBLE_AVAILABILITY_NEAREST_PICK_SCENARIOS,
  FLEXIBLE_AVAILABILITY_NEAREST_WINDOW_SCENARIOS,
} from './ai-flexible-availability.fixtures.js';
import { resolvePublicAvailabilityWindows } from './ai-orchestration.helpers.js';

describe('ai-nearest-slot-resolver.util (ai-cmd-h2.3)', () => {
  it('maps evening window to notBeforeTime 17:00', () => {
    const query = buildNearestBookableSlotQuery(
      { serviceName: 'massage', timeOfDay: 'evening', date: '2026-06-07' },
      'book nearest massage tomorrow evening',
    );
    expect(query.notBeforeTime).toBe('17:00');
    expect(query.timeOfDay).toBe('evening');
    expect(query.startDateKey).toBe('2026-06-07');
  });

  it('clears employeeId when allProviders is true', () => {
    const query = buildNearestBookableSlotQuery(
      { allProviders: true, employeeId: 'e1' },
      '',
      'e2',
    );
    expect(query.employeeId).toBeNull();
  });

  it('prefers named employee over params.employeeId when not allProviders', () => {
    const query = buildNearestBookableSlotQuery({ employeeId: 'e1' }, '', 'e2');
    expect(query.employeeId).toBe('e2');
  });

  it('falls back to timeFrom when no time-of-day window', () => {
    const query = buildNearestBookableSlotQuery(
      { timeFrom: '16:00', date: '2026-06-08' },
      'book nearest after 16:00',
    );
    expect(query.notBeforeTime).toBe('16:00');
  });

  it('resolves tomorrow start date from prompt', () => {
    const query = buildNearestBookableSlotQuery(
      {},
      'book the nearest slot tomorrow',
    );
    expect(query.startDateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('ai-nearest-slot-resolver.util OR windows (avail-1.6)', () => {
  it.each(FLEXIBLE_AVAILABILITY_NEAREST_WINDOW_SCENARIOS)(
    'buildNearestAvailabilityWindowQueries $id',
    ({
      params,
      prompt,
      todayDateKey,
      expectedWindowCount,
      expectedQueries,
    }) => {
      const queries = buildNearestAvailabilityWindowQueries(
        params,
        prompt,
        'UTC',
      );
      expect(queries).toHaveLength(expectedWindowCount);
      for (let index = 0; index < expectedQueries.length; index++) {
        expect(queries[index]?.timeOfDay).toBe(expectedQueries[index]?.timeOfDay);
        expect(queries[index]?.dateKeys.length).toBe(
          expectedQueries[index]?.dateKeyCount,
        );
      }

      const resolved = resolvePublicAvailabilityWindows(params, prompt, 'UTC', {
        defaultScanDays: 14,
      });
      if (expectedWindowCount > 1) {
        expect(resolved).toHaveLength(expectedWindowCount);
      }
      void todayDateKey;
    },
  );

  it.each(FLEXIBLE_AVAILABILITY_NEAREST_PICK_SCENARIOS)(
    'pickEarliestNearestAvailabilityWindow $id',
    ({ candidates, expectedWindowIndex }) => {
      const picked = pickEarliestNearestAvailabilityWindow(
        candidates.map((candidate) => ({
          slot: {
            employeeId: 'e1',
            employeeName: 'Alice',
            dateKey: '2026-06-11',
            startTime: candidate.startTime,
          },
          windowIndex: candidate.windowIndex,
          timeOfDay: candidate.timeOfDay,
          dateKeys: ['2026-06-11'],
        })),
      );
      expect(picked?.windowIndex).toBe(expectedWindowIndex);
    },
  );

  it('applyChosenAvailabilityWindowToParams preserves winning window for session', () => {
    const updated = applyChosenAvailabilityWindowToParams(
      { bookingFirstAvailable: true, serviceName: 'Lashes' },
      {
        slot: {
          employeeId: 'e1',
          employeeName: 'Alice',
          dateKey: '2026-06-12',
          startTime: '2026-06-12T13:00:00.000Z',
        },
        windowIndex: 1,
        timeOfDay: 'afternoon',
        dateKeys: ['2026-06-12', '2026-06-19'],
      },
    );

    expect(updated.timeOfDay).toBe('afternoon');
    expect(updated.chosenAvailabilityWindowIndex).toBe(1);
    expect(updated.chosenAvailabilityWindow).toEqual({
      dateKeys: ['2026-06-12', '2026-06-19'],
      timeOfDay: 'afternoon',
    });
    expect(updated.timeSlot).toBe('13:00');
  });
});
