import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { createProviderAiCommandHarness } from './provider-ai-command.integration.harness.js';

describe('provider AI visit status lifecycle (ai-cmd-provider-5.16)', () => {
  const businessId = 'biz-516';
  const userId = 'user-516';
  const employeeId = 'emp-516';

  const staffAccess = {
    viewMode: 'provider' as const,
    membershipRole: MemberRole.STAFF,
    employee: { id: employeeId, name: 'Alex Provider' },
  };

  let providerMobile: {
    resolveMobileAccess: jest.Mock<any>;
    getScopedEmployeeId: jest.Mock<any>;
  };

  beforeEach(() => {
    providerMobile = {
      resolveMobileAccess: jest.fn(async () => staffAccess),
      getScopedEmployeeId: jest.fn(() => employeeId),
    };
  });

  it('dispatches mark_visit_in_progress and sets status=in_progress (ai-cmd-provider-5.16.2)', async () => {
    const bookingRepo = {
      find: jest.fn(async () => [
        {
          id: 'bk-1',
          businessId,
          status: 'confirmed',
          customer: { name: 'Jane' },
        },
      ]),
    };
    const bookingService = { update: jest.fn(async (..._args: any[]) => ({})) };
    const service = createProviderAiCommandHarness({
      providerMobile,
      bookingRepo,
      employeeRepo: { find: jest.fn(async () => []) },
      bookingService,
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      "Begin Jane's color",
      [],
      { confirmed: true },
    );

    expect(result.action).toBe('mark_visit_in_progress');
    expect(bookingService.update).toHaveBeenCalledWith(
      'bk-1',
      expect.objectContaining({ status: 'in_progress' }),
      userId,
    );
  });

  it('e2e-bug.263: untargeted mark_visit_in_progress clarifies instead of bulk-updating', async () => {
    const bookingRepo = {
      find: jest.fn(async () => [
        {
          id: 'bk-a',
          businessId,
          status: 'confirmed',
          customer: { name: 'Ada' },
        },
        {
          id: 'bk-b',
          businessId,
          status: 'confirmed',
          customer: { name: 'Bea' },
        },
        {
          id: 'bk-c',
          businessId,
          status: 'confirmed',
          customer: { name: 'Cid' },
        },
      ]),
    };
    const bookingService = { update: jest.fn(async (..._args: any[]) => ({})) };
    const service = createProviderAiCommandHarness({
      providerMobile,
      bookingRepo,
      employeeRepo: { find: jest.fn(async () => []) },
      bookingService,
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Start appointment now',
      [],
      { confirmed: true },
    );

    expect(result.action).toBe('mark_visit_in_progress');
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
    expect(String(result.summary)).toMatch(/Which client/i);
    expect(bookingService.update).not.toHaveBeenCalled();
  });

  it('e2e-bug.263: untargeted mark_visit_complete clarifies instead of bulk-updating', async () => {
    const bookingRepo = {
      find: jest.fn(async () => [
        {
          id: 'bk-a',
          businessId,
          status: 'in_progress',
          customer: { name: 'Ada' },
        },
        {
          id: 'bk-b',
          businessId,
          status: 'in_progress',
          customer: { name: 'Bea' },
        },
      ]),
    };
    const bookingService = { update: jest.fn(async (..._args: any[]) => ({})) };
    const service = createProviderAiCommandHarness({
      providerMobile,
      bookingRepo,
      employeeRepo: { find: jest.fn(async () => []) },
      bookingService,
      llm: {
        isAvailableForBusiness: jest.fn(async () => true),
        completeJson: jest.fn(async () => ({
          action: 'mark_visit_complete',
          params: { status: 'completed' },
          reasoning: 'test',
          confidence: 0.95,
        })),
      },
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Mark visit complete',
      [],
      { confirmed: true },
    );

    expect(result.action).toBe('mark_visit_complete');
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
    expect(bookingService.update).not.toHaveBeenCalled();
  });

  it('e2e-bug.263: session bookingId updates only that appointment among many', async () => {
    const bookingRepo = {
      find: jest.fn(async (query: any) => {
        const rows = [
          {
            id: 'bk-target',
            businessId,
            status: 'confirmed',
            customer: { name: 'Target' },
          },
          {
            id: 'bk-other',
            businessId,
            status: 'confirmed',
            customer: { name: 'Other' },
          },
        ];
        if (typeof query?.where?.id === 'string') {
          return rows.filter((b) => b.id === query.where.id);
        }
        return rows;
      }),
    };
    const bookingService = { update: jest.fn(async (..._args: any[]) => ({})) };
    const service = createProviderAiCommandHarness({
      providerMobile,
      bookingRepo,
      employeeRepo: { find: jest.fn(async () => []) },
      bookingService,
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Start appointment now',
      [],
      { confirmed: true, bookingId: 'bk-target' },
    );

    expect(result.action).toBe('mark_visit_in_progress');
    expect(result.success).toBe(true);
    expect(bookingService.update).toHaveBeenCalledTimes(1);
    expect(bookingService.update).toHaveBeenCalledWith(
      'bk-target',
      expect.objectContaining({ status: 'in_progress' }),
      userId,
    );
  });

  it('dispatches confirm_pending_booking and only touches pending bookings (ai-cmd-provider-5.16.4)', async () => {
    const bookingRepo = {
      find: jest.fn(async () => [
        {
          id: 'bk-pending',
          businessId,
          status: 'pending',
          customer: { name: 'Maria' },
        },
        {
          id: 'bk-confirmed',
          businessId,
          status: 'confirmed',
          customer: { name: 'Sam' },
        },
      ]),
    };
    const bookingService = { update: jest.fn(async (..._args: any[]) => ({})) };
    const service = createProviderAiCommandHarness({
      providerMobile,
      bookingRepo,
      employeeRepo: { find: jest.fn(async () => []) },
      bookingService,
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Confirm all pending today',
      [],
      { confirmed: true },
    );

    expect(result.action).toBe('confirm_pending_booking');
    expect(bookingService.update).toHaveBeenCalledTimes(1);
    expect(bookingService.update).toHaveBeenCalledWith(
      'bk-pending',
      expect.objectContaining({ status: 'confirmed' }),
      userId,
    );
  });

  it('dispatches explain_booking_status_badge with a static explainer (ai-cmd-provider-5.16.5)', async () => {
    const service = createProviderAiCommandHarness({ providerMobile });

    const result = await service.executeCommand(
      businessId,
      userId,
      'What does pending mean?',
      [],
    );

    expect(result.action).toBe('explain_booking_status_badge');
    expect(result.success).toBe(true);
    expect(result.summary).toContain('Pending');
  });

  it('dispatches explain_floor_status with a static explainer (ai-cmd-provider-5.16.6)', async () => {
    const service = createProviderAiCommandHarness({ providerMobile });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Waiting vs in service?',
      [],
    );

    expect(result.action).toBe('explain_floor_status');
    expect(result.success).toBe(true);
    expect(result.summary).toContain('floor strip');
  });

  it('e2e-bug.264: resolves mark_multi_service_step_done via customerName without bookingId', async () => {
    const dayBookings = [
      {
        id: 'bk-leg-1',
        businessId,
        multiServiceGroupId: 'grp-spa',
        status: 'confirmed',
        customer: { name: 'Spa Day QA' },
        service: { name: 'Blowdry' },
        startTime: new Date(),
      },
      {
        id: 'bk-leg-2',
        businessId,
        multiServiceGroupId: 'grp-spa',
        status: 'confirmed',
        customer: { name: 'Spa Day QA' },
        service: { name: 'Manicure' },
        startTime: new Date(Date.now() + 3600_000),
      },
    ];
    const bookingRepo = {
      find: jest.fn(async (query: any) => {
        if (typeof query?.where?.id === 'string') {
          return dayBookings.filter((b) => b.id === query.where.id);
        }
        if (query?.where?.multiServiceGroupId === 'grp-spa') {
          return dayBookings;
        }
        // day scan for customerName resolution
        return dayBookings;
      }),
      findOne: jest.fn(async ({ where }: any) =>
        dayBookings.find((b) => b.id === where?.id) ?? null,
      ),
    };
    const bookingService = { update: jest.fn(async (..._args: any[]) => ({})) };
    const service = createProviderAiCommandHarness({
      providerMobile,
      bookingRepo,
      employeeRepo: { find: jest.fn(async () => []) },
      bookingService,
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Finish step 1 for Spa Day QA',
      [],
      { confirmed: true },
    );

    expect(result.action).toBe('mark_multi_service_step_done');
    expect(result.success).toBe(true);
    expect(bookingService.update).toHaveBeenCalledTimes(1);
    expect(bookingService.update).toHaveBeenCalledWith(
      'bk-leg-1',
      expect.objectContaining({ status: 'completed' }),
      userId,
    );
  });

  it('e2e-bug.264: prefers prompt serviceName over wrong LLM params', async () => {
    const dayBookings = [
      {
        id: 'bk-leg-1',
        businessId,
        multiServiceGroupId: 'grp-spa',
        status: 'confirmed',
        customer: { name: 'Spa Day QA' },
        service: { name: 'hairdrying' },
        startTime: new Date(),
      },
      {
        id: 'bk-leg-2',
        businessId,
        multiServiceGroupId: 'grp-spa',
        status: 'confirmed',
        customer: { name: 'Spa Day QA' },
        service: { name: 'hairstyle' },
        startTime: new Date(Date.now() + 3600_000),
      },
    ];
    const bookingRepo = {
      find: jest.fn(async (query: any) => {
        if (query?.where?.multiServiceGroupId === 'grp-spa') return dayBookings;
        return dayBookings;
      }),
      findOne: jest.fn(async ({ where }: any) =>
        dayBookings.find((b) => b.id === where?.id) ?? null,
      ),
    };
    const bookingService = { update: jest.fn(async (..._args: any[]) => ({})) };
    const service = createProviderAiCommandHarness({
      providerMobile,
      bookingRepo,
      employeeRepo: { find: jest.fn(async () => []) },
      bookingService,
      llm: {
        isAvailableForBusiness: jest.fn(async () => true),
        completeJson: jest.fn(async () => ({
          action: 'mark_multi_service_step_done',
          // Wrong leg from classifier — prompt says hairdrying.
          params: { serviceName: 'hairstyle', stepIndex: 2 },
          confidence: 0.95,
          reasoning: 'test',
        })),
      },
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Complete hairdrying leg for Spa Day QA',
      [],
      { confirmed: true },
    );

    expect(result.action).toBe('mark_multi_service_step_done');
    expect(result.success).toBe(true);
    expect(bookingService.update).toHaveBeenCalledWith(
      'bk-leg-1',
      expect.objectContaining({ status: 'completed' }),
      userId,
    );
  });

  it('e2e-bug.264: clarifies when customerName matches multiple multi-service groups', async () => {
    const dayBookings = [
      {
        id: 'bk-a1',
        businessId,
        multiServiceGroupId: 'grp-a',
        status: 'confirmed',
        customer: { name: 'Twin Group QA' },
        service: { name: 'Blowdry' },
        startTime: new Date(),
      },
      {
        id: 'bk-a2',
        businessId,
        multiServiceGroupId: 'grp-a',
        status: 'confirmed',
        customer: { name: 'Twin Group QA' },
        service: { name: 'Manicure' },
        startTime: new Date(Date.now() + 3600_000),
      },
      {
        id: 'bk-b1',
        businessId,
        multiServiceGroupId: 'grp-b',
        status: 'confirmed',
        customer: { name: 'Twin Group QA' },
        service: { name: 'Blowdry' },
        startTime: new Date(Date.now() + 2 * 3600_000),
      },
      {
        id: 'bk-b2',
        businessId,
        multiServiceGroupId: 'grp-b',
        status: 'confirmed',
        customer: { name: 'Twin Group QA' },
        service: { name: 'Manicure' },
        startTime: new Date(Date.now() + 3 * 3600_000),
      },
    ];
    const bookingRepo = {
      find: jest.fn(async () => dayBookings),
      findOne: jest.fn(async () => null),
    };
    const bookingService = { update: jest.fn(async (..._args: any[]) => ({})) };
    const service = createProviderAiCommandHarness({
      providerMobile,
      bookingRepo,
      employeeRepo: { find: jest.fn(async () => []) },
      bookingService,
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Finish step 1 for Twin Group QA',
      [],
      { confirmed: true },
    );

    expect(result.action).toBe('mark_multi_service_step_done');
    expect(result.success).toBe(false);
    expect(String(result.summary)).toMatch(/found 2 multi-service/i);
    expect(bookingService.update).not.toHaveBeenCalled();
  });

  it('dispatches mark_multi_service_step_done by stepIndex, touching only that leg (ai-cmd-provider-5.18.3)', async () => {
    const anchor = {
      id: 'bk-anchor',
      businessId,
      multiServiceGroupId: 'grp-1',
    };
    const siblings = [
      {
        id: 'bk-leg-1',
        businessId,
        status: 'confirmed',
        customer: { name: 'Jane' },
        service: { name: 'Blowdry' },
      },
      {
        id: 'bk-leg-2',
        businessId,
        status: 'confirmed',
        customer: { name: 'Jane' },
        service: { name: 'Manicure' },
      },
    ];
    const bookingRepo = {
      findOne: jest.fn(async () => anchor),
      find: jest.fn(async (query: any) =>
        typeof query?.where?.id === 'string'
          ? siblings.filter((b) => b.id === query.where.id)
          : siblings,
      ),
    };
    const bookingService = { update: jest.fn(async (..._args: any[]) => ({})) };
    const service = createProviderAiCommandHarness({
      providerMobile,
      bookingRepo,
      employeeRepo: { find: jest.fn(async () => []) },
      bookingService,
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Finish step 1 of spa day',
      [],
      { confirmed: true, bookingId: 'bk-anchor' },
    );

    expect(result.action).toBe('mark_multi_service_step_done');
    expect(bookingService.update).toHaveBeenCalledTimes(1);
    expect(bookingService.update).toHaveBeenCalledWith(
      'bk-leg-1',
      expect.objectContaining({ status: 'completed' }),
      userId,
    );
  });

  it('dispatches mark_multi_service_step_done by serviceName (ai-cmd-provider-5.18.3)', async () => {
    const anchor = {
      id: 'bk-anchor',
      businessId,
      multiServiceGroupId: 'grp-1',
    };
    const siblings = [
      {
        id: 'bk-leg-1',
        businessId,
        status: 'confirmed',
        customer: { name: 'Jane' },
        service: { name: 'Blowdry' },
      },
      {
        id: 'bk-leg-2',
        businessId,
        status: 'confirmed',
        customer: { name: 'Jane' },
        service: { name: 'Manicure' },
      },
    ];
    const bookingRepo = {
      findOne: jest.fn(async () => anchor),
      find: jest.fn(async (query: any) =>
        typeof query?.where?.id === 'string'
          ? siblings.filter((b) => b.id === query.where.id)
          : siblings,
      ),
    };
    const bookingService = { update: jest.fn(async (..._args: any[]) => ({})) };
    const service = createProviderAiCommandHarness({
      providerMobile,
      bookingRepo,
      employeeRepo: { find: jest.fn(async () => []) },
      bookingService,
    });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Complete blowdry leg',
      [],
      { confirmed: true, bookingId: 'bk-anchor' },
    );

    expect(result.action).toBe('mark_multi_service_step_done');
    expect(bookingService.update).toHaveBeenCalledTimes(1);
    expect(bookingService.update).toHaveBeenCalledWith(
      'bk-leg-1',
      expect.objectContaining({ status: 'completed' }),
      userId,
    );
  });
});
