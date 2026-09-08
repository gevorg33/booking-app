/**
 * D5 / §231 — `delete_schedule_block` refuses an ambiguous provider.
 *
 * `resolveEmployees` picks **one** employee per requested name via
 * `fuzzyMatchByName` and cannot say "ambiguous", so with two providers sharing
 * a name "delete John's Tuesday block" removed whichever sorted first, and
 * reported success naming that provider. Same destructive shape as §226's
 * template delete, reached through a different resolver.
 *
 * `blockScheduleService.remove` is left throwing, so anything that slips past
 * the refusal fails loudly rather than passing quietly.
 */
import { AiScheduleHandlersService } from './ai-schedule-handlers.service.js';

const employee = (id: string, name: string) =>
  ({ id, name, isActive: true }) as never;

const NAMESAKES = [employee('emp-1', 'John Smith'), employee('emp-2', 'John Smith')];
const DISTINCT = [employee('emp-1', 'John Smith'), employee('emp-2', 'Maria Lopez')];

// A real block belonging to the *first* namesake. Without it the "removes
// nothing" test passes for the wrong reason: with the guard disabled the
// handler finds no blocks, returns "has no schedule blocks", and never reaches
// `remove` — so the assertion could not tell a refusal from an empty list.
const EXISTING_BLOCK = { id: 'blk-1', employeeId: 'emp-1' };

function buildService() {
  const svc: any = Object.create(AiScheduleHandlersService.prototype);
  svc.blockScheduleService = {
    list: jest.fn().mockResolvedValue([EXISTING_BLOCK]),
    remove: jest.fn(async () => {
      throw new Error('removed a block during an ambiguous provider match');
    }),
  };
  return svc;
}

describe('delete_schedule_block provider ambiguity (D5, §231)', () => {
  it('removes nothing when two providers share the named person', async () => {
    const svc = buildService();
    // No weekday in the prompt on purpose. With "Tuesday" in it the handler
    // parses a date, filters the (dateless) fixture block out, and returns
    // "no matching block" — so the unguarded path never reaches `remove` and
    // this test passed even with the guard disabled. The prompt is part of the
    // fixture, not decoration.
    const result: any = await svc.handleDeleteScheduleBlock(
      'biz-1',
      "delete John's block",
      { employeeName: 'John Smith' },
      NAMESAKES,
      'user-1',
    );

    expect(result.success).toBe(false);
    expect(svc.blockScheduleService.remove).not.toHaveBeenCalled();
  });

  it('names both candidates and the name that was ambiguous', async () => {
    const svc = buildService();
    const result: any = await svc.handleDeleteScheduleBlock(
      'biz-1',
      "delete John's Tuesday block",
      { employeeName: 'John Smith' },
      NAMESAKES,
      'user-1',
    );

    expect(result.details?.clarify).toBe(true);
    expect(result.details?.requestedName).toBe('John Smith');
    expect(
      (result.details.candidates as Array<{ id: string }>).map((c) => c.id).sort(),
    ).toEqual(['emp-1', 'emp-2']);
  });

  it('still proceeds for an unambiguous provider', async () => {
    // The refusal must not swallow the ordinary case — it reaches the block
    // lookup and returns the normal "no block found" answer, not the tie one.
    const svc = buildService();
    const result: any = await svc.handleDeleteScheduleBlock(
      'biz-1',
      "delete John's Tuesday block",
      { employeeName: 'John Smith' },
      DISTINCT,
      'user-1',
    );

    expect(result.details?.candidates).toBeUndefined();
  });

  it('does not treat "all providers" as ambiguous', async () => {
    // `allProviders` short-circuits: asking for everyone names nobody, so
    // there is no tie to refuse. Guarding it would block a valid request.
    const svc = buildService();
    const result: any = await svc.handleDeleteScheduleBlock(
      'biz-1',
      'delete the Tuesday block for everyone',
      { allProviders: true },
      NAMESAKES,
      'user-1',
    );

    expect(result.details?.candidates).toBeUndefined();
  });
});

