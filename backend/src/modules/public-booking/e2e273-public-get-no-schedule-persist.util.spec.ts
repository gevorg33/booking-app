import {
  E2E254_FACE_PILLING_SERVICE_ID,
  E2E254_SAMPLE_PAST_PATTERNS,
} from './e2e254-assigned-provider-hours.fixtures.js';
import {
  indexProjectedMicroSlotStartTimes,
  projectPatternsOntoDateKeys,
  projectedStartTimesKey,
  startTimeMatchesProjection,
} from './e2e254-assigned-provider-hours.util.js';
import { E2E273_UNIT_CASES } from './e2e273-public-get-no-schedule-persist.fixtures.js';

describe('e2e-bug.273 public GET no schedule persist util', () => {
  it('documents every unit scenario id', () => {
    expect(E2E273_UNIT_CASES.map((c) => c.id)).toEqual([
      'index-projected-start-times',
      'start-time-matches-projection',
      'plan-without-persist-saves-nothing',
      'bookable-dates-get-no-persist',
      'day-slots-get-no-persist',
      'bookable-dates-still-nonempty-via-ephemeral',
      'materialize-on-persist-true',
    ]);
  });

  it('index-projected-start-times + start-time-matches-projection', () => {
    const projectedDays = projectPatternsOntoDateKeys(
      E2E254_SAMPLE_PAST_PATTERNS,
      ['2026-08-05'],
    );
    const map = indexProjectedMicroSlotStartTimes([
      {
        employeeId: 'emp-karo',
        dateKey: '2026-08-05',
        slots: [
          { startTime: projectedDays[0].patterns[0].startTime },
          {
            startTime: new Date(
              projectedDays[0].patterns[0].startTime.getTime() + 10 * 60_000,
            ),
          },
        ],
      },
    ]);

    expect(map.get(projectedStartTimesKey('emp-karo', '2026-08-05'))?.length).toBe(
      2,
    );
    expect(
      startTimeMatchesProjection(
        map,
        'emp-karo',
        projectedDays[0].patterns[0].startTime,
      ),
    ).toBe(true);
    expect(
      startTimeMatchesProjection(
        map,
        'emp-karo',
        new Date('2026-08-05T12:00:00.000Z'),
      ),
    ).toBe(false);
    expect(
      startTimeMatchesProjection(
        map,
        'other',
        projectedDays[0].patterns[0].startTime,
      ),
    ).toBe(false);
    void E2E254_FACE_PILLING_SERVICE_ID;
  });

  it.each(E2E273_UNIT_CASES.map((c) => [c.id, c.description] as const))(
    'fixture case registered: %s — %s',
    (id) => {
      expect(typeof id).toBe('string');
    },
  );
});
