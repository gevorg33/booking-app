import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { CONFIGURE_OPENAI_INTEGRATION_PROMPTS } from './ai-openai-integration.fixtures.js';
import { handleConfigureOpenaiIntegrationLogic } from './ai-openai-integration.logic.js';
import { rescueConfigureOpenaiIntegrationIntent } from './ai-openai-integration.util.js';
import { rescueIntegrationsIntent } from './ai-integrations.util.js';

describe('ai-openai-integration integration (ai-cmd-ext-2.21)', () => {
  const rescueService = new AiIntentRescueService();

  it.each(CONFIGURE_OPENAI_INTEGRATION_PROMPTS.slice(0, 4))(
    'rescues unknown prompt $id via integrations rescue',
    ({ prompt, expectedAction }) => {
      expect(rescueIntegrationsIntent(prompt, 'unknown')?.action).toBe(
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
    const prompt = 'Configure OpenAI integration for the salon';
    expect(
      rescueConfigureOpenaiIntegrationIntent(prompt, 'unknown')?.action,
    ).toBe('configure_openai_integration');
    expect(
      rescueService.rescue({ prompt, action: 'unknown', params: {} })?.action,
    ).toBe('configure_openai_integration');
  });

  it('does not rescue explain-ai-settings prompts', () => {
    expect(
      rescueConfigureOpenaiIntegrationIntent(
        'Where do I configure the OpenAI API key?',
        'unknown',
      ),
    ).toBeNull();
  });

  it('handleConfigureOpenaiIntegrationLogic end-to-end', async () => {
    const updateSettings = jest.fn(async (_id: string, patch: object) => ({
      configured: true,
      ...patch,
    }));
    const result = await handleConfigureOpenaiIntegrationLogic(
      { openAiIntegrationService: { updateSettings } as any },
      'biz-1',
      {},
      'Use platform default OpenAI API',
    );
    expect(result.success).toBe(true);
    expect(updateSettings).toHaveBeenCalledWith('biz-1', {
      usePlatformDefault: true,
    });
  });
});
