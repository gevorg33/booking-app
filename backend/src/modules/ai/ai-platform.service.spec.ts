import { AiPlatformService } from './ai-platform.service.js';
import { DEFAULT_AI_SETTINGS } from './ai-settings.types.js';

describe('AiPlatformService', () => {
  const eventStore = {
    publish: jest.fn(),
    getEvents: jest.fn().mockResolvedValue([]),
  };
  const aiEvents = { emitAlert: jest.fn() };
  const bookingRepo = { find: jest.fn().mockResolvedValue([]) };
  const businessRepo = {};
  const agentTaskRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const commandTrace = {
    getAccuracyAnalytics: jest.fn().mockResolvedValue({
      periodDays: 30,
      totalCommands: 0,
      noClarifyCompletionRate: 0,
      clarifyRate: 0,
      misclassificationRate: 0,
      explicitNegativeRate: 0,
      byIntent: {},
      byLocale: {},
      bySurface: {},
      confusionMatrix: [],
      worstPrompts: [],
      accuracySlo: {
        target: 0.99,
        rolling7DayAccuracy: 0,
        weeklyDelta: 0,
        alert: false,
        trend: [],
      },
    }),
  };

  const service = new AiPlatformService(
    eventStore as any,
    aiEvents as any,
    commandTrace as any,
    bookingRepo as any,
    businessRepo as any,
    agentTaskRepo as any,
  );

  it('delegates to logic helpers', () => {
    expect(service.resolveRoleProfile('staff', DEFAULT_AI_SETTINGS)).toBe(
      'receptionist',
    );
    expect(service.gatePublicAction('book_appointment')).toBeNull();
    expect(
      service.buildVerticalHints('hair_salon', DEFAULT_AI_SETTINGS),
    ).toContain('Salon');
  });

  it('records analytics', async () => {
    await service.recordCommandOutcome({
      businessId: 'biz-1',
      result: { success: true, action: 'x', summary: 'ok' },
      surface: 'dashboard',
    });
    expect(eventStore.publish).toHaveBeenCalled();
  });

  it('scopes catalog and scans stuck tasks', async () => {
    const catalog = {
      employees: [],
      services: [],
      customers: [],
      templates: [],
    };
    await service.scopeCatalog('biz-1', catalog, { locationId: 'loc' });
    expect(bookingRepo.find).toHaveBeenCalled();
    await service.getCommandAnalytics('biz-1', 14);
    await service.scanStuckTasks('biz-1', DEFAULT_AI_SETTINGS);
  });

  it('covers remaining service delegates', async () => {
    expect(
      service.resolveBranchContext(
        { locationName: 'Main' },
        DEFAULT_AI_SETTINGS,
      ).scope.locationName,
    ).toBe('Main');
    expect(
      service.rescueVerticalIntent(
        'color senior',
        'hair_salon',
        DEFAULT_AI_SETTINGS,
      )?.action,
    ).toBe('staff_service_matrix');
    expect(
      service.filterBookingsForBranch([{ locationId: 'a' }], {}),
    ).toHaveLength(1);
    const { suggestions } = service.applyAbToSuggestions(
      'biz',
      [],
      DEFAULT_AI_SETTINGS,
    );
    expect(suggestions).toEqual([]);
    expect(
      service.resolveConfidenceForExperiment('biz', 0.8, DEFAULT_AI_SETTINGS)
        .high,
    ).toBe(0.8);
    expect(
      service.enrichPublicSession(undefined, 'hair_salon', DEFAULT_AI_SETTINGS)
        ._verticalPlugin,
    ).toBe('salon');
    await service.escalateStuckTask('biz-1', 't1', 'swap_schedules', 45);
    expect(eventStore.publish).toHaveBeenCalled();
  });
});
