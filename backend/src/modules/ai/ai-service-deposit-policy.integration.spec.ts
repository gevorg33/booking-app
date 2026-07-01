import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { CONFIGURE_SERVICE_DEPOSIT_POLICY_PROMPTS } from './ai-service-deposit-policy.fixtures.js';
import { handleConfigureServiceDepositPolicyLogic } from './ai-service-deposit-policy.logic.js';
import { rescueConfigureServiceDepositPolicyIntent } from './ai-service-deposit-policy.util.js';
import { rescuePaymentsIntent } from './ai-payments.util.js';

describe('ai-service-deposit-policy integration (ai-cmd-ext-2.18)', () => {
  const rescueService = new AiIntentRescueService();

  it.each(CONFIGURE_SERVICE_DEPOSIT_POLICY_PROMPTS.slice(0, 4))(
    'rescues unknown prompt $id via payments rescue',
    ({ prompt, expectedAction }) => {
      expect(rescuePaymentsIntent(prompt, 'unknown')?.action).toBe(
        expectedAction,
      );
      const rescued = rescueService.rescue({
        prompt,
        action: 'unknown',
        params: {},
      });
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescued).toBe(true);
    },
  );

  it('utility rescue matches intent rescue', () => {
    const prompt = 'Set 30% deposit on premium tier services';
    expect(
      rescueConfigureServiceDepositPolicyIntent(prompt, 'unknown')?.action,
    ).toBe('configure_service_deposit_policy');
    expect(
      rescueService.rescue({ prompt, action: 'unknown', params: {} })?.action,
    ).toBe('configure_service_deposit_policy');
  });

  it('does not rescue generic online payment to deposit policy', () => {
    expect(
      rescueConfigureServiceDepositPolicyIntent(
        'Accept online payment on public booking for all services with 50% prepayment',
        'unknown',
      ),
    ).toBeNull();
  });

  it('handleConfigureServiceDepositPolicyLogic end-to-end', async () => {
    const services = [
      {
        id: 'svc-featured',
        businessId: 'biz-1',
        name: 'Featured Facial',
        price: 80,
        metadata: { isFeatured: true },
        isActive: true,
        category: { name: 'Facial' },
      },
    ] as any[];

    const update = jest.fn(
      async (id: string, dto: Record<string, unknown>) => ({
        id,
        name: 'Featured Facial',
        prepaymentMode: dto.prepaymentMode,
        depositAmount: dto.depositAmount ?? 25,
      }),
    );

    const result = await handleConfigureServiceDepositPolicyLogic(
      { serviceService: { update } as any } as any,
      'biz-1',
      {},
      'Require $25 deposit on featured services',
      services,
    );

    expect(result.success).toBe(true);
    expect(update).toHaveBeenCalledWith(
      'svc-featured',
      expect.objectContaining({ prepaymentMode: 'deposit', depositAmount: 25 }),
      undefined,
    );
  });
});
