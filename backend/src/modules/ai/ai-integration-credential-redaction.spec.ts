/**
 * e2e-bug.464 residue / §222 — credentials must not come back in the response.
 *
 * `configure_openai_integration` and `configure_whatsapp_integration` both echo
 * their parsed patch to the client as `patch: parsed`, and that patch carries
 * the plaintext credential the user just supplied — an `apiKey` (`sk-…`) or a
 * WhatsApp `accessToken`. The human-readable summary already redacted
 * (`describeOpenaiIntegrationPatch` renders "OpenAI API key updated"); only the
 * structured detail was missed, on **both** the success and failure branches of
 * **both** handlers — four sites.
 *
 * That detail is also what gets stored with the command trace, so the leak
 * outlived the request. The trace's *prompt* half was already redacted by
 * `redactSecretsFromPrompt`; this is its structured counterpart.
 */
import { handleConfigureOpenaiIntegrationLogic } from './ai-openai-integration.logic.js';
import { handleConfigureWhatsappIntegrationLogic } from './ai-whatsapp-integration.logic.js';

const API_KEY = 'sk-live1234567890abcdefghij';
const ACCESS_TOKEN = 'EAAGtok3nvalue000111222';

const openaiDeps = (updateSettings: jest.Mock) =>
  ({ openAiIntegrationService: { updateSettings } }) as never;
const whatsappDeps = (updateSettings: jest.Mock) =>
  ({ whatsappIntegrationService: { updateSettings } }) as never;

describe('integration credentials are redacted from command details', () => {
  describe('configure_openai_integration', () => {
    it('does not return the api key on the success branch', async () => {
      const result: any = await handleConfigureOpenaiIntegrationLogic(
        openaiDeps(
          jest.fn().mockResolvedValue({ usingPlatformDefault: false }),
        ),
        'biz-1',
        { apiKey: API_KEY, usePlatformDefault: false },
        `set the openai key to ${API_KEY}`,
      );

      expect(result.success).toBe(true);
      expect(JSON.stringify(result.details)).not.toContain(API_KEY);
      expect(result.details.patch.apiKey).toBe('[REDACTED_SECRET]');
    });

    it('does not return the api key on the failure branch either', async () => {
      const result: any = await handleConfigureOpenaiIntegrationLogic(
        openaiDeps(jest.fn().mockRejectedValue(new Error('upstream refused'))),
        'biz-1',
        { apiKey: API_KEY, usePlatformDefault: false },
        `set the openai key to ${API_KEY}`,
      );

      // The failure branch matters more, not less: it is the one that fires
      // when the key is wrong, i.e. exactly when a human is most likely to be
      // reading the raw detail while debugging.
      expect(result.success).toBe(false);
      expect(JSON.stringify(result.details)).not.toContain(API_KEY);
      expect(result.details.patch.apiKey).toBe('[REDACTED_SECRET]');
    });
  });

  describe('configure_whatsapp_integration', () => {
    it('does not return the access token on the success branch', async () => {
      const result: any = await handleConfigureWhatsappIntegrationLogic(
        whatsappDeps(
          jest.fn().mockResolvedValue({ usingPlatformDefault: false }),
        ),
        'biz-1',
        { accessToken: ACCESS_TOKEN, usePlatformDefault: false },
        `set the whatsapp token to ${ACCESS_TOKEN}`,
      );

      expect(result.success).toBe(true);
      expect(JSON.stringify(result.details)).not.toContain(ACCESS_TOKEN);
      expect(result.details.patch.accessToken).toBe('[REDACTED_SECRET]');
    });

    it('does not return the access token on the failure branch either', async () => {
      const result: any = await handleConfigureWhatsappIntegrationLogic(
        whatsappDeps(
          jest.fn().mockRejectedValue(new Error('upstream refused')),
        ),
        'biz-1',
        { accessToken: ACCESS_TOKEN, usePlatformDefault: false },
        `set the whatsapp token to ${ACCESS_TOKEN}`,
      );

      expect(result.success).toBe(false);
      expect(JSON.stringify(result.details)).not.toContain(ACCESS_TOKEN);
      expect(result.details.patch.accessToken).toBe('[REDACTED_SECRET]');
    });
  });

  it('leaves the non-credential half of the patch intact', async () => {
    // The mask must not become a blunt instrument: the rest of the patch is
    // what tells the client which settings actually changed.
    const result: any = await handleConfigureOpenaiIntegrationLogic(
      openaiDeps(jest.fn().mockResolvedValue({ usingPlatformDefault: false })),
      'biz-1',
      { apiKey: API_KEY, usePlatformDefault: false },
      `set the openai key to ${API_KEY}`,
    );

    expect(result.details.patch.usePlatformDefault).toBe(false);
  });
});
