import { MemberRole } from '../business/entities/business-member.entity.js';
import { rescueProviderExp2Intent } from '../ai/ai-provider-exp-2.util.js';
import { PROVIDER_EXP_2_PROMPT_SCENARIOS } from '../ai/ai-provider-exp-2.fixtures.js';
import { createProviderAiCommandHarness } from './provider-ai-command.integration.harness.js';

describe('Provider AI exp-2 (prov-exp-2.4)', () => {
  const businessId = 'biz-exp24';
  const userId = 'user-exp24';
  const bookingId = 'bk-exp24';

  let service: ReturnType<typeof createProviderAiCommandHarness>;
  let providerMobile: {
    resolveMobileAccess: jest.Mock;
    getScopedEmployeeId: jest.Mock;
  };
  let providerExp2: {
    handleIntent: jest.Mock;
    rescueProviderExp2Intent: jest.Mock;
  };

  beforeEach(() => {
    providerMobile = {
      resolveMobileAccess: jest.fn(async () => ({
        viewMode: 'provider',
        membershipRole: MemberRole.STAFF,
        employee: { id: 'emp-1', name: 'Alex' },
      })),
      getScopedEmployeeId: jest.fn(() => 'emp-1'),
    };
    providerExp2 = {
      rescueProviderExp2Intent: jest.fn((prompt: string, action: string) =>
        rescueProviderExp2Intent(prompt, action),
      ),
      handleIntent: jest.fn(async (_biz, _user, action) => ({
        success: true,
        action,
        summary: `${action} ok`,
        details: { bookingId },
      })),
    };

    service = createProviderAiCommandHarness({
      providerMobile,
      providerExp2,
    });
  });

  it.each(
    PROVIDER_EXP_2_PROMPT_SCENARIOS.map((scenario) => [scenario.id, scenario]),
  )('executes %s via rescue + handler', async (_id, scenario) => {
    providerMobile.resolveMobileAccess.mockResolvedValue(
      scenario.expectedAction === 'team_floor_status'
        ? {
            viewMode: 'team',
            membershipRole: MemberRole.MANAGER,
            employee: { id: 'emp-1', name: 'Alex' },
          }
        : {
            viewMode: 'provider',
            membershipRole: MemberRole.STAFF,
            employee: { id: 'emp-1', name: 'Alex' },
          },
    );

    const result = await service.executeCommand(
      businessId,
      userId,
      scenario.prompt,
      [],
      scenario.expectedAction.includes('check_in') ||
        scenario.expectedAction.includes('running_late')
        ? { bookingId }
        : {},
    );

    expect(result.action).toBe(scenario.expectedAction);
    expect(providerExp2.handleIntent).toHaveBeenCalledWith(
      businessId,
      userId,
      scenario.expectedAction,
      expect.any(Object),
      scenario.prompt,
      expect.any(Object),
    );
  });

  it('enriches running late minutes on rescue', async () => {
    await service.executeCommand(
      businessId,
      userId,
      "I'm running 10 minutes late for Jane",
      [],
      { bookingId },
    );

    expect(providerExp2.handleIntent).toHaveBeenCalledWith(
      businessId,
      userId,
      'mark_running_late',
      expect.objectContaining({ minutesLate: 10, customerName: 'Jane' }),
      "I'm running 10 minutes late for Jane",
      expect.objectContaining({ bookingId }),
    );
  });
});
