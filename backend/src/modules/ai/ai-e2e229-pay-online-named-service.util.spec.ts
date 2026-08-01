import { applyPromptMentionedServiceOverrideToParams } from './ai-booking-param-hints.util.js';
import {
  E2E229_CHECKOUT_SLOT_CONTEXT,
  E2E229_PAY_ONLINE_NAMED_SERVICE_PROMPTS,
} from './ai-e2e229-pay-online-named-service.fixtures.js';
import {
  buildPayOnlineCheckoutNavigate,
  hasPayOnlineSlotContext,
} from './ai-pay-online-checkout.util.js';
import { extractServiceNameFromPrompt } from './ai-payments.util.js';
import { mergePublicAssistantSessionParams } from '../public-booking/public-booking-assistant-session.util.js';

describe('e2e-bug.229 pay_online named service keeps checkout serviceId', () => {
  const slot = E2E229_CHECKOUT_SLOT_CONTEXT;

  const namedSwedish = E2E229_PAY_ONLINE_NAMED_SERVICE_PROMPTS.filter(
    (row) => row.expectSuccessWithSlot && /swedish/i.test(row.prompt),
  );

  it.each(namedSwedish.map((row) => [row.id, row] as const))(
    '$id: override without catalog keeps existing checkout serviceId',
    (_id, row) => {
      const next = applyPromptMentionedServiceOverrideToParams(row.prompt, {
        ...slot,
      });
      expect(next.serviceId).toBe(slot.serviceId);
      expect(hasPayOnlineSlotContext(next)).toBe(true);
      expect(buildPayOnlineCheckoutNavigate(next)?.query).toMatchObject({
        serviceId: slot.serviceId,
        employeeId: slot.employeeId,
        startTime: slot.startTime,
        payment: 'online',
      });
    },
  );

  it.each(namedSwedish.map((row) => [row.id, row] as const))(
    '$id: session merge for pay_online restores slot after named serviceName only',
    (_id, row) => {
      const extracted =
        extractServiceNameFromPrompt(row.prompt) ?? 'Swedish massage';
      const merged = mergePublicAssistantSessionParams(
        { serviceName: extracted },
        { ...slot },
        'pay_online',
      );
      expect(merged.serviceId).toBe(slot.serviceId);
      expect(merged.employeeId).toBe(slot.employeeId);
      expect(merged.startTime).toBe(slot.startTime);
      expect(hasPayOnlineSlotContext(merged)).toBe(true);
      expect(buildPayOnlineCheckoutNavigate(merged)?.path).toBe('checkout');
    },
  );

  it('bare home with only serviceName still lacks slot context', () => {
    const merged = mergePublicAssistantSessionParams(
      { serviceName: 'Swedish massage' },
      {},
      'pay_online',
    );
    expect(hasPayOnlineSlotContext(merged)).toBe(false);
    expect(buildPayOnlineCheckoutNavigate(merged)).toBeNull();
  });
});
