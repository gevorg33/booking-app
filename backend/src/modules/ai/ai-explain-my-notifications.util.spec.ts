import { DEFAULT_BUSINESS_NOTIFICATION_SETTINGS } from '../notifications/notification.types.js';
import {
  EXPLAIN_MY_NOTIFICATIONS_PROMPTS,
  EXPLAIN_MY_NOTIFICATIONS_RESCUE_SCENARIOS,
  CUSTOMER_EXPLAIN_MY_NOTIFICATIONS_CLASSIFIER_RULES,
} from './ai-explain-my-notifications.fixtures.js';
import { EXPLAIN_MY_NOTIFICATIONS_MULTILINGUAL_SCENARIOS } from './ai-explain-my-notifications-multilingual.fixtures.js';
import {
  buildMyNotificationsExplainCopy,
  isExplainMyNotificationsPrompt,
  listSalonReminderChannels,
  rescueExplainMyNotificationsIntent,
} from './ai-explain-my-notifications.util.js';
import { isManageNotificationPreferencesPrompt } from './ai-manage-notification-preferences.util.js';
import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';
import { AI_COMMAND_EVAL_EXPLAIN_MY_NOTIFICATIONS_CASES } from './eval/ai-command-eval.cases.js';

describe('ai-explain-my-notifications.util (ai-cmd-customer-4.5.5)', () => {
  it('exports classifier rules for explain_my_notifications', () => {
    expect(CUSTOMER_EXPLAIN_MY_NOTIFICATIONS_CLASSIFIER_RULES).toContain(
      'explain_my_notifications',
    );
  });

  it('builds salon-grounded notification copy from business settings', () => {
    const copy = buildMyNotificationsExplainCopy({
      businessSettings: {
        ...DEFAULT_BUSINESS_NOTIFICATION_SETTINGS,
        smsEnabled: true,
        reminder24hSms: true,
      },
      customerPrefs: {
        emailReminders: true,
        smsReminders: true,
        whatsappReminders: true,
        pushReminders: true,
        pushOffers: false,
        pushNews: false,
      },
    });
    expect(copy.salonChannels).toContain('email');
    expect(copy.salonChannels).toContain('SMS');
    expect(copy.reminders).toEqual(
      expect.arrayContaining(['24h SMS reminder']),
    );
    expect(copy.summary).toContain('This salon has');
    expect(copy.summary).toContain('Notification preferences');
  });

  it('lists reminder channels only when master channel is enabled', () => {
    const reminders = listSalonReminderChannels({
      ...DEFAULT_BUSINESS_NOTIFICATION_SETTINGS,
      smsEnabled: false,
      reminder24hSms: true,
    });
    expect(reminders).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/SMS reminder/i)]),
    );
  });

  it.each(
    EXPLAIN_MY_NOTIFICATIONS_PROMPTS.map((row) => [row.id, row] as const),
  )('detects explain-my-notifications prompt $id', (_id, row) => {
    expect(isExplainMyNotificationsPrompt(row.prompt)).toBe(true);
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
  )('detects multilingual explain_my_notifications for $id', (_id, row) => {
    expect(isExplainMyNotificationsPrompt(row.prompt)).toBe(true);
    expect(rescueConsumerAdoptionIntent(row.prompt, 'unknown')?.action).toBe(
      'explain_my_notifications',
    );
  });

  it.each(
    EXPLAIN_MY_NOTIFICATIONS_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues from $misclassifiedAction for $id', (_id, row) => {
    expect(
      rescueExplainMyNotificationsIntent(row.prompt, row.misclassifiedAction)
        ?.action,
    ).toBe('explain_my_notifications');
    expect(
      rescueConsumerAdoptionIntent(row.prompt, row.misclassifiedAction)?.action,
    ).toBe('explain_my_notifications');
  });

  it('prefers explain over manage for overview questions', () => {
    expect(
      isExplainMyNotificationsPrompt(
        'What notifications will I get after booking?',
      ),
    ).toBe(true);
    expect(
      isManageNotificationPreferencesPrompt(
        'What notifications will I get after booking?',
      ),
    ).toBe(false);
  });

  it('builds empty-state copy when salon channels and customer opt-in are off', () => {
    const copy = buildMyNotificationsExplainCopy({
      businessSettings: {
        ...DEFAULT_BUSINESS_NOTIFICATION_SETTINGS,
        emailEnabled: false,
        smsEnabled: false,
        whatsappEnabled: false,
        sendConfirmationPush: false,
        sendReminder24hPush: false,
        sendReminder1hPush: false,
        sendCancellationPush: false,
        sendReschedulePush: false,
        reminder24hEmail: false,
        reminder1hEmail: false,
        reminder24hSms: false,
        reminder1hSms: false,
        reminder24hWhatsapp: false,
        reminder1hWhatsapp: false,
      },
      customerPrefs: {
        emailReminders: false,
        smsReminders: false,
        whatsappReminders: false,
        pushReminders: false,
        pushOffers: false,
        pushNews: false,
      },
    });
    expect(copy.summary).toContain(
      'not enabled outbound notification channels',
    );
    expect(copy.summary).toContain('No appointment reminder windows');
    expect(copy.summary).toContain('reminder channels are currently off');
  });

  it('rejects non-explain dashboard and checkout prompts', () => {
    expect(isExplainMyNotificationsPrompt('')).toBe(false);
    expect(isExplainMyNotificationsPrompt('Show notification history')).toBe(
      false,
    );
    expect(
      isExplainMyNotificationsPrompt(
        'What product cards appear on the booking success screen?',
      ),
    ).toBe(false);
    expect(
      isExplainMyNotificationsPrompt('Explain notification currency display'),
    ).toBe(false);
  });

  it('detects heuristic EN prompts not in fixture rows', () => {
    expect(
      isExplainMyNotificationsPrompt('Will you text me about my visit?'),
    ).toBe(true);
    expect(
      isExplainMyNotificationsPrompt('Do you send a 24 hour reminder email?'),
    ).toBe(true);
    expect(
      isExplainMyNotificationsPrompt(
        'What appears on the confirmation screen for product recommendations?',
      ),
    ).toBe(false);
  });

  it('returns null when action is already explain_my_notifications', () => {
    expect(
      rescueExplainMyNotificationsIntent(
        'What notifications will I get after booking?',
        'explain_my_notifications',
      ),
    ).toBeNull();
  });

  it('does not steal dashboard configure notification settings prompts', () => {
    expect(
      isExplainMyNotificationsPrompt(
        'Configure notification settings — enable email and WhatsApp, disable SMS',
      ),
    ).toBe(false);
  });

  it('ships eval golden cases for every fixture row', () => {
    expect(EXPLAIN_MY_NOTIFICATIONS_PROMPTS.length).toBeGreaterThanOrEqual(12);
    expect(
      EXPLAIN_MY_NOTIFICATIONS_MULTILINGUAL_SCENARIOS.length,
    ).toBeGreaterThanOrEqual(6);
    expect(AI_COMMAND_EVAL_EXPLAIN_MY_NOTIFICATIONS_CASES.length).toBe(
      EXPLAIN_MY_NOTIFICATIONS_PROMPTS.length +
        EXPLAIN_MY_NOTIFICATIONS_MULTILINGUAL_SCENARIOS.length +
        EXPLAIN_MY_NOTIFICATIONS_RESCUE_SCENARIOS.length,
    );
  });
});
