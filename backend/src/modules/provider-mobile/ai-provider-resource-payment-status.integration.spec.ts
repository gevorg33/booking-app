import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { createProviderAiCommandHarness } from './provider-ai-command.integration.harness.js';

describe('provider AI resource + payment-status dispatch (ai-cmd-provider-6.15.6)', () => {
  const businessId = 'biz-6156';
  const userId = 'user-6156';
  const employeeId = 'emp-6156';

  let service: ReturnType<typeof createProviderAiCommandHarness>;
  let llm: { isAvailableForBusiness: jest.Mock; completeJson: jest.Mock<any> };

  const staffAccess = {
    viewMode: 'provider' as const,
    membershipRole: MemberRole.STAFF,
    employee: { id: employeeId, name: 'Alex Provider' },
  };

  function buildService(
    action: string,
    params: Record<string, unknown>,
    overrides: Record<string, any> = {},
  ) {
    llm = {
      isAvailableForBusiness: jest.fn(async () => true),
      completeJson: jest.fn(async () => ({
        action,
        params,
        reasoning: 'test',
      })),
    };
    return createProviderAiCommandHarness({
      llm,
      providerMobile: {
        resolveMobileAccess: jest.fn(async () => staffAccess),
        getScopedEmployeeId: jest.fn(() => employeeId),
      },
      ...overrides,
    });
  }

  it('dispatches my_resource_assignments with the session employee scoped', async () => {
    const handleMyResourceAssignments = jest.fn(
      async (_businessId: string, _params: Record<string, unknown>) => ({
        success: true,
        action: 'my_resource_assignments',
        summary: '2 resource(s) assigned this week.',
        details: {},
      }),
    );
    service = buildService(
      'my_resource_assignments',
      {},
      { scheduleResources: { handleMyResourceAssignments } },
    );

    const result = await service.executeCommand(
      businessId,
      userId,
      'What resources am I assigned to this week?',
      [],
    );

    expect(result.success).toBe(true);
    expect(handleMyResourceAssignments).toHaveBeenCalledWith(
      businessId,
      expect.objectContaining({ sessionEmployeeId: employeeId }),
    );
  });

  it('dispatches block_resource_unavailable', async () => {
    const handleBlockResourceUnavailable = jest.fn(
      async (_businessId: string, _params: Record<string, unknown>) => ({
        success: true,
        action: 'block_resource_unavailable',
        summary: '"Room 2" marked unavailable.',
        details: { resourceId: 'res-1' },
      }),
    );
    service = buildService(
      'block_resource_unavailable',
      { resourceName: 'Room 2' },
      { scheduleResources: { handleBlockResourceUnavailable } },
    );

    const result = await service.executeCommand(
      businessId,
      userId,
      'Mark Room 2 unavailable',
      [],
    );

    expect(result.success).toBe(true);
    expect(handleBlockResourceUnavailable).toHaveBeenCalledWith(
      businessId,
      expect.objectContaining({ resourceName: 'Room 2' }),
    );
  });

  it('dispatches explain_payment_status through AiPaymentsService.dispatchIntent', async () => {
    const dispatchIntent = jest.fn(async (_ctx: Record<string, unknown>) => ({
      success: true,
      action: 'explain_payment_status',
      summary: 'Paid.',
      details: { bookingId: 'b1' },
    }));
    service = buildService(
      'explain_payment_status',
      { bookingId: 'b1' },
      { payments: { dispatchIntent } },
    );

    const result = await service.executeCommand(
      businessId,
      userId,
      'Is booking b1 paid?',
      [],
    );

    expect(result.success).toBe(true);
    expect(dispatchIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId,
        action: 'explain_payment_status',
        params: expect.objectContaining({ bookingId: 'b1' }),
      }),
    );
  });

  it('dispatches collect_cash_confirm through AiPaymentsService.dispatchIntent', async () => {
    const dispatchIntent = jest.fn(async (_ctx: Record<string, unknown>) => ({
      success: true,
      action: 'collect_cash_confirm',
      summary: 'Cash payment confirmed and booking marked paid.',
      details: { bookingId: 'b1' },
    }));
    service = buildService(
      'collect_cash_confirm',
      { bookingId: 'b1' },
      { payments: { dispatchIntent } },
    );

    const result = await service.executeCommand(
      businessId,
      userId,
      'Confirm cash payment for booking b1',
      [],
    );

    expect(result.success).toBe(true);
    expect(dispatchIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId,
        action: 'collect_cash_confirm',
        params: expect.objectContaining({ bookingId: 'b1' }),
      }),
    );
  });

  it('falls back to a clarify failure when AiPaymentsService.dispatchIntent returns null', async () => {
    const dispatchIntent = jest.fn(async () => null);
    service = buildService(
      'explain_payment_status',
      { bookingId: 'b1' },
      { payments: { dispatchIntent } },
    );

    const result = await service.executeCommand(
      businessId,
      userId,
      'Is booking b1 paid?',
      [],
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });
});
