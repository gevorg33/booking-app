import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { createProviderAiCommandHarness } from './provider-ai-command.integration.harness.js';

describe('provider AI cancel_time_off_request (ai-cmd-provider-6.7.1)', () => {
  const businessId = 'biz-67';
  const userId = 'user-67';
  const employeeId = 'emp-67';

  let service: ReturnType<typeof createProviderAiCommandHarness>;
  let llm: { isAvailableForBusiness: jest.Mock; completeJson: jest.Mock<any> };
  let providerTimeOff: {
    handleIntent: jest.Mock<any>;
    rescueProviderTimeOffIntent: jest.Mock<any>;
  };

  const staffAccess = {
    viewMode: 'provider' as const,
    membershipRole: MemberRole.STAFF,
    employee: { id: employeeId, name: 'Alex Provider' },
  };

  beforeEach(() => {
    llm = {
      isAvailableForBusiness: jest.fn(async () => true),
      completeJson: jest.fn(),
    };
    providerTimeOff = {
      handleIntent: jest.fn(async (_biz, _user, action) => ({
        success: true,
        action,
        summary: 'Cancelled time-off request for 2026-06-20.',
        details: { request: { id: 'req-1' } },
      })),
      rescueProviderTimeOffIntent: jest.fn(() => null),
    };
    service = createProviderAiCommandHarness({
      llm,
      providerMobile: {
        resolveMobileAccess: jest.fn(async () => staffAccess),
        getScopedEmployeeId: jest.fn(() => employeeId),
      },
      providerTimeOff,
    });
  });

  function mockIntent(action: string, params: Record<string, unknown>) {
    llm.completeJson.mockResolvedValue({ action, params, reasoning: 'test' });
  }

  it('dispatches cancel_time_off_request to providerTimeOff with employeeId', async () => {
    mockIntent('cancel_time_off_request', {});

    const result = await service.executeCommand(
      businessId,
      userId,
      'Cancel my time off request',
      [],
    );

    expect(result.action).toBe('cancel_time_off_request');
    expect(providerTimeOff.handleIntent).toHaveBeenCalledWith(
      businessId,
      userId,
      'cancel_time_off_request',
      {},
      'provider',
      employeeId,
    );
  });

  it('falls back to a clarify failure when providerTimeOff.handleIntent returns null', async () => {
    providerTimeOff.handleIntent.mockResolvedValue(null);
    mockIntent('cancel_time_off_request', {});

    const result = await service.executeCommand(
      businessId,
      userId,
      'Cancel my time off request',
      [],
    );

    expect(result.success).toBe(false);
    expect(result.details).toMatchObject({ clarify: true });
  });
});
