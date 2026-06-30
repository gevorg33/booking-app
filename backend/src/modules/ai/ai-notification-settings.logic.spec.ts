import { handleConfigureNotificationSettingsLogic } from './ai-notification-settings.logic.js';
import * as notificationSettingsUtil from './ai-notification-settings.util.js';

describe('ai-notification-settings.logic', () => {
  it('updates business notification settings', async () => {
    const updateBusinessSettings = jest.fn(async (_businessId: string, patch: object) => ({
      ...patch,
      emailEnabled: true,
      whatsappEnabled: true,
      smsEnabled: false,
    }));

    const result = await handleConfigureNotificationSettingsLogic(
      { notificationsService: { updateBusinessSettings } as any },
      'biz-1',
      {},
      'Configure notification settings — enable email and WhatsApp, disable SMS',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('configure_notification_settings');
    expect(updateBusinessSettings).toHaveBeenCalledWith('biz-1', {
      emailEnabled: true,
      whatsappEnabled: true,
      smsEnabled: false,
    });
  });

  it('returns clarify when parse fails', async () => {
    const result = await handleConfigureNotificationSettingsLogic(
      { notificationsService: { updateBusinessSettings: jest.fn() } as any },
      'biz-1',
      {},
      'hello world',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('updates business notification settings from params prompt fallback', async () => {
    const updateBusinessSettings = jest.fn(async (_businessId: string, patch: object) => patch);

    const result = await handleConfigureNotificationSettingsLogic(
      { notificationsService: { updateBusinessSettings } as any },
      'biz-1',
      { _prompt: 'Turn on 24-hour email reminders for clients' },
    );

    expect(result.success).toBe(true);
    expect(updateBusinessSettings).toHaveBeenCalledWith('biz-1', {
      reminder24hEmail: true,
    });
  });

  it('returns generic summary when patch labels are empty', async () => {
    jest
      .spyOn(notificationSettingsUtil, 'describeNotificationSettingsPatch')
      .mockReturnValueOnce([]);

    const result = await handleConfigureNotificationSettingsLogic(
      {
        notificationsService: {
          updateBusinessSettings: jest.fn(async () => ({})),
        } as any,
      },
      'biz-1',
      {},
      'Enable email notifications for the salon',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toBe('Notification settings updated.');
  });
});
