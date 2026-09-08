/**
 * D5 / §226 — `delete_schedule_templates` refuses an ambiguous name.
 *
 * `resolveTemplate` falls through to `fuzzyMatchByName`, whose second tier is a
 * **substring** match. So "Summer" matches both "Summer 2025" and
 * "Summer 2026", and the silent pick deleted whichever sorted first — then
 * reported success naming that one, which is worse than a plain failure: the
 * user is told a template was deleted, and it was, just not theirs.
 *
 * Deletion is the point. The other `resolveTemplate` callers on this service
 * apply or update; this one destroys, so it is the one guarded first.
 */
import { AiScheduleHandlersService } from './ai-schedule-handlers.service.js';

const template = (id: string, name: string) =>
  ({ id, name, businessId: 'biz-1', isDeleted: false }) as never;

const SUMMER_PAIR = [
  template('tpl-2025', 'Summer 2025'),
  template('tpl-2026', 'Summer 2026'),
];

function buildService(templates: unknown[], deleteTemplates: jest.Mock) {
  const svc = Object.create(AiScheduleHandlersService.prototype);
  svc.templateRepo = { find: jest.fn().mockResolvedValue(templates) };
  svc.scheduleService = { deleteTemplates };
  return svc as AiScheduleHandlersService & {
    handleDeleteScheduleTemplates: (
      businessId: string,
      params: Record<string, unknown>,
      userId?: string,
    ) => Promise<{ success: boolean; details?: Record<string, unknown> }>;
  };
}

describe('delete_schedule_templates ambiguity (D5, §226)', () => {
  it('deletes nothing when the name matches two templates', async () => {
    const deleteTemplates = jest.fn(async () => {
      throw new Error('deleted during an ambiguous template match');
    });
    const svc = buildService(SUMMER_PAIR, deleteTemplates);

    const result = await svc.handleDeleteScheduleTemplates(
      'biz-1',
      { templateNames: ['Summer'] },
      'user-1',
    );

    expect(result.success).toBe(false);
    expect(deleteTemplates).not.toHaveBeenCalled();
  });

  it('names both candidates so the user can pick', async () => {
    const svc = buildService(SUMMER_PAIR, jest.fn());
    const result: any = await svc.handleDeleteScheduleTemplates(
      'biz-1',
      { templateNames: ['Summer'] },
      'user-1',
    );

    expect(result.details?.clarify).toBe(true);
    expect(
      (result.details.candidates as Array<{ name: string }>)
        .map((c) => c.name)
        .sort(),
    ).toEqual(['Summer 2025', 'Summer 2026']);
  });

  it('still deletes on an unambiguous exact name', async () => {
    // The refusal must not swallow the ordinary case — an exact match beats the
    // substring tier, so "Summer 2025" is not a tie even though "Summer" is.
    const deleteTemplates = jest.fn(async () => ({ deleted: 1 }));
    const svc = buildService(SUMMER_PAIR, deleteTemplates);

    const result: any = await svc.handleDeleteScheduleTemplates(
      'biz-1',
      { templateNames: ['Summer 2025'] },
      'user-1',
    );

    expect(result.success).toBe(true);
    expect(deleteTemplates).toHaveBeenCalledTimes(1);
    expect(deleteTemplates.mock.calls[0][1]).toEqual({
      templateIds: ['tpl-2025'],
    });
  });
});

/**
 * §227 — the same guard on the four *other* mutating template paths.
 *
 * `handleDeleteScheduleTemplates` was guarded first (§226) because it destroys.
 * Apply, cascade, update and duplicate all write too, and all four resolved the
 * template with the same substring-matching silent pick. They now share
 * `resolveTemplateVerdict`, so one control disables all four at once — but each
 * has its own assertion, so a failure names the site.
 *
 * The two plan-only twins (`prepareApplySchedulePlan`,
 * `prepareTemplateCascadePlan`) are deliberately **not** migrated: they return
 * `null` on a miss and cannot carry a refusal message, which is the same
 * return-shape block that kept `buildCreateBookingPlanOnly` out of slice 8.
 */
describe('the other mutating template paths refuse a tie too (§227)', () => {
  const buildFor = (extra: Record<string, unknown> = {}) => {
    const svc: any = Object.create(AiScheduleHandlersService.prototype);
    svc.templateRepo = { find: jest.fn().mockResolvedValue(SUMMER_PAIR) };
    svc.scheduleService = {
      applyTemplate: jest.fn(async () => {
        throw new Error('applied during an ambiguous template match');
      }),
      updateTemplate: jest.fn(async () => {
        throw new Error('updated during an ambiguous template match');
      }),
      duplicateTemplate: jest.fn(async () => {
        throw new Error('duplicated during an ambiguous template match');
      }),
      deleteTemplates: jest.fn(),
    };
    svc.employeeRepo = { find: jest.fn().mockResolvedValue([]) };
    Object.assign(svc, extra);
    return svc;
  };

  // The four do not share a signature — `handleApplySchedule` and
  // `handleTemplateCascade` take `(businessId, prompt, params, employees[,
  // services], userId)`, the other two `(businessId, params, userId)`. An
  // it.each over a single call shape passed two of them for the wrong reason:
  // the mismatched arity returned an early validation failure, which is also
  // `success: false`, so only the `clarify` assertion caught it.
  const EMPLOYEES = [{ id: 'e1', name: 'Anna', isActive: true }] as never[];

  const CASES: Array<[string, string, (svc: any) => Promise<unknown>]> = [
    [
      'handleApplySchedule',
      'apply_schedule',
      (svc) =>
        svc.handleApplySchedule(
          'biz-1',
          'apply Summer',
          { templateName: 'Summer', allProviders: true, dateFrom: '2026-08-17', dateTo: '2026-08-23' },
          EMPLOYEES,
          'user-1',
        ),
    ],
    [
      'handleTemplateCascade',
      'setup_week_schedule',
      (svc) =>
        svc.handleTemplateCascade(
          'biz-1',
          'cascade Summer',
          {
            templateName: 'Summer',
            allProviders: true,
            dateFrom: '2026-08-17',
            dateTo: '2026-08-23',
          },
          EMPLOYEES,
          [],
          'user-1',
        ),
    ],
    [
      'handleUpdateScheduleTemplate',
      'update_schedule_template',
      (svc) =>
        svc.handleUpdateScheduleTemplate('biz-1', { templateName: 'Summer' }, 'user-1'),
    ],
    [
      'handleDuplicateScheduleTemplate',
      'duplicate_schedule_template',
      (svc) =>
        svc.handleDuplicateScheduleTemplate('biz-1', { templateName: 'Summer' }, 'user-1'),
    ],
  ];

  it.each(CASES)('%s refuses and names both candidates', async (_name, action, call) => {
    const result: any = await call(buildFor());

    expect(result.success).toBe(false);
    expect(result.action).toBe(action);
    expect(result.details?.clarify).toBe(true);
    expect(
      (result.details.candidates as Array<{ name: string }>)
        .map((c) => c.name)
        .sort(),
    ).toEqual(['Summer 2025', 'Summer 2026']);
  });
});
