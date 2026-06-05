import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { ProviderAiCommandService } from './provider-ai-command.service.js';

describe('Sprint 22 provider AI intelligence integration', () => {
  const businessId = 'biz-s22';
  const userId = 'user-s22';
  const mariaId = 'emp-maria';

  let service: ProviderAiCommandService;
  let llm: { isAvailableForBusiness: jest.Mock; completeJson: jest.Mock };
  let providerMobile: {
    resolveMobileAccess: jest.Mock;
    getScopedEmployeeId: jest.Mock;
  };
  let bookingRepo: { find: jest.Mock };
  let employeeRepo: { find: jest.Mock };
  let customerRepo: { createQueryBuilder: jest.Mock };
  let bookingService: { cancel: jest.Mock };
  let planBuilder: { buildFillSlotFromWaitlistPlan: jest.Mock };
  let orchestration: { executePlan: jest.Mock };
  let completionPipeline: {
    mergeProviderSessionContext: jest.Mock;
    normalizeDateParams: jest.Mock;
    buildProviderSessionContext: jest.Mock;
  };

  const teamAccess = {
    viewMode: 'team' as const,
    membershipRole: MemberRole.MANAGER,
    employee: { id: 'mgr-1', name: 'Manager User' },
  };

  beforeEach(() => {
    llm = {
      isAvailableForBusiness: jest.fn(async () => true),
      completeJson: jest.fn(),
    };
    providerMobile = {
      resolveMobileAccess: jest.fn(async () => teamAccess),
      getScopedEmployeeId: jest.fn(() => undefined),
    };
    bookingRepo = { find: jest.fn(async () => []) };
    employeeRepo = {
      find: jest.fn(async () => [
        { id: mariaId, name: 'Maria Lopez', isActive: true },
      ]),
    };
    customerRepo = {
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(async () => [{ id: 'cust-john', name: 'John Smith', tags: ['waitlist'] }]),
      })),
    };
    bookingService = { cancel: jest.fn(async () => undefined) };
    planBuilder = {
      buildFillSlotFromWaitlistPlan: jest.fn(() => ({ steps: [], reasoning: 'fill' })),
    };
    orchestration = {
      executePlan: jest.fn(async () => ({
        success: true,
        summary: 'Offered slot',
        details: { taskId: 'task-1' },
      })),
    };
    completionPipeline = {
      mergeProviderSessionContext: jest.fn((params) => params),
      normalizeDateParams: jest.fn(),
      buildProviderSessionContext: jest.fn(() => ({})),
    };

    service = new ProviderAiCommandService(
      bookingRepo as any,
      employeeRepo as any,
      { find: jest.fn() } as any,
      customerRepo as any,
      { find: jest.fn() } as any,
      bookingService as any,
      {} as any,
      llm as any,
      providerMobile as any,
      completionPipeline as any,
      { emitClarify: jest.fn(), emitTaskCompleted: jest.fn() } as any,
      { handleBlockSchedule: jest.fn() } as any,
      orchestration as any,
      planBuilder as any,
      {
        preflightBlock: jest.fn(() => null),
        enforceAction: jest.fn(() => null),
        stripParams: jest.fn((params) => params),
        applyStaffScope: jest.fn((_tier, _action, params) => params),
      } as any,
    );
  });

  function mockIntent(action: string, params: Record<string, unknown> = {}) {
    llm.completeJson.mockResolvedValue({
      action,
      params,
      reasoning: 'test',
    });
  }

  it('applies entity memory aliases from gateway context into params', async () => {
    mockIntent('list_bookings', {});
    bookingRepo.find.mockResolvedValue([]);
    completionPipeline.buildProviderSessionContext.mockImplementation((params) => params);

    await service.executeCommand(
      businessId,
      userId,
      'Show gevorg facemassage today',
      [],
      {
        _entityMemoryAliases: {
          gevorg: { employeeName: 'Gevorg' },
          facemassage: { serviceName: 'Face massage' },
        },
      },
    );

    expect(completionPipeline.buildProviderSessionContext).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeName: 'Gevorg',
        serviceName: 'Face massage',
      }),
    );
  });

  it('includes intelligence blocks in classifier prompt', async () => {
    mockIntent('summarize_day', { date: '02/06/2026' });
    bookingRepo.find.mockResolvedValue([]);

    await service.executeCommand(businessId, userId, 'Summarize today', [], {
      _entityMemoryBlock: 'alias memory',
      _conversationSummary: 'Earlier: user asked about Maria',
      _ragContextBlock: 'SOP: offer waitlist first',
    });

    const classifierPrompt = llm.completeJson.mock.calls[0][1] as string;
    expect(classifierPrompt).toContain('alias memory');
    expect(classifierPrompt).toContain('Earlier: user asked about Maria');
    expect(classifierPrompt).toContain('SOP: offer waitlist first');
  });

  it('returns coordination confirmation for manager team view', async () => {
    const start = new Date(Date.now() + 3 * 60 * 60 * 1000);
    bookingRepo.find.mockResolvedValue([
      {
        id: 'b-maria',
        employeeId: mariaId,
        serviceId: 'svc-1',
        startTime: start,
        endTime: new Date(start.getTime() + 3_600_000),
        status: BookingStatus.CONFIRMED,
        customer: { name: 'Alice' },
        service: { name: 'Massage' },
      },
    ]);
    mockIntent('coordinate_waitlist_offer', {
      employeeName: 'Maria',
      waitlistCustomerName: 'John',
      date: '02/06/2026',
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'If Maria cancels, offer slot to waitlist customer John',
    );

    expect(result.action).toBe('coordinate_waitlist_offer');
    expect(result.details.requiresConfirmation).toBe(true);
    expect(result.summary).toContain('John');
  });

  it('executes coordination when confirmed', async () => {
    const start = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const booking = {
      id: 'b-maria',
      employeeId: mariaId,
      serviceId: 'svc-1',
      startTime: start,
      endTime: new Date(start.getTime() + 3_600_000),
      status: BookingStatus.CONFIRMED,
      customer: { name: 'Alice' },
      service: { name: 'Massage' },
    };
    bookingRepo.find.mockResolvedValue([booking]);
    mockIntent('coordinate_waitlist_offer', {
      employeeName: 'Maria',
      waitlistCustomerName: 'John',
      date: '02/06/2026',
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'If Maria cancels, offer slot to waitlist customer John',
      [],
      { confirmed: true },
    );

    expect(bookingService.cancel).toHaveBeenCalledWith('b-maria', expect.any(String), userId);
    expect(planBuilder.buildFillSlotFromWaitlistPlan).toHaveBeenCalled();
    expect(orchestration.executePlan).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.summary).toContain('John');
  });

  it('denies coordination for staff role', async () => {
    providerMobile.resolveMobileAccess.mockResolvedValue({
      viewMode: 'provider',
      membershipRole: MemberRole.STAFF,
      employee: { id: mariaId, name: 'Maria Lopez' },
    });
    providerMobile.getScopedEmployeeId.mockReturnValue(mariaId);
    mockIntent('coordinate_waitlist_offer', {
      employeeName: 'Maria',
      waitlistCustomerName: 'John',
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'If Maria cancels, offer slot to waitlist customer John',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('not allowed for your role');
  });

  it('treats manager provider view as staff tier for coordination access', async () => {
    providerMobile.resolveMobileAccess.mockResolvedValue({
      viewMode: 'provider',
      membershipRole: MemberRole.MANAGER,
      employee: { id: 'mgr-1', name: 'Manager User' },
    });
    mockIntent('coordinate_waitlist_offer', {
      employeeName: 'Maria',
      waitlistCustomerName: 'John',
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'If Maria cancels, offer slot to waitlist customer John',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('not allowed for your role (staff)');
  });

  it('rescues coordination intent from unknown classifier output', async () => {
    mockIntent('unknown', {});
    bookingRepo.find.mockResolvedValue([]);

    const result = await service.executeCommand(
      businessId,
      userId,
      'If Maria cancels, offer slot to waitlist customer John',
    );

    expect(result.action).toBe('coordinate_waitlist_offer');
    expect(result.summary).toContain('No provider found');
  });

  it('reports unknown provider for coordination', async () => {
    employeeRepo.find.mockResolvedValue([]);
    mockIntent('coordinate_waitlist_offer', {
      employeeName: 'Missing',
      waitlistCustomerName: 'John',
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'If Missing cancels, offer slot to waitlist customer John',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('No provider found matching "Missing"');
  });

  it('reports empty waitlist for coordination', async () => {
    customerRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => []),
    });
    mockIntent('coordinate_waitlist_offer', {
      employeeName: 'Maria',
      waitlistCustomerName: 'John',
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'If Maria cancels, offer slot to waitlist customer John',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('No waitlist customers found');
  });

  it('reports missing waitlist customer when tags exist but name does not match', async () => {
    customerRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => [{ id: 'cust-sam', name: 'Sam Waitlist', tags: ['waitlist'] }]),
    });
    mockIntent('coordinate_waitlist_offer', {
      employeeName: 'Maria',
      waitlistCustomerName: 'John',
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'If Maria cancels, offer slot to waitlist customer John',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('No waitlist customer found matching "John"');
  });

  it('reports no upcoming appointments to coordinate', async () => {
    bookingRepo.find.mockResolvedValue([]);
    mockIntent('coordinate_waitlist_offer', {
      employeeName: 'Maria',
      waitlistCustomerName: 'John',
      date: '02/06/2026',
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'If Maria cancels, offer slot to waitlist customer John',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('No upcoming appointments found for Maria Lopez');
  });

  it('requires confirmation when multiple appointments match', async () => {
    const start = new Date(Date.now() + 3 * 60 * 60 * 1000);
    bookingRepo.find.mockResolvedValue([
      {
        id: 'b-1',
        employeeId: mariaId,
        serviceId: 'svc-1',
        startTime: start,
        endTime: new Date(start.getTime() + 3_600_000),
        status: BookingStatus.CONFIRMED,
        customer: { name: 'Alice' },
        service: { name: 'Massage' },
      },
      {
        id: 'b-2',
        employeeId: mariaId,
        serviceId: 'svc-1',
        startTime: new Date(start.getTime() + 7_200_000),
        endTime: new Date(start.getTime() + 10_800_000),
        status: BookingStatus.CONFIRMED,
        customer: { name: 'Bob' },
        service: { name: 'Massage' },
      },
    ]);
    mockIntent('coordinate_waitlist_offer', {
      employeeName: 'Maria',
      waitlistCustomerName: 'John',
      date: '02/06/2026',
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'If Maria cancels, offer slot to waitlist customer John',
      [],
      { confirmed: true },
    );

    expect(result.details.requiresConfirmation).toBe(true);
    expect(result.summary).toContain('2 appointments');
  });

  it('returns orchestration failure summary when waitlist fill fails', async () => {
    const start = new Date(Date.now() + 3 * 60 * 60 * 1000);
    bookingRepo.find.mockResolvedValue([
      {
        id: 'b-maria',
        employeeId: mariaId,
        serviceId: 'svc-1',
        startTime: start,
        endTime: new Date(start.getTime() + 3_600_000),
        status: BookingStatus.CONFIRMED,
        customer: { name: 'Alice' },
        service: { name: 'Massage' },
      },
    ]);
    orchestration.executePlan.mockResolvedValue({
      success: false,
      summary: 'Slot already taken',
      details: {},
    });
    mockIntent('coordinate_waitlist_offer', {
      employeeName: 'Maria',
      waitlistCustomerName: 'John',
      date: '02/06/2026',
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'If Maria cancels, offer slot to waitlist customer John',
      [],
      { confirmed: true },
    );

    expect(result.success).toBe(false);
    expect(result.summary).toBe('Slot already taken');
  });
});
