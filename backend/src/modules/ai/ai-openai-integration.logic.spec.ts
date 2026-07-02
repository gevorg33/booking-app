import { handleConfigureOpenaiIntegrationLogic } from './ai-openai-integration.logic.js';
import * as openaiIntegrationUtil from './ai-openai-integration.util.js';

describe('ai-openai-integration.logic', () => {
  it('updates openai integration settings', async () => {
    const updateSettings = jest.fn(
      async (_businessId: string, patch: object) => ({
        configured: true,
        usingPlatformDefault: false,
        ...patch,
      }),
    );

    const result = await handleConfigureOpenaiIntegrationLogic(
      { openAiIntegrationService: { updateSettings } as any },
      'biz-1',
      {},
      'Set OpenAI API key sk-testkey123456789012345678901234',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('configure_openai_integration');
    expect(updateSettings).toHaveBeenCalledWith('biz-1', {
      apiKey: 'sk-testkey123456789012345678901234',
    });
  });

  it('returns guide when no patch fields are parsed', async () => {
    const getPublicSettings = jest.fn(async () => ({
      configured: false,
      usingPlatformDefault: false,
      usage: { totalTokens: 0 },
    }));

    const result = await handleConfigureOpenaiIntegrationLogic(
      { openAiIntegrationService: { getPublicSettings } as any },
      'biz-1',
      {},
      'Configure OpenAI integration for the salon',
    );

    expect(result.success).toBe(true);
    expect(result.details?.navigate).toEqual({
      path: '/dashboard/settings',
      label: 'Open Settings → OpenAI',
    });
  });

  it('returns clarify when parse fails', async () => {
    const result = await handleConfigureOpenaiIntegrationLogic(
      { openAiIntegrationService: { updateSettings: jest.fn() } as any },
      'biz-1',
      {},
      'hello world',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('returns guide when integration is already configured', async () => {
    const result = await handleConfigureOpenaiIntegrationLogic(
      {
        openAiIntegrationService: {
          getPublicSettings: jest.fn(async () => ({
            configured: true,
            usingPlatformDefault: true,
            usage: { totalTokens: 100 },
          })),
        } as any,
      },
      'biz-1',
      {},
      'Configure OpenAI integration for the salon',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('configured');
  });

  it('returns failure when update throws', async () => {
    const result = await handleConfigureOpenaiIntegrationLogic(
      {
        openAiIntegrationService: {
          updateSettings: jest.fn(async () => {
            throw new Error('OpenAI API key is required');
          }),
        } as any,
      },
      'biz-1',
      {},
      'Connect our own OpenAI API key',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('OpenAI API key is required');
  });

  it('returns generic summary when patch labels are empty', async () => {
    jest
      .spyOn(openaiIntegrationUtil, 'describeOpenaiIntegrationPatch')
      .mockReturnValueOnce([]);

    const result = await handleConfigureOpenaiIntegrationLogic(
      {
        openAiIntegrationService: {
          updateSettings: jest.fn(async () => ({
            configured: true,
            usingPlatformDefault: true,
          })),
        } as any,
      },
      'biz-1',
      {},
      'Use platform default OpenAI API',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toBe('OpenAI integration updated.');
  });
});
