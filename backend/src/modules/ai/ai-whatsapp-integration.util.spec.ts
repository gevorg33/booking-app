import {
  CONFIGURE_WHATSAPP_INTEGRATION_INTENT,
  CONFIGURE_WHATSAPP_INTEGRATION_PROMPTS,
  enrichWhatsappIntegrationParamsFromPrompt,
  isConfigureWhatsappIntegrationPrompt,
  parseConfigureWhatsappIntegrationFromPrompt,
  rescueConfigureWhatsappIntegrationIntent,
  resolveWhatsappIntegrationAccessTier,
} from './ai-whatsapp-integration.util.js';

describe('ai-whatsapp-integration.util', () => {
  it.each(CONFIGURE_WHATSAPP_INTEGRATION_PROMPTS)(
    'detects configure whatsapp integration prompt $id',
    ({ prompt }) => {
      expect(isConfigureWhatsappIntegrationPrompt(prompt)).toBe(true);
    },
  );

  it.each(
    CONFIGURE_WHATSAPP_INTEGRATION_PROMPTS.filter(({ paramsPartial }) => paramsPartial),
  )(
    'parses configure whatsapp integration fixture $id',
    ({ prompt, paramsPartial }) => {
      const parsed = parseConfigureWhatsappIntegrationFromPrompt(prompt, {});
      expect(parsed).not.toBeNull();
      for (const [key, value] of Object.entries(paramsPartial ?? {})) {
        expect(parsed?.[key as keyof typeof parsed]).toBe(value);
      }
    },
  );

  it.each(CONFIGURE_WHATSAPP_INTEGRATION_PROMPTS)(
    'rescues unknown action to configure_whatsapp_integration for $id',
    ({ prompt, expectedAction }) => {
      expect(rescueConfigureWhatsappIntegrationIntent(prompt, 'unknown')).toEqual({
        action: expectedAction,
        rescueReason: expectedAction,
      });
    },
  );

  it('does not treat whatsapp channel toggles as integration setup', () => {
    expect(
      isConfigureWhatsappIntegrationPrompt(
        'Enable WhatsApp notifications for booking reminders',
      ),
    ).toBe(false);
  });

  it('does not treat whatsapp test send as integration setup', () => {
    expect(
      isConfigureWhatsappIntegrationPrompt('Send test WhatsApp message'),
    ).toBe(false);
  });

  it('resolves access tier for configure_whatsapp_integration only', () => {
    expect(
      resolveWhatsappIntegrationAccessTier(CONFIGURE_WHATSAPP_INTEGRATION_INTENT),
    ).toBe('M');
    expect(resolveWhatsappIntegrationAccessTier('test_push')).toBeNull();
  });

  it('enriches params from prompt', () => {
    const enriched = enrichWhatsappIntegrationParamsFromPrompt(
      {},
      'Use platform default WhatsApp connection',
    );
    expect(enriched.usePlatformDefault).toBe(true);
  });

  it('merges explicit boolean params from classifier output', () => {
    expect(
      parseConfigureWhatsappIntegrationFromPrompt('hello world', {
        usePlatformDefault: true,
      }),
    ).toEqual({ usePlatformDefault: true });
  });

  it('parses fallback language from prompt', () => {
    expect(
      parseConfigureWhatsappIntegrationFromPrompt(
        'Set WhatsApp fallback language to en_US',
        {},
      ),
    ).toEqual({ fallbackLanguage: 'en_US' });
  });
});
