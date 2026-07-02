import {
  EXPLAIN_MY_NOTIFICATIONS_PROMPTS,
  EXPLAIN_MY_NOTIFICATIONS_RESCUE_SCENARIOS,
} from './ai-explain-my-notifications.fixtures.js';
import { EXPLAIN_MY_NOTIFICATIONS_MULTILINGUAL_SCENARIOS } from './ai-explain-my-notifications-multilingual.fixtures.js';
import { rescueExplainMyNotificationsIntent } from './ai-explain-my-notifications.util.js';
import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';

describe('customer-ai-command explain_my_notifications integration (ai-cmd-customer-4.5.5)', () => {
  it.each(
    EXPLAIN_MY_NOTIFICATIONS_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues explain_my_notifications for $id', (_id, row) => {
    expect(
      rescueExplainMyNotificationsIntent(row.prompt, 'unknown')?.action,
    ).toBe('explain_my_notifications');
    expect(rescueConsumerAdoptionIntent(row.prompt, 'unknown')?.action).toBe(
      'explain_my_notifications',
    );
  });

  it.each(
    EXPLAIN_MY_NOTIFICATIONS_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues multilingual explain_my_notifications for $id', (_id, row) => {
    expect(rescueConsumerAdoptionIntent(row.prompt, 'unknown')?.action).toBe(
      'explain_my_notifications',
    );
  });

  it.each(
    EXPLAIN_MY_NOTIFICATIONS_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues misclassified explain_my_notifications for $id', (_id, row) => {
    expect(
      rescueConsumerAdoptionIntent(row.prompt, row.misclassifiedAction)?.action,
    ).toBe('explain_my_notifications');
  });
});
