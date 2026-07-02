import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { CONFIGURE_WHATSAPP_INTEGRATION_PROMPTS } from './ai-whatsapp-integration.fixtures.js';
import { handleConfigureWhatsappIntegrationLogic } from './ai-whatsapp-integration.logic.js';
import { rescueConfigureWhatsappIntegrationIntent } from './ai-whatsapp-integration.util.js';
import { rescuePushNotificationsIntent } from './ai-push-notifications.util.js';

describe('ai-whatsapp-integration integration (ai-cmd-ext-2.20)', () => {
  const rescueService = new AiIntentRescueService();

  it.each(CONFIGURE_WHATSAPP_INTEGRATION_PROMPTS.slice(0, 4))(
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
    const prompt = 'Configure WhatsApp integration for the salon';
    expect(
      rescueConfigureWhatsappIntegrationIntent(prompt, 'unknown')?.action,
    ).toBe('configure_whatsapp_integration');
    expect(
      rescueService.rescue({ prompt, action: 'unknown', params: {} })?.action,
    ).toBe('configure_whatsapp_integration');
  });

  it('does not rescue whatsapp channel toggles', () => {
    expect(
      rescueConfigureWhatsappIntegrationIntent(
        'Enable WhatsApp notifications for booking reminders',
        'unknown',
      ),
    ).toBeNull();
  });

  it('handleConfigureWhatsappIntegrationLogic end-to-end', async () => {
    const updateSettings = jest.fn(async (_id: string, patch: object) => ({
      configured: true,
      ...patch,
    }));
    const result = await handleConfigureWhatsappIntegrationLogic(
      { whatsappIntegrationService: { updateSettings } as any },
      'biz-1',
      {},
      'Use platform default WhatsApp connection',
    );
    expect(result.success).toBe(true);
    expect(updateSettings).toHaveBeenCalledWith('biz-1', {
      usePlatformDefault: true,
    });
  });
});
