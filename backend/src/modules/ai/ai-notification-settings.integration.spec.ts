import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { CONFIGURE_NOTIFICATION_SETTINGS_PROMPTS } from './ai-notification-settings.fixtures.js';
import { handleConfigureNotificationSettingsLogic } from './ai-notification-settings.logic.js';
import { rescueConfigureNotificationSettingsIntent } from './ai-notification-settings.util.js';
import { rescuePushNotificationsIntent } from './ai-push-notifications.util.js';

describe('ai-notification-settings integration (ai-cmd-ext-2.19)', () => {
  const rescueService = new AiIntentRescueService();

  it.each(CONFIGURE_NOTIFICATION_SETTINGS_PROMPTS.slice(0, 4))(
    'rescues unknown prompt $id via push notifications rescue',
    ({ prompt, expectedAction }) => {
      expect(rescuePushNotificationsIntent(prompt, 'unknown')?.action).toBe(
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
    const prompt =
      'Configure notification settings — enable email and WhatsApp, disable SMS';
    expect(rescueConfigureNotificationSettingsIntent(prompt, 'unknown')?.action).toBe(
      'configure_notification_settings',
    );
    expect(
      rescueService.rescue({ prompt, action: 'unknown', params: {} })?.action,
    ).toBe('configure_notification_settings');
  });

  it('does not rescue customer enable notifications', () => {
    expect(
      rescueConfigureNotificationSettingsIntent(
        'Enable notifications for my account',
        'unknown',
      ),
    ).toBeNull();
  });

  it('handleConfigureNotificationSettingsLogic end-to-end', async () => {
    const updateBusinessSettings = jest.fn(async (_id: string, patch: object) => patch);
    const result = await handleConfigureNotificationSettingsLogic(
      { notificationsService: { updateBusinessSettings } as any },
      'biz-1',
      {},
      'Disable 1-hour WhatsApp reminders',
    );
    expect(result.success).toBe(true);
    expect(updateBusinessSettings).toHaveBeenCalledWith('biz-1', {
      reminder1hWhatsapp: false,
    });
  });
});
