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
