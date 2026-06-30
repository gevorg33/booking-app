import { DEFAULT_BUSINESS_NOTIFICATION_SETTINGS } from '../notifications/notification.types.js';
import {
  buildMyNotificationsExplainCopy,
  EXPLAIN_MY_NOTIFICATIONS_PROMPTS,
  isExplainMyNotificationsPrompt,
  listSalonReminderChannels,
  rescueExplainMyNotificationsIntent,
} from './ai-explain-my-notifications.util.js';
import { rescueConsumerAdoptionIntent } from './ai-consumer-adoption.util.js';

describe('ai-explain-my-notifications.util (ai-cmd-ext-7.4)', () => {
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

  it.each(EXPLAIN_MY_NOTIFICATIONS_PROMPTS.map((row) => [row.id, row] as const))(
    'detects explain-my-notifications prompt $id',
    (_id, row) => {
      expect(isExplainMyNotificationsPrompt(row.prompt)).toBe(true);
    },
  );

  it.each(EXPLAIN_MY_NOTIFICATIONS_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues explain-my-notifications prompt $id from unknown',
    (_id, row) => {
      const rescued = rescueConsumerAdoptionIntent(row.prompt, 'unknown');
      expect(rescued?.action).toBe(row.expectedAction);
    },
  );

  it('routes explain prompts through dedicated rescue', () => {
    expect(
      rescueExplainMyNotificationsIntent(
        'Will you WhatsApp me about my appointment?',
        'unknown',
      )?.action,
    ).toBe('explain_my_notifications');
  });

  it('does not steal dashboard configure notification settings prompts', () => {
    expect(
      isExplainMyNotificationsPrompt(
        'Configure notification settings — enable email and WhatsApp, disable SMS',
      ),
    ).toBe(false);
  });
});
