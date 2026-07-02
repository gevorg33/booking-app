import {
  CONFIGURE_LOYALTY_SETTINGS_PROMPTS,
  extractEarnPercentFromPrompt,
  extractLoyaltyEnabledFromPrompt,
  isConfigureLoyaltySettingsPrompt,
  parseConfigureLoyaltySettingsFromPrompt,
  rescueConfigureLoyaltySettingsIntent,
} from './ai-configure-loyalty-settings.util.js';

describe('ai-configure-loyalty-settings.util', () => {
  it.each(CONFIGURE_LOYALTY_SETTINGS_PROMPTS)(
    'detects configure prompt $id',
    ({ prompt }) => {
      expect(isConfigureLoyaltySettingsPrompt(prompt)).toBe(true);
    },
  );

  it.each(CONFIGURE_LOYALTY_SETTINGS_PROMPTS)(
    'parses configure prompt $id',
    ({ prompt, paramsPartial }) => {
      const parsed = parseConfigureLoyaltySettingsFromPrompt(prompt, {});
      expect(parsed).toMatchObject(paramsPartial ?? {});
    },
  );

  it('disambiguates configure from summarize and customer balance', () => {
    expect(isConfigureLoyaltySettingsPrompt('How does loyalty work')).toBe(
      false,
    );
    expect(isConfigureLoyaltySettingsPrompt('Summarize loyalty program')).toBe(
      false,
    );
    expect(isConfigureLoyaltySettingsPrompt('Check my loyalty points')).toBe(
      false,
    );
    expect(
      isConfigureLoyaltySettingsPrompt('Set loyalty earn rate to 10%'),
    ).toBe(true);
  });

  it('rescues unknown action to configure_loyalty_settings', () => {
    expect(
      rescueConfigureLoyaltySettingsIntent(
        'Set loyalty earn rate to 10%',
        'unknown',
      ),
    ).toEqual({
      action: 'configure_loyalty_settings',
      rescueReason: 'configure_loyalty_settings',
    });
  });

  it('extracts earn percent and enabled toggles', () => {
    expect(extractEarnPercentFromPrompt('Set loyalty earn rate to 10%')).toBe(
      10,
    );
    expect(
      extractEarnPercentFromPrompt('Configure loyalty — 5% cashback'),
    ).toBe(5);
    expect(extractLoyaltyEnabledFromPrompt('Enable loyalty program')).toBe(
      true,
    );
    expect(extractLoyaltyEnabledFromPrompt('Disable loyalty program')).toBe(
      false,
    );
    expect(
      parseConfigureLoyaltySettingsFromPrompt('Book a haircut', {}),
    ).toBeNull();
    expect(
      parseConfigureLoyaltySettingsFromPrompt('', {
        earnPercentCashback: 10,
      }),
    ).toMatchObject({ earnPercentCashback: 10 });
    expect(
      parseConfigureLoyaltySettingsFromPrompt('', {
        enabled: false,
      }),
    ).toMatchObject({ enabled: false });
  });
});
