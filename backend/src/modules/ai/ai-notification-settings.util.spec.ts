import {
  CONFIGURE_NOTIFICATION_SETTINGS_INTENT,
  CONFIGURE_NOTIFICATION_SETTINGS_PROMPTS,
  enrichNotificationSettingsParamsFromPrompt,
  isConfigureNotificationSettingsPrompt,
  parseConfigureNotificationSettingsFromPrompt,
  rescueConfigureNotificationSettingsIntent,
  resolveNotificationSettingsAccessTier,
} from './ai-notification-settings.util.js';

describe('ai-notification-settings.util', () => {
  it.each(CONFIGURE_NOTIFICATION_SETTINGS_PROMPTS)(
    'detects configure notification settings prompt $id',
    ({ prompt }) => {
      expect(isConfigureNotificationSettingsPrompt(prompt)).toBe(true);
    },
  );

  it.each(CONFIGURE_NOTIFICATION_SETTINGS_PROMPTS)(
    'parses configure notification settings fixture $id',
    ({ prompt, paramsPartial }) => {
      const parsed = parseConfigureNotificationSettingsFromPrompt(prompt, {});
      expect(parsed).not.toBeNull();
      for (const [key, value] of Object.entries(paramsPartial ?? {})) {
        expect(parsed?.[key as keyof typeof parsed]).toBe(value);
      }
    },
  );

  it.each(CONFIGURE_NOTIFICATION_SETTINGS_PROMPTS)(
    'rescues unknown action to configure_notification_settings for $id',
    ({ prompt, expectedAction }) => {
      expect(
        rescueConfigureNotificationSettingsIntent(prompt, 'unknown'),
      ).toEqual({
        action: expectedAction,
        rescueReason: expectedAction,
      });
    },
  );

  it('does not treat customer enable notifications as salon settings', () => {
    expect(
      isConfigureNotificationSettingsPrompt(
        'Enable notifications for my account',
      ),
    ).toBe(false);
  });

  it('does not treat push recipients as notification settings', () => {
    expect(
      isConfigureNotificationSettingsPrompt(
        'Configure push recipients for Maria',
      ),
    ).toBe(false);
  });

  it('does not treat business email on customer change as notification settings', () => {
    expect(
      isConfigureNotificationSettingsPrompt(
        'Notify business by email when customers cancel',
      ),
    ).toBe(false);
  });

  it('enriches params from prompt', () => {
    const enriched = enrichNotificationSettingsParamsFromPrompt(
      {},
      'Turn on 24-hour email reminders for clients',
    );
    expect(enriched.reminder24hEmail).toBe(true);
  });

  it('resolves access tier for configure_notification_settings only', () => {
    expect(
      resolveNotificationSettingsAccessTier(
        CONFIGURE_NOTIFICATION_SETTINGS_INTENT,
      ),
    ).toBe('M');
    expect(
      resolveNotificationSettingsAccessTier('enable_notifications'),
    ).toBeNull();
  });

  it('detects confirmation settings without explicit business scope', () => {
    expect(
      isConfigureNotificationSettingsPrompt(
        'Configure send confirmation email',
      ),
    ).toBe(true);
  });

  it('merges explicit boolean params from classifier output', () => {
    expect(
      parseConfigureNotificationSettingsFromPrompt('hello world', {
        emailEnabled: true,
      }),
    ).toEqual({ emailEnabled: true });
  });

  it('parses confirmation toggles from compound segments', () => {
    expect(
      parseConfigureNotificationSettingsFromPrompt(
        'Configure notifications — enable confirmation email, disable confirmation WhatsApp',
        {},
      ),
    ).toEqual({
      sendConfirmationEmail: true,
      sendConfirmationWhatsapp: false,
    });
  });
});
