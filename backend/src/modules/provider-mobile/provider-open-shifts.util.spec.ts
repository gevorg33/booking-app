import {
  PROVIDER_OPEN_SHIFTS_FILL_PROMPT_SCENARIOS,
  PROVIDER_OPEN_SHIFTS_GAP_DURATION_SCENARIOS,
  PROVIDER_OPEN_SHIFTS_SETTINGS_SCENARIOS,
} from './provider-open-shifts.fixtures.js';
import {
  buildFillGapAiPrompt,
  extractGapWindowFromPrompt,
  findOpenShiftsInWindow,
  gapDurationMinutes,
  isFillGapPrompt,
  isProviderOpenShiftsEnabled,
  mapScheduleGapsForOpenShifts,
  normalizeProviderOpenShiftsSettings,
  normalizeScheduleDateKey,
  readProviderOpenShiftsSettings,
  formatWaitlistGapSuggestionSummary,
} from './provider-open-shifts.util.js';

describe('provider-open-shifts.util (prov-exp-7.3)', () => {
  it.each(PROVIDER_OPEN_SHIFTS_SETTINGS_SCENARIOS)(
    'reads settings $id',
    (scenario) => {
      expect(
        isProviderOpenShiftsEnabled(
          readProviderOpenShiftsSettings(scenario.raw),
        ),
      ).toBe(scenario.expectedEnabled);
    },
  );

  it.each(PROVIDER_OPEN_SHIFTS_GAP_DURATION_SCENARIOS)(
    'computes gap duration $id',
    (scenario) => {
      expect(gapDurationMinutes(scenario.startTime, scenario.endTime)).toBe(
        scenario.expectedMinutes,
      );
    },
  );

  it.each(PROVIDER_OPEN_SHIFTS_FILL_PROMPT_SCENARIOS)(
    'detects fill-gap prompt $id',
    (scenario) => {
      expect(isFillGapPrompt(scenario.prompt)).toBe(scenario.expectedMatch);
    },
  );

  it('builds fill-gap AI prompt', () => {
    expect(
      buildFillGapAiPrompt('2026-06-09', {
        startTime: '14:00',
        endTime: '15:30',
      }),
    ).toContain('2026-06-09');
    expect(
      buildFillGapAiPrompt('2026-06-09', {
        startTime: '14:00',
        endTime: '15:30',
      }),
    ).toContain('14:00');
  });

  it('extracts gap window from prompt', () => {
    expect(
      extractGapWindowFromPrompt('Fill this gap from 14:00 to 15:30'),
    ).toEqual({ timeFrom: '14:00', timeTo: '15:30' });
    expect(extractGapWindowFromPrompt('no times here')).toEqual({
      timeFrom: null,
      timeTo: null,
    });
  });

  it('normalizes settings and date keys', () => {
    expect(normalizeProviderOpenShiftsSettings({ enabled: true })).toEqual({
      enabled: true,
    });
    expect(normalizeScheduleDateKey('2026-06-09')).toBe('2026-06-09');
    expect(normalizeScheduleDateKey('bad')).toBeNull();
  });

  it('finds gaps over 30 minutes', () => {
    const day = new Date('2026-06-09T00:00:00.000Z');
    const gaps = findOpenShiftsInWindow(day, [
      {
        startTime: new Date('2026-06-09T10:00:00.000Z'),
        endTime: new Date('2026-06-09T11:00:00.000Z'),
      },
    ]);
    expect(
      gaps.some((gap) => gap.startTime === '09:00' && gap.endTime === '10:00'),
    ).toBe(true);
    expect(gaps.some((gap) => gap.startTime === '11:00')).toBe(true);
  });

  it('maps schedule gaps with duration', () => {
    expect(
      mapScheduleGapsForOpenShifts([{ startTime: '14:00', endTime: '15:00' }]),
    ).toEqual([{ startTime: '14:00', endTime: '15:00', durationMinutes: 60 }]);
  });

  it('formats waitlist suggestion summary', () => {
    expect(
      formatWaitlistGapSuggestionSummary({
        dateLabel: '09/06/2026',
        gap: { startTime: '14:00', endTime: '15:30' },
        waitlistNames: ['Anna', 'Ben'],
      }),
    ).toContain('Anna');
    expect(
      formatWaitlistGapSuggestionSummary({
        dateLabel: '09/06/2026',
        gap: { startTime: '14:00', endTime: '15:30' },
        waitlistNames: [],
      }),
    ).toContain('No waitlist customers');
    expect(
      formatWaitlistGapSuggestionSummary({
        dateLabel: '09/06/2026',
        gap: { startTime: '14:00', endTime: '15:30' },
        waitlistNames: ['A', 'B', 'C', 'D'],
      }),
    ).toContain('+1 more');
  });
});
