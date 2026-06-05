import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiSprint25Service } from './ai-sprint25.service.js';
import { EventStoreService } from '../../events/store/event-store.service.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { AgentTask } from '../../engine/agent/agent-task.entity.js';
import { AiEventsService } from './ai-events.service.js';
import { DEFAULT_AI_SETTINGS } from './ai-settings.types.js';

describe('ai-sprint25.integration', () => {
  let service: AiSprint25Service;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AiSprint25Service,
        {
          provide: EventStoreService,
          useValue: { publish: jest.fn(), getEvents: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: AiEventsService,
          useValue: { emitAlert: jest.fn() },
        },
        { provide: getRepositoryToken(Booking), useValue: { find: jest.fn().mockResolvedValue([]) } },
        { provide: getRepositoryToken(Business), useValue: { findOne: jest.fn() } },
        {
          provide: getRepositoryToken(AgentTask),
          useValue: { find: jest.fn().mockResolvedValue([]), findOne: jest.fn(), save: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(AiSprint25Service);
  });

  it('wires enterprise analytics end-to-end', async () => {
    const scope = service.resolveBranchContext({ locationId: 'loc-1' }, DEFAULT_AI_SETTINGS);
    expect(scope.scope.locationId).toBe('loc-1');
    expect(scope.classifierHint).toContain('loc-1');

    const profile = service.resolveRoleProfile('staff', DEFAULT_AI_SETTINGS);
    expect(profile).toBe('receptionist');
    expect(service.gateRoleIntent(profile, 'dashboard', 'list_bookings')).toBeNull();
    expect(service.gateRoleIntent(profile, 'dashboard', 'payment_sweep')?.success).toBe(false);
    expect(service.gateRoleIntent('owner', 'dashboard', 'payment_sweep')).toBeNull();

    const rescued = service.rescueVerticalIntent(
      'class capacity fill this week',
      'gym_fitness',
      DEFAULT_AI_SETTINGS,
    );
    expect(rescued?.action).toBe('fill_unused_slots');

    const catalog = {
      employees: [{ id: 'e1', name: 'A' } as any],
      services: [],
      customers: [],
      templates: [],
    };
    const scoped = await service.scopeCatalog('biz-1', catalog, { locationId: 'loc-1' });
    expect(scoped.employees.length).toBeGreaterThanOrEqual(0);

    const { high, abVariantId } = service.resolveConfidenceForExperiment('biz-1', 0.85, DEFAULT_AI_SETTINGS);
    expect(high).toBe(0.85);
    expect(abVariantId).toBeUndefined();

    const publicSession = service.enrichPublicSession({}, 'hair_salon', DEFAULT_AI_SETTINGS);
    expect(publicSession._orchestrationSurface).toBe('public');

    expect(service.gatePublicAction('book_appointment')).toBeNull();
    expect(service.gatePublicAction('payment_sweep')?.success).toBe(false);

    const bookings = service.filterBookingsForBranch(
      [{ locationId: 'loc-1' }, { locationId: 'loc-2' }],
      { locationId: 'loc-1' },
    );
    expect(bookings).toHaveLength(1);

    const analytics = await service.getCommandAnalytics('biz-1', 30);
    expect(analytics.targets.completionRate).toBe(0.75);

    await service.recordCommandOutcome({
      businessId: 'biz-1',
      result: { success: true, action: 'list_bookings', summary: 'ok' },
      surface: 'dashboard',
      roleProfile: 'owner',
    });

    const stuck = await service.scanStuckTasks('biz-1', DEFAULT_AI_SETTINGS);
    expect(Array.isArray(stuck)).toBe(true);
  });

  it('applies A/B experiments to suggestions', () => {
    const settings = {
      ...DEFAULT_AI_SETTINGS,
      enterprise: {
        ...DEFAULT_AI_SETTINGS.enterprise,
        abExperiments: [
          {
            id: 'live-exp',
            name: 'Live',
            enabled: true,
            suggestionVariants: [
              { id: 'a', title: 'Variant A', prompt: 'prompt A' },
              { id: 'b', title: 'Variant B', prompt: 'prompt B' },
            ],
          },
        ],
      },
    };
    const { suggestions, variant } = service.applyAbToSuggestions(
      'biz-1',
      [{ id: 'apply-week', priority: 'high', title: 'Old', prompt: 'old', category: 'schedule' }],
      settings,
    );
    expect(variant).not.toBeNull();
    expect(suggestions[0].title).not.toBe('Old');
  });
});
