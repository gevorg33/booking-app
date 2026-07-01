import {
  CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_PROMPTS,
  CUSTOMER_ENABLE_PUSH_BOUNDARY_PROMPTS,
  CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_RESCUE_SCENARIOS,
  CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_CLASSIFIER_RULES,
} from './ai-customer-enable-push-notifications.fixtures.js';
import { CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_MULTILINGUAL_SCENARIOS } from './ai-customer-enable-push-notifications-multilingual.fixtures.js';
import {
  isCustomerEnablePushNotificationsIntent,
  isCustomerEnablePushNotificationsPrompt,
  rescueCustomerEnablePushNotificationsIntent,
} from './ai-customer-enable-push-notifications.util.js';
import { isManageNotificationPreferencesPrompt } from './ai-manage-notification-preferences.util.js';
import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';
import { AI_COMMAND_EVAL_CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_CASES } from './eval/ai-command-eval.cases.js';

describe('ai-customer-enable-push-notifications.util (ai-cmd-customer-4.13.1)', () => {
  it('exports classifier rules for enable_push_notifications', () => {
    expect(CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_CLASSIFIER_RULES).toContain(
      'enable_push_notifications',
    );
  });

  it.each(
    CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_PROMPTS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects enable_push_notifications for $id', (_id, row) => {
    expect(isCustomerEnablePushNotificationsPrompt(row.prompt)).toBe(true);
    expect(
      rescueCustomerEnablePushNotificationsIntent(row.prompt, 'unknown')
        ?.action,
    ).toBe('enable_push_notifications');
    expect(rescueConsumerAdoptionIntent(row.prompt, 'unknown')?.action).toBe(
      'enable_push_notifications',
    );
  });

  it.each(
    CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual enable_push_notifications for $id', (_id, row) => {
    expect(isCustomerEnablePushNotificationsPrompt(row.prompt)).toBe(true);
    expect(rescueConsumerAdoptionIntent(row.prompt, 'unknown')?.action).toBe(
      'enable_push_notifications',
    );
  });

  it.each(
    CUSTOMER_ENABLE_PUSH_BOUNDARY_PROMPTS.map((row) => [row.id, row] as const),
  )('rejects boundary prompt $id', (_id, row) => {
    expect(isCustomerEnablePushNotificationsPrompt(row.prompt)).toBe(false);
  });

  it.each(CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_RESCUE_SCENARIOS)(
    'rescues enable_push_notifications for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueCustomerEnablePushNotificationsIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe('enable_push_notifications');
    },
  );

  it('does not steal manage_notification_preferences channel prompts', () => {
    expect(isManageNotificationPreferencesPrompt('Text me not email')).toBe(
      true,
    );
    expect(isCustomerEnablePushNotificationsPrompt('Text me not email')).toBe(
      false,
    );
    expect(
      isManageNotificationPreferencesPrompt('Enable WhatsApp notifications'),
    ).toBe(true);
    expect(
      isCustomerEnablePushNotificationsPrompt('Enable WhatsApp notifications'),
    ).toBe(false);
  });

  it('rejects turn-off push channel preference prompts', () => {
    expect(
      isCustomerEnablePushNotificationsPrompt('Turn off push reminders'),
    ).toBe(false);
  });

  it('rejects email-only enable prompts', () => {
    expect(
      isCustomerEnablePushNotificationsPrompt('Enable email and SMS reminders'),
    ).toBe(false);
  });

  it('returns null when action already matches', () => {
    expect(
      rescueCustomerEnablePushNotificationsIntent(
        'Turn on push reminders',
        'enable_push_notifications',
      ),
    ).toBeNull();
  });

  it('recognizes enable_push_notifications intent id', () => {
    expect(
      isCustomerEnablePushNotificationsIntent('enable_push_notifications'),
    ).toBe(true);
    expect(
      isCustomerEnablePushNotificationsIntent(
        'manage_notification_preferences',
      ),
    ).toBe(false);
  });

  it('maps eval golden cases', () => {
    expect(
      AI_COMMAND_EVAL_CUSTOMER_ENABLE_PUSH_NOTIFICATIONS_CASES.length,
    ).toBeGreaterThan(0);
  });

  it('rejects empty prompts', () => {
    expect(isCustomerEnablePushNotificationsPrompt('   ')).toBe(false);
  });

  it('rejects provider-context push prompts', () => {
    expect(
      isCustomerEnablePushNotificationsPrompt('Enable provider push alerts'),
    ).toBe(false);
  });

  it('detects Armenian heuristic prompts not in fixtures', () => {
    expect(
      isCustomerEnablePushNotificationsPrompt(
        'Ակտիվացնել ծանուցումները հեռախոսում',
      ),
    ).toBe(true);
  });

  it('detects Cyrillic heuristic prompts not in fixtures', () => {
    expect(
      isCustomerEnablePushNotificationsPrompt(
        'Активируй уведомления на телефоне',
      ),
    ).toBe(true);
  });

  it('detects device mutate prompts via heuristics', () => {
    expect(
      isCustomerEnablePushNotificationsPrompt(
        'Turn on notifications on this device',
      ),
    ).toBe(true);
  });

  it('rejects disable mutate on device', () => {
    expect(
      isCustomerEnablePushNotificationsPrompt('Turn off push on my phone'),
    ).toBe(false);
  });
});
