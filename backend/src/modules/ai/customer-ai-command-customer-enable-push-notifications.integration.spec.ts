import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';
import { CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_PROMPTS } from './ai-customer-enable-push-notifications.fixtures.js';
import { CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_MULTILINGUAL_SCENARIOS } from './ai-customer-enable-push-notifications-multilingual.fixtures.js';

describe('customer-ai-command enable_push_notifications integration (ai-cmd-customer-4.13.1)', () => {
  it.each(
    [
      ...CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_PROMPTS,
      ...CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_MULTILINGUAL_SCENARIOS,
    ].map((row) => [row.id, row.prompt]),
  )('rescues enable_push_notifications for $0', (_id, prompt) => {
    expect(rescueConsumerAdoptionIntent(prompt, 'unknown')?.action).toBe(
      'enable_push_notifications',
    );
  });
});
