import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiCommandTraceService } from './ai-command-trace.service.js';
import { AiCommandTrace } from './entities/ai-command-trace.entity.js';

describe('AiCommandTraceService (pipe-1.10.1)', () => {
  const saved: AiCommandTrace[] = [];
  const traceRepo = {
    create: (payload: Partial<AiCommandTrace>) => payload,
    save: async (entity: Partial<AiCommandTrace>) => {
      const row = {
        id: `trace-row-${saved.length + 1}`,
        createdAt: new Date('2026-06-12T12:00:00.000Z'),
        ...entity,
      } as AiCommandTrace;
      saved.push(row);
      return row;
    },
    find: async () => saved,
  };

  let service: AiCommandTraceService;

  beforeEach(async () => {
    saved.length = 0;
    const moduleRef = await Test.createTestingModule({
      providers: [
        AiCommandTraceService,
        { provide: getRepositoryToken(AiCommandTrace), useValue: traceRepo },
      ],
    }).compile();
    service = moduleRef.get(AiCommandTraceService);
  });

  it('persists redacted trace rows', async () => {
    const row = await service.record({
      businessId: 'biz-1',
      surface: 'dashboard',
      promptRaw: 'Clear Gevorg schedule tomorrow',
      action: 'clear_schedule',
      confidence: 0.88,
      params: { employeeName: 'Gevorg', _availableServices: 'Haircut' },
      routingTier: 'simple_mutate',
      candidateSource: 'fast_heuristic',
      result: { success: true, action: 'clear_schedule', details: {} },
      pipelineTrace: [
        {
          stage: 'rescue',
          action: 'clear_schedule',
          at: '2026-06-12T12:00:00.000Z',
        },
      ],
    });

    expect(row.id).toMatch(/^trace-row-/);
    expect(row.source).toBe('deterministic');
    expect(row.outcome).toBe('executed');
    expect(row.params).toEqual({ employeeName: 'Gevorg' });
    expect(saved).toHaveLength(1);
  });

  it('recordFireAndForget does not throw on repository failure', async () => {
    const failingRepo = {
      create: traceRepo.create,
      save: async () => {
        throw new Error('db unavailable');
      },
      find: traceRepo.find,
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AiCommandTraceService,
        { provide: getRepositoryToken(AiCommandTrace), useValue: failingRepo },
      ],
    }).compile();
    const failingService = moduleRef.get(AiCommandTraceService);

    expect(() =>
      failingService.recordFireAndForget({
        businessId: 'biz-1',
        surface: 'customer',
        promptRaw: 'my appointments',
        action: 'my_appointments',
        result: { success: true, action: 'my_appointments', details: {} },
      }),
    ).not.toThrow();

    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  it('findRecentByBusiness returns persisted rows', async () => {
    await service.record({
      businessId: 'biz-1',
      surface: 'dashboard',
      promptRaw: 'List bookings',
      action: 'list_bookings',
      result: { success: true, action: 'list_bookings', details: {} },
    });

    const rows = await service.findRecentByBusiness('biz-1', 30, 10);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.action).toBe('list_bookings');
  });
});
