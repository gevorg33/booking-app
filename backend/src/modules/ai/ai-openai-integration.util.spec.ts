import {
  CONFIGURE_OPENAI_INTEGRATION_INTENT,
  CONFIGURE_OPENAI_INTEGRATION_PROMPTS,
  enrichOpenaiIntegrationParamsFromPrompt,
  isConfigureOpenaiIntegrationPrompt,
  parseConfigureOpenaiIntegrationFromPrompt,
  rescueConfigureOpenaiIntegrationIntent,
  resolveOpenaiIntegrationAccessTier,
} from './ai-openai-integration.util.js';

describe('ai-openai-integration.util', () => {
  it.each(CONFIGURE_OPENAI_INTEGRATION_PROMPTS)(
    'detects configure openai integration prompt $id',
    ({ prompt }) => {
      expect(isConfigureOpenaiIntegrationPrompt(prompt)).toBe(true);
    },
  );

  it.each(
    CONFIGURE_OPENAI_INTEGRATION_PROMPTS.filter(({ paramsPartial }) => paramsPartial),
  )(
    'parses configure openai integration fixture $id',
    ({ prompt, paramsPartial }) => {
      const parsed = parseConfigureOpenaiIntegrationFromPrompt(prompt, {});
      expect(parsed).not.toBeNull();
      for (const [key, value] of Object.entries(paramsPartial ?? {})) {
        expect(parsed?.[key as keyof typeof parsed]).toBe(value);
      }
    },
  );

  it.each(CONFIGURE_OPENAI_INTEGRATION_PROMPTS)(
    'rescues unknown action to configure_openai_integration for $id',
    ({ prompt, expectedAction }) => {
      expect(rescueConfigureOpenaiIntegrationIntent(prompt, 'unknown')).toEqual({
        action: expectedAction,
        rescueReason: expectedAction,
      });
    },
  );

  it('does not treat explain-ai-settings prompts as mutate', () => {
    expect(
      isConfigureOpenaiIntegrationPrompt(
        'Where do I configure the OpenAI API key?',
      ),
    ).toBe(false);
  });

  it('does not treat booking REST api key rotation as openai integration', () => {
    expect(
      isConfigureOpenaiIntegrationPrompt('Rotate API key named Main'),
    ).toBe(false);
  });

  it('resolves access tier for configure_openai_integration only', () => {
    expect(
      resolveOpenaiIntegrationAccessTier(CONFIGURE_OPENAI_INTEGRATION_INTENT),
    ).toBe('M');
    expect(resolveOpenaiIntegrationAccessTier('configure_zapier')).toBeNull();
  });

  it('enriches params from prompt', () => {
    const enriched = enrichOpenaiIntegrationParamsFromPrompt(
      {},
      'Use platform default OpenAI API',
    );
    expect(enriched.usePlatformDefault).toBe(true);
  });

  it('merges explicit params from classifier output', () => {
    expect(
      parseConfigureOpenaiIntegrationFromPrompt('hello world', {
        usePlatformDefault: true,
      }),
    ).toEqual({ usePlatformDefault: true });
  });
});
