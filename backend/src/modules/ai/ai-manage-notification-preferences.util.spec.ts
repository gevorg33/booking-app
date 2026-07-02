import {
  MANAGE_NOTIFICATION_PREFERENCES_PROMPTS,
  MANAGE_NOTIFICATION_PREFERENCES_RESCUE_SCENARIOS,
  CUSTOMER_MANAGE_NOTIFICATION_PREFERENCES_CLASSIFIER_RULES,
} from './ai-manage-notification-preferences.fixtures.js';
import { MANAGE_NOTIFICATION_PREFERENCES_MULTILINGUAL_SCENARIOS } from './ai-manage-notification-preferences-multilingual.fixtures.js';
import {
  isManageNotificationPreferencesIntent,
  isManageNotificationPreferencesPrompt,
  inferManageNotificationPreferencesFocus,
  parseManageNotificationPreferencesFromPrompt,
  rescueManageNotificationPreferencesIntent,
} from './ai-manage-notification-preferences.util.js';
import { isExplainMyNotificationsPrompt } from './ai-explain-my-notifications.util.js';
import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';
import { AI_COMMAND_EVAL_MANAGE_NOTIFICATION_PREFERENCES_CASES } from './eval/ai-command-eval.cases.js';

describe('ai-manage-notification-preferences.util (ai-cmd-customer-4.5.4)', () => {
  it('exports classifier rules for manage_notification_preferences', () => {
    expect(CUSTOMER_MANAGE_NOTIFICATION_PREFERENCES_CLASSIFIER_RULES).toContain(
      'manage_notification_preferences',
    );
  });

  it.each(
    MANAGE_NOTIFICATION_PREFERENCES_PROMPTS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects manage_notification_preferences for $id', (_id, row) => {
    expect(isManageNotificationPreferencesPrompt(row.prompt)).toBe(true);
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
    'detects multilingual manage_notification_preferences for $id',
    (_id, row) => {
      expect(isManageNotificationPreferencesPrompt(row.prompt)).toBe(true);
      expect(rescueConsumerAdoptionIntent(row.prompt, 'unknown')?.action).toBe(
        'manage_notification_preferences',
      );
    },
  );

  it.each(
    MANAGE_NOTIFICATION_PREFERENCES_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues from $misclassifiedAction for $id', (_id, row) => {
    expect(
      rescueManageNotificationPreferencesIntent(
        row.prompt,
        row.misclassifiedAction,
      )?.action,
    ).toBe('manage_notification_preferences');
    expect(
      rescueConsumerAdoptionIntent(row.prompt, row.misclassifiedAction)?.action,
    ).toBe('manage_notification_preferences');
  });

  it('does not classify explain overview prompts as manage', () => {
    expect(
      isManageNotificationPreferencesPrompt(
        'What notifications will I get after booking?',
      ),
    ).toBe(false);
    expect(
      isExplainMyNotificationsPrompt(
        'What notifications will I get after booking?',
      ),
    ).toBe(true);
    expect(
      rescueConsumerAdoptionIntent(
        'What notifications will I get after booking?',
        'unknown',
      )?.action,
    ).toBe('explain_my_notifications');
  });

  it('prefers manage over explain for channel preference prompts', () => {
    expect(isManageNotificationPreferencesPrompt('Text me not email')).toBe(
      true,
    );
    expect(isExplainMyNotificationsPrompt('Text me not email')).toBe(false);
  });

  it('parses focus from fixture prompts', () => {
    expect(
      parseManageNotificationPreferencesFromPrompt('Text me not email'),
    ).toEqual({ focus: 'channel' });
    expect(
      parseManageNotificationPreferencesFromPrompt(
        'Turn off appointment reminders',
      ),
    ).toEqual({ focus: 'disable' });
  });

  it('infers focus from heuristic cues when prompt is not a fixture row', () => {
    expect(
      inferManageNotificationPreferencesFocus('Please disable alerts now'),
    ).toBe('disable');
    expect(
      inferManageNotificationPreferencesFocus('Please enable alerts now'),
    ).toBe('enable');
    expect(
      inferManageNotificationPreferencesFocus(
        'Prefer SMS over email for reminders',
      ),
    ).toBe('channel');
    expect(
      inferManageNotificationPreferencesFocus('Update notification settings'),
    ).toBe('settings');
  });

  it('rejects dashboard-only and generic enable prompts', () => {
    expect(isManageNotificationPreferencesPrompt('')).toBe(false);
    expect(
      isManageNotificationPreferencesPrompt('Show notification history'),
    ).toBe(false);
    expect(isManageNotificationPreferencesPrompt('Enable notifications')).toBe(
      false,
    );
    expect(
      isManageNotificationPreferencesPrompt(
        'Enable notifications for appointment reminders',
      ),
    ).toBe(true);
    expect(
      isManageNotificationPreferencesPrompt(
        'What notifications will I get after booking?',
      ),
    ).toBe(false);
  });

  it('returns null when action is already manage_notification_preferences', () => {
    expect(
      rescueManageNotificationPreferencesIntent(
        'Turn off appointment reminders',
        'manage_notification_preferences',
      ),
    ).toBeNull();
    expect(
      parseManageNotificationPreferencesFromPrompt('Show notification history'),
    ).toBeNull();
  });

  it('recognizes manage_notification_preferences intent', () => {
    expect(
      isManageNotificationPreferencesIntent('manage_notification_preferences'),
    ).toBe(true);
    expect(
      isManageNotificationPreferencesIntent('explain_my_notifications'),
    ).toBe(false);
  });

  it('ships eval golden cases for every fixture row', () => {
    expect(
      MANAGE_NOTIFICATION_PREFERENCES_PROMPTS.length,
    ).toBeGreaterThanOrEqual(12);
    expect(
      MANAGE_NOTIFICATION_PREFERENCES_MULTILINGUAL_SCENARIOS.length,
    ).toBeGreaterThanOrEqual(6);
    expect(AI_COMMAND_EVAL_MANAGE_NOTIFICATION_PREFERENCES_CASES.length).toBe(
      MANAGE_NOTIFICATION_PREFERENCES_PROMPTS.length +
        MANAGE_NOTIFICATION_PREFERENCES_MULTILINGUAL_SCENARIOS.length +
        MANAGE_NOTIFICATION_PREFERENCES_RESCUE_SCENARIOS.length,
    );
  });
});
