import {
  E2E136_CLEAR_SCHEDULE_STILL_ROUTES,
  E2E136_DELETE_SCHEDULE_BLOCK_SCENARIOS,
} from './ai-e2e136-clear-schedule.fixtures.js';
import {
  isClearSchedulePrompt,
  isDeleteScheduleBlockPrompt,
} from './ai-orchestration.helpers.js';
import {
  disambiguateClearScheduleVsDeleteBlock,
  disambiguateClearScheduleVsHideCalendar,
} from './ai-schedule-ops-hints.util.js';
import { scheduleBlockMatchesIsoDay } from './ai-scheduling.util.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';

describe('e2e-bug.136 — unblock routes to delete_schedule_block', () => {
  const rescue = new AiIntentRescueService();
  const employees = [{ id: 'e1', name: 'Gevorg Gasparyan' }];

  it.each(E2E136_DELETE_SCHEDULE_BLOCK_SCENARIOS)(
    'detects delete-block prompt $id',
    ({ prompt }) => {
      expect(isDeleteScheduleBlockPrompt(prompt)).toBe(true);
      expect(isClearSchedulePrompt(prompt)).toBe(false);
    },
  );

  it.each(E2E136_DELETE_SCHEDULE_BLOCK_SCENARIOS)(
    'rescues $id → delete_schedule_block',
    ({ prompt, expectedAction }) => {
      for (const action of [
        'unknown',
        'clear_schedule',
        'react_agent',
      ] as const) {
        const result = rescue.rescue({
          prompt,
          action,
          params: {},
          employees,
          surface: 'dashboard',
        });
        expect(result?.action).toBe(expectedAction);
        expect(result?.rescueReason).toMatch(
          /delete_schedule_block|clear_to_delete_schedule_block/,
        );
      }
    },
  );

  it.each(E2E136_CLEAR_SCHEDULE_STILL_ROUTES)(
    'keeps applied-schedule cleanup as clear_schedule ($id)',
    ({ prompt, expectedAction }) => {
      expect(isClearSchedulePrompt(prompt)).toBe(true);
      expect(isDeleteScheduleBlockPrompt(prompt)).toBe(false);
      const result = rescue.rescue({
        prompt,
        action: 'unknown',
        params: {},
        employees,
      });
      expect(result?.action).toBe(expectedAction);
    },
  );

  it('disambiguates clear_schedule → delete_schedule_block', () => {
    const result = disambiguateClearScheduleVsDeleteBlock(
      "Unblock Gevorg's schedule for tomorrow",
      'clear_schedule',
    );
    expect(result?.action).toBe('delete_schedule_block');
    expect(
      disambiguateClearScheduleVsHideCalendar(
        "Unblock Gevorg's schedule for tomorrow",
        'list_schedule_gaps',
      )?.action,
    ).toBe('delete_schedule_block');
  });

  it('matches single-block rows by singleStartTime day', () => {
    expect(
      scheduleBlockMatchesIsoDay(
        {
          startDay: null,
          endDay: null,
          singleStartTime: '2026-07-18T00:00:00.000Z',
          singleEndTime: '2026-07-18T23:59:59.000Z',
        },
        '2026-07-18',
      ),
    ).toBe(true);
    expect(
      scheduleBlockMatchesIsoDay(
        {
          startDay: null,
          singleStartTime: '2026-07-18T00:00:00.000Z',
          singleEndTime: '2026-07-18T23:59:59.000Z',
        },
        '2026-07-19',
      ),
    ).toBe(false);
  });

  it('matches repetitive blocks by startDay/endDay', () => {
    expect(
      scheduleBlockMatchesIsoDay(
        { startDay: '2026-07-01', endDay: '2026-07-31' },
        '2026-07-18',
      ),
    ).toBe(true);
  });
});