/**
 * §233 — the four remaining writing sites in this service.
 *
 * `handleApplySchedule`, `handleBlockSchedule`, `handleFillScheduleGaps` and
 * `handleTemplateCascade` all resolved providers with the silent-pick
 * `resolveEmployees` and then wrote. They now share `resolveEmployeesVerdict`,
 * so one control disables all four — but each asserts its own action string,
 * because §227 caught a guard inventing `template_cascade` for a handler whose
 * own returns say `setup_week_schedule`. Every action below was read out of the
 * handler's own returns, not guessed from its name.
 */
describe('the remaining schedule writers refuse a provider tie (§233)', () => {
  // Local: `SUMMER_PAIR` above is scoped to its own describe. One template with
  // an exact name, so the *template* lookup is never the ambiguous thing here —
  // the provider tie is what these assert.
  const TEMPLATES = [
    { id: 'tpl-2025', name: 'Summer 2025', businessId: 'biz-1', isDeleted: false },
  ];

  const svcFor = () => {
    const svc: any = Object.create(AiScheduleHandlersService.prototype);
    svc.templateRepo = { find: jest.fn().mockResolvedValue(TEMPLATES) };
    svc.scheduleService = {
      applyTemplate: jest.fn(async () => {
        throw new Error('wrote during an ambiguous provider match');
      }),
    };
    svc.executePlan = jest.fn(async () => {
      throw new Error('executed during an ambiguous provider match');
    });
    svc.planBuilder = { buildBlockSchedulePlan: jest.fn(() => ({ steps: [] })) };
    return svc;
  };

  const NAMESAKES = [
    { id: 'emp-1', name: 'John Smith', isActive: true },
    { id: 'emp-2', name: 'John Smith', isActive: true },
  ] as never[];

  const CASES: Array<[string, string, (svc: any) => Promise<unknown>]> = [
    ['handleApplySchedule', 'apply_schedule', (svc) =>
      svc.handleApplySchedule('biz-1', 'apply Summer for John',
        { templateName: 'Summer 2025', employeeName: 'John Smith', dateFrom: '2026-08-17', dateTo: '2026-08-23' },
        NAMESAKES, 'user-1')],
    ['handleBlockSchedule', 'block_schedule', (svc) =>
      svc.handleBlockSchedule('biz-1', 'block John on Tuesday',
        { employeeName: 'John Smith', dateFrom: '2026-08-17', dateTo: '2026-08-23' },
        NAMESAKES, [], 'user-1')],
    ['handleFillScheduleGaps', 'fill_unused_slots', (svc) =>
      svc.handleFillScheduleGaps('biz-1', 'fill gaps for John',
        { employeeName: 'John Smith', dateFrom: '2026-08-17', dateTo: '2026-08-23' },
        NAMESAKES, [], 'user-1')],
    ['handleTemplateCascade', 'setup_week_schedule', (svc) =>
      svc.handleTemplateCascade('biz-1', 'cascade Summer for John',
        { templateName: 'Summer 2025', employeeName: 'John Smith', dateFrom: '2026-08-17', dateTo: '2026-08-23' },
        NAMESAKES, [], 'user-1')],
    // §234 — the site the D5 tracker called return-shape blocked.
    // `prepareDirectSchedulePlan` returns `AgentPlan | null` and indeed cannot
    // refuse; the *caller* can, which is what makes the label wrong.
    ['handleCreateDirectSchedule', 'create_direct_schedule', (svc) =>
      svc.handleCreateDirectSchedule('biz-1', 'set up a schedule for John',
        { employeeName: 'John Smith', dateFrom: '2026-08-17', dateTo: '2026-08-23' },
        NAMESAKES, [], 'user-1')],
  ];

  it.each(CASES)('%s refuses and names both candidates', async (_n, action, call) => {
    const svc = svcFor();
    const result: any = await call(svc);

    expect(result.success).toBe(false);
    expect(result.action).toBe(action);
    expect(result.details?.clarify).toBe(true);
    expect(result.details?.requestedName).toBe('John Smith');
    expect(
      (result.details.candidates as Array<{ id: string }>).map((c) => c.id).sort(),
    ).toEqual(['emp-1', 'emp-2']);
  });
});
