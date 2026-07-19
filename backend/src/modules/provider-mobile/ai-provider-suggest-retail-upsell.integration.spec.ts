import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { createProviderAiCommandHarness } from './provider-ai-command.integration.harness.js';

describe('provider AI suggest_retail_upsell dispatch (ai-cmd-provider-6.14)', () => {
  const businessId = 'biz-614';
  const userId = 'user-614';
  const employeeId = 'emp-614';

  let service: ReturnType<typeof createProviderAiCommandHarness>;
  let llm: { isAvailableForBusiness: jest.Mock; completeJson: jest.Mock<any> };
  let handleSuggestRetailUpsell: jest.Mock<any>;

  const staffAccess = {
    viewMode: 'provider' as const,
    membershipRole: MemberRole.STAFF,
    employee: { id: employeeId, name: 'Alex Provider' },
  };

  beforeEach(() => {
    llm = {
      isAvailableForBusiness: jest.fn(async () => true),
      completeJson: jest.fn(async () => ({
        action: 'suggest_retail_upsell',
        params: {},
        reasoning: 'test',
      })),
    };
    handleSuggestRetailUpsell = jest.fn(async () => ({
      success: true,
      action: 'suggest_retail_upsell',
      summary: '2 product(s) suggested.',
      details: { suggestions: [] },
    }));
    service = createProviderAiCommandHarness({
      llm,
      providerMobile: {
        resolveMobileAccess: jest.fn(async () => staffAccess),
        getScopedEmployeeId: jest.fn(() => employeeId),
      },
      retailFinance: { handleSuggestRetailUpsell },
    });
  });

  it('dispatches to AiRetailFinanceService.handleSuggestRetailUpsell with the session employee scoped', async () => {
    const result = await service.executeCommand(
      businessId,
      userId,
      'What products should I suggest for this booking?',
      [],
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('suggest_retail_upsell');
    expect(handleSuggestRetailUpsell).toHaveBeenCalledWith(
      businessId,
      expect.objectContaining({ sessionEmployeeId: employeeId }),
      'What products should I suggest for this booking?',
    );
  });
});
