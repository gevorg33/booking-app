import { EventType } from '../../events/event-types.js';
import {
  applyAbToSuggestionsLogic,
  applyBranchScopeToCatalogLogic,
  escalateStuckTaskLogic,
  filterBookingsForBranchLogic,
  gatePublicAssistantActionLogic,
  gateRoleProfileIntentLogic,
  getCommandAnalyticsLogic,
  recordCommandOutcomeLogic,
  rescueVerticalIntentLogic,
  resolveBranchContextLogic,
  scanStuckTasksForEscalationLogic,
} from './ai-platform.logic.js';
import type { PlatformLogicDeps } from './ai-platform.logic.js';
import { DEFAULT_AI_SETTINGS } from './ai-settings.types.js';

describe('ai-platform.logic', () => {
  const eventStore = {
    publish: jest.fn(),
    getEvents: jest.fn().mockResolvedValue([]),
  };
  const bookingRepo = {
    find: jest.fn().mockResolvedValue([{ employeeId: 'e1' }]),
  };
  const agentTaskRepo = {
    find: jest.fn().mockResolvedValue([
      {
        id: 't1',
        intent: 'swap_schedules',
        status: 'pending_validation',
        updatedAt: new Date(Date.now() - 40 * 60 * 1000),
        context: {},
      },
    ]),
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const aiEvents = { emitAlert: jest.fn() };
  const deps = {
    eventStore,
    bookingRepo,
    businessRepo: {},
    agentTaskRepo,
    aiEvents,
  } as unknown as PlatformLogicDeps;

  beforeEach(() => jest.clearAllMocks());

  it('resolves branch context', () => {
    const { scope } = resolveBranchContextLogic(
      { locationId: 'loc-1' },
      DEFAULT_AI_SETTINGS,
    );
    expect(scope.locationId).toBe('loc-1');
  });

  it('gates role and public actions', () => {
    expect(
      gateRoleProfileIntentLogic('receptionist', 'dashboard', 'payment_sweep')
        ?.action,
    ).toBe('security_blocked');
    expect(gatePublicAssistantActionLogic('book_appointment')).toBeNull();
    expect(gatePublicAssistantActionLogic('payment_sweep')?.action).toBe(
      'security_blocked',
    );
  });

  it('applies A/B to suggestions', () => {
    const settings = {
      ...DEFAULT_AI_SETTINGS,
      enterprise: {
        ...DEFAULT_AI_SETTINGS.enterprise,
        abExperiments: [
          {
            id: 'exp',
            name: 'Copy',
            enabled: true,
            suggestionVariants: [
              { id: 'a', title: 'A title', prompt: 'A prompt' },
              { id: 'b', title: 'B title', prompt: 'B prompt' },
            ],
          },
        ],
      },
    };
    const { suggestions } = applyAbToSuggestionsLogic(
      'biz-1',
      [
        {
          id: 'apply-week',
          priority: 'high',
          title: 'Old',
          prompt: 'old',
          category: 'schedule',
        },
        {
          id: 'fill-gaps',
          priority: 'low',
          title: 'Gaps',
          prompt: 'gaps',
          category: 'schedule',
        },
        {
          id: 'other',
          priority: 'low',
          title: 'Other',
          prompt: 'other',
          category: 'booking',
        },
      ],
      settings,
    );
    expect(suggestions[0].title).not.toBe('Old');
    expect(suggestions[1].title).not.toBe('Gaps');
    expect(suggestions[2].title).toBe('Other');
  });

  it('records and aggregates command analytics', async () => {
    await recordCommandOutcomeLogic(deps, {
      businessId: 'biz-1',
      result: { success: true, action: 'list_bookings', summary: 'ok' },
      surface: 'dashboard',
    });
    expect(eventStore.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: EventType.AI_COMMAND_RECORDED }),
    );

    eventStore.getEvents.mockResolvedValueOnce([
      {
        payload: {
          outcome: 'success',
          action: 'list_bookings',
          surface: 'dashboard',
          clarify: false,
          approval: false,
          timestamp: new Date().toISOString(),
        },
      },
    ]);
    const metrics = await getCommandAnalyticsLogic(deps, 'biz-1', 30);
    expect(metrics.totalCommands).toBe(1);
    expect(metrics.successRate).toBe(1);

    eventStore.getEvents.mockResolvedValueOnce([]);
    const defaultPeriod = await getCommandAnalyticsLogic(deps, 'biz-1');
    expect(defaultPeriod.periodDays).toBe(30);
  });

  it('scans stuck tasks for escalation', async () => {
    const stuck = await scanStuckTasksForEscalationLogic(
      deps,
      'biz-1',
      DEFAULT_AI_SETTINGS,
    );
    expect(stuck).toHaveLength(1);
    expect(stuck[0].taskId).toBe('t1');
  });

  it('scopes catalog by branch', async () => {
    const catalog = {
      employees: [{ id: 'e1' } as any, { id: 'e2' } as any],
      services: [],
      customers: [],
      templates: [],
    };
    const unchanged = await applyBranchScopeToCatalogLogic(
      deps,
      'biz-1',
      catalog,
      {},
    );
    expect(unchanged.employees).toHaveLength(2);

    const scoped = await applyBranchScopeToCatalogLogic(
      deps,
      'biz-1',
      catalog,
      { locationId: 'loc-1' },
    );
    expect(scoped.employees).toHaveLength(1);

    bookingRepo.find.mockResolvedValueOnce([]);
    const empty = await applyBranchScopeToCatalogLogic(deps, 'biz-1', catalog, {
      locationId: 'loc-2',
    });
    expect(empty.employees).toHaveLength(0);
  });

  it('rescues vertical intents and filters branch bookings', () => {
    const rescued = rescueVerticalIntentLogic(
      'class capacity fill today',
      'gym_fitness',
      DEFAULT_AI_SETTINGS,
    );
    expect(rescued?.action).toBe('fill_unused_slots');
    expect(
      filterBookingsForBranchLogic([{ locationId: 'a' }, { locationId: 'b' }], {
        locationId: 'a',
      }),
    ).toHaveLength(1);
  });

  it('returns unchanged suggestions when A/B inactive', () => {
    const suggestions = [
      {
        id: 'x',
        priority: 'low' as const,
        title: 't',
        prompt: 'p',
        category: 'booking' as const,
      },
    ];
    expect(
      applyAbToSuggestionsLogic('biz', suggestions, DEFAULT_AI_SETTINGS)
        .variant,
    ).toBeNull();
    const noVariant = applyAbToSuggestionsLogic('biz', suggestions, {
      ...DEFAULT_AI_SETTINGS,
      enterprise: {
        ...DEFAULT_AI_SETTINGS.enterprise,
        abExperiments: [
          { id: 'e', name: 'e', enabled: true, suggestionVariants: [] },
        ],
      },
    });
    expect(noVariant.variant).toBeNull();
  });

  it('ignores tasks that are not stuck yet', async () => {
    agentTaskRepo.find.mockResolvedValueOnce([
      {
        id: 'fresh',
        intent: 'x',
        status: 'pending_validation',
        updatedAt: new Date(),
        context: {},
      },
    ]);
    expect(
      await scanStuckTasksForEscalationLogic(
        deps,
        'biz-1',
        DEFAULT_AI_SETTINGS,
      ),
    ).toHaveLength(0);
  });

  it('skips already escalated tasks', async () => {
    agentTaskRepo.find.mockResolvedValueOnce([
      {
        id: 't2',
        intent: 'x',
        status: 'pending_validation',
        updatedAt: new Date(Date.now() - 40 * 60 * 1000),
        context: { _escalatedAt: 'yes' },
      },
    ]);
    expect(
      await scanStuckTasksForEscalationLogic(
        deps,
        'biz-1',
        DEFAULT_AI_SETTINGS,
      ),
    ).toHaveLength(0);
  });

  it('escalates without persisting when task missing', async () => {
    agentTaskRepo.findOne.mockResolvedValueOnce(null);
    await escalateStuckTaskLogic(deps, 'biz-1', 'missing', 'x', 10);
    expect(agentTaskRepo.save).not.toHaveBeenCalled();
  });

  it('escalates stuck task and marks context', async () => {
    agentTaskRepo.findOne.mockResolvedValue({
      id: 't1',
      context: {},
      businessId: 'biz-1',
    });
    await escalateStuckTaskLogic(deps, 'biz-1', 't1', 'swap_schedules', 40);
    expect(eventStore.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: EventType.AI_TASK_ESCALATED }),
    );
    expect(aiEvents.emitAlert).toHaveBeenCalled();
    expect(agentTaskRepo.save).toHaveBeenCalled();
  });
});
