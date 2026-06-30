import { EXPLAIN_MULTI_SERVICE_SETTINGS_PROMPTS } from './ai-explain-multi-service-settings.fixtures.js';
import {
  isExplainMultiServiceSettingsPrompt,
  rescueExplainMultiServiceSettingsIntent,
} from './ai-explain-multi-service-settings.util.js';

describe('ai-explain-multi-service-settings.util', () => {
  it.each(EXPLAIN_MULTI_SERVICE_SETTINGS_PROMPTS)(
    'detects explain prompt $id',
    ({ prompt }) => {
      expect(isExplainMultiServiceSettingsPrompt(prompt)).toBe(true);
    },
  );

  it('does not detect configure multi-service mutate', () => {
    expect(
      isExplainMultiServiceSettingsPrompt(
        'Enable multi-service booking max 3 services 180 min',
      ),
    ).toBe(false);
  });

  it('does not detect scheduling mode mutate', () => {
    expect(
      isExplainMultiServiceSettingsPrompt(
        'Configure multi-service scheduling mode to same visit',
      ),
    ).toBe(false);
  });

  it('does not detect service compatibility mutate', () => {
    expect(
      isExplainMultiServiceSettingsPrompt(
        'Block massage and facial together on the same visit',
      ),
    ).toBe(false);
  });

  it('rescues unknown action to explain_multi_service_settings', () => {
    expect(
      rescueExplainMultiServiceSettingsIntent(
        'Explain multi-service booking settings',
        'unknown',
      ),
    ).toEqual({
      action: 'explain_multi_service_settings',
      rescueReason: 'explain_multi_service_settings',
    });
  });
});
