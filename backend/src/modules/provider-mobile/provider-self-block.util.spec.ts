import {
  PROVIDER_SELF_BLOCK_BUILD_SCENARIOS,
  PROVIDER_SELF_BLOCK_SETTINGS_SCENARIOS,
  PROVIDER_SELF_BLOCK_VALIDATION_SCENARIOS,
} from './provider-self-block.fixtures.js';
import {
  buildCreateBlockScheduleDto,
  buildProviderSelfBlockIso,
  isProviderSelfBlockEnabled,
  readProviderSelfBlockSettings,
  validateProviderSelfBlockWindow,
} from './provider-self-block.util.js';

/**
 * e2e-bug.422 — the clock is frozen because these fixtures name real dates.
 *
 * `validateProviderTimeOffRange` (and its self-block sibling) reject anything
 * more than a day in the past, measured against `Date.now()`. The fixtures were
 * written with `2026-06-20`, which was comfortably in the future then and is not
 * now, so every scenario started returning "Cannot request time off in the
 * past" — and `buildBlockScheduleDtoFromTimeOffRequest` returns `null` on a
 * validation error, which is why the assertions saw `undefined` rather than a
 * date complaint.
 *
 * Freezing rather than rewriting the fixtures to relative dates: the literal
 * dates are what make the expected ISO strings readable, and a fixture computed
 * from `Date.now()` cannot express "a range spanning a month boundary" without
 * becoming a second implementation of the thing under test.
 */
const FROZEN_NOW = new Date('2026-06-01T09:00:00.000Z');

beforeAll(() => {
  jest.useFakeTimers({ now: FROZEN_NOW, doNotFake: ['nextTick'] });
});

afterAll(() => {
  jest.useRealTimers();
});

describe('provider-self-block.util (prov-exp-7.1)', () => {
  it.each(PROVIDER_SELF_BLOCK_SETTINGS_SCENARIOS.map((s) => [s.id, s]))(
    'reads settings for %s',
    (_id, scenario) => {
      expect(
        isProviderSelfBlockEnabled(readProviderSelfBlockSettings(scenario.raw)),
      ).toBe(scenario.expectedEnabled);
    },
  );

  it.each(PROVIDER_SELF_BLOCK_VALIDATION_SCENARIOS.map((s) => [s.id, s]))(
    'validates window for %s',
    (_id, scenario) => {
      expect(
        validateProviderSelfBlockWindow(scenario.startIso, scenario.endIso),
      ).toBe(scenario.expectedError);
    },
  );

  it.each(PROVIDER_SELF_BLOCK_BUILD_SCENARIOS.map((s) => [s.id, s]))(
    'builds block schedule dto for %s',
    (_id, scenario) => {
      const dto = buildCreateBlockScheduleDto(
        scenario.employeeId,
        scenario.input,
      );
      if ('expected' in scenario && scenario.expected === null) {
        expect(dto).toBeNull();
        return;
      }
      expect(dto).toMatchObject({
        employeeId: scenario.employeeId,
        isRepetitive: false,
        placeholder: scenario.expectedPlaceholder,
        singleBlock: {
          startTime: scenario.expectedStart,
          endTime: scenario.expectedEnd,
        },
      });
    },
  );

  it('builds iso timestamps from date and time', () => {
    expect(buildProviderSelfBlockIso('2026-06-20', '09:30')).toBe(
      '2026-06-20T09:30:00.000Z',
    );
    expect(buildProviderSelfBlockIso('bad-date', '09:30')).toBeNull();
  });

  it('returns null dto when iso build fails', () => {
    expect(
      buildCreateBlockScheduleDto('emp-1', {
        date: 'bad-date',
        startTime: '12:00',
        endTime: '13:00',
      }),
    ).toBeNull();
  });

  it('defaults placeholder when blank', () => {
    const dto = buildCreateBlockScheduleDto('emp-1', {
      date: '2026-06-20',
      startTime: '12:00',
      endTime: '13:00',
      placeholder: '   ',
    });
    expect(dto?.placeholder).toBe('Blocked');
  });

  it('rejects invalid and past windows', () => {
    expect(
      validateProviderSelfBlockWindow('not-a-date', '2026-06-09T13:00:00.000Z'),
    ).toBe('Invalid date or time');
    expect(
      validateProviderSelfBlockWindow(
        '2020-01-01T12:00:00.000Z',
        '2020-01-01T13:00:00.000Z',
      ),
    ).toBe('Cannot create a block in the past');
  });
});
