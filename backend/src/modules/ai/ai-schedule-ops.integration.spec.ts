import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  applyScheduleOpsPromptHints,
  inheritScheduleFollowUpContext,
} from './ai-schedule-ops-hints.util.js';
import { CommandCompletionPipelineService } from './command-completion.pipeline.service.js';
import { validateCommand } from './command-completion.validator.js';

describe('ai schedule ops integration (ai-cmd-h3.2)', () => {
  const employees = [
    { id: 'e1', name: 'Gevorg Gasparyan' },
    { id: 'e2', name: 'Mary Torgomyan' },
  ];
  const pipeline = new CommandCompletionPipelineService();
  let rescue: AiIntentRescueService;

  beforeEach(() => {
    rescue = new AiIntentRescueService();
  });

  it('rescues hide from calendar instead of cancel or clear', () => {
    const result = rescue.rescue({
      prompt: 'Remove all appointments from Gevorg calendar today',
      action: 'unknown',
      params: {},
      employees,
    });
    expect(result?.action).toBe('hide_appointments_from_calendar');
    expect(result?.rescueReason).toBe('hide_calendar_pattern');
  });

  it('rescues clear schedule and keeps distinct from hide', () => {
    const clear = rescue.rescue({
      prompt: 'Clear Gevorg schedule for tomorrow',
      action: 'unknown',
      params: { employeeName: 'Gevorg' },
      employees,
    });
    expect(clear?.action).toBe('clear_schedule');

    const hide = rescue.rescue({
      prompt: 'Hide Gevorg appointments from calendar tomorrow',
      action: 'unknown',
      params: { employeeName: 'Gevorg' },
      employees,
    });
    expect(hide?.action).toBe('hide_appointments_from_calendar');
  });

  it('disambiguates misclassified clear_schedule to hide', () => {
    const result = rescue.rescue({
      prompt: 'Hide cancelled appointments from calendar for Gevorg this week',
      action: 'clear_schedule',
      params: { employeeName: 'Gevorg Gasparyan' },
      employees,
    });
    expect(result?.action).toBe('hide_appointments_from_calendar');
    expect(result?.rescueReason).toBe('clear_to_hide_calendar');
  });

  it('rescues fill those gaps follow-up', () => {
    const result = rescue.rescue({
      prompt: 'fill those gaps',
      action: 'unknown',
      params: {},
      employees,
    });
    expect(result?.action).toBe('fill_unused_slots');
    expect(result?.rescueReason).toBe('fill_gaps_pattern');
  });

  it('merges session then validates multi-provider list_schedule_gaps', () => {
    const merged = pipeline.mergeSessionContext(
      { employeeNames: null, dateFrom: null, dateTo: null },
      {
        employeeNames: ['Gevorg Gasparyan', 'Mary Torgomyan'],
        dateFrom: '02/06/2026',
        dateTo: '08/06/2026',
        lastAction: 'summarize_utilization',
      },
      'list_schedule_gaps',
    );
    applyScheduleOpsPromptHints(
      'list_schedule_gaps',
      merged,
      'which exact days have gaps',
      { employees, timeZone: 'UTC', session: merged },
    );
    const result = validateCommand({
      action: 'list_schedule_gaps',
      params: merged,
      enrichedParams: {
        employeeNames: ['Gevorg Gasparyan', 'Mary Torgomyan'],
        dateFrom: '2026-06-02',
        dateTo: '2026-06-08',
      },
      entities: {
        employees: employees.map((e) => ({ id: e.id, name: e.name })) as any,
        dateRange: { start: '2026-06-02', end: '2026-06-08' },
      },
      reasoning: 'test',
      confidence: 0.9,
    });
    expect(result.ok).toBe(true);
  });

  it('inherits apply_schedule context into fill_unused_slots follow-up', () => {
    const params: Record<string, any> = {};
    const session = {
      lastAction: 'apply_schedule',
      employeeName: 'Gevorg Gasparyan',
      templateName: 'Weekday',
      dateFrom: '02/06/2026',
      dateTo: '08/06/2026',
    };
    const merged = pipeline.mergeSessionContext(params, session, 'fill_unused_slots');
    inheritScheduleFollowUpContext(
      merged,
      session,
      'fill_unused_slots',
      'fill those gaps with his services',
    );
    expect(merged.employeeName).toBe('Gevorg Gasparyan');
    expect(merged.templateName).toBe('Weekday');
    expect(merged.dateFrom).toBe('02/06/2026');
    expect(merged.dateTo).toBe('08/06/2026');
  });
});
