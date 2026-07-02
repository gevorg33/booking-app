import {
  MANAGE_NOTIFICATION_PREFERENCES_PROMPTS,
  MANAGE_NOTIFICATION_PREFERENCES_RESCUE_SCENARIOS,
} from './ai-manage-notification-preferences.fixtures.js';
import { MANAGE_NOTIFICATION_PREFERENCES_MULTILINGUAL_SCENARIOS } from './ai-manage-notification-preferences-multilingual.fixtures.js';
import { rescueManageNotificationPreferencesIntent } from './ai-manage-notification-preferences.util.js';
import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';

describe('customer-ai-command manage_notification_preferences integration (ai-cmd-customer-4.5.4)', () => {
  it.each(
    MANAGE_NOTIFICATION_PREFERENCES_PROMPTS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues manage_notification_preferences for $id', (_id, row) => {
    expect(
      rescueManageNotificationPreferencesIntent(row.prompt, 'unknown')?.action,
    ).toBe('manage_notification_preferences');
    expect(rescueConsumerAdoptionIntent(row.prompt, 'unknown')?.action).toBe(
      'manage_notification_preferences',
    );
  });

  it.each(
    MANAGE_NOTIFICATION_PREFERENCES_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )(
    'rescues multilingual manage_notification_preferences for $id',
    (_id, row) => {
      expect(rescueConsumerAdoptionIntent(row.prompt, 'unknown')?.action).toBe(
        'manage_notification_preferences',
      );
    },
  );

  it.each(
    MANAGE_NOTIFICATION_PREFERENCES_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )(
    'rescues misclassified manage_notification_preferences for $id',
    (_id, row) => {
      expect(
        rescueConsumerAdoptionIntent(row.prompt, row.misclassifiedAction)
          ?.action,
      ).toBe('manage_notification_preferences');
    },
  );
});
