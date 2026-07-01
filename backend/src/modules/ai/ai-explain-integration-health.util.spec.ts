import { EXPLAIN_INTEGRATION_HEALTH_PROMPTS } from './ai-explain-integration-health.fixtures.js';
import {
  isExplainIntegrationHealthPrompt,
  parseIntegrationHealthFocusFromPrompt,
  rescueExplainIntegrationHealthIntent,
} from './ai-explain-integration-health.util.js';
import { isListIntegrationHealthPrompt } from './ai-integrations.util.js';

describe('ai-explain-integration-health.util', () => {
  it.each(EXPLAIN_INTEGRATION_HEALTH_PROMPTS)(
    'detects explain prompt $id',
    ({ prompt }) => {
      expect(isExplainIntegrationHealthPrompt(prompt)).toBe(true);
    },
  );

  it('parses integration focus from fixtures', () => {
    for (const fixture of EXPLAIN_INTEGRATION_HEALTH_PROMPTS) {
      if (!fixture.paramsPartial?.integrationFocus) continue;
      expect(
        parseIntegrationHealthFocusFromPrompt(
          fixture.prompt,
          fixture.paramsPartial,
        ),
      ).toBe(fixture.paramsPartial.integrationFocus);
    }
  });

  it('does not detect bulk list integration health', () => {
    expect(
      isExplainIntegrationHealthPrompt('List integration health status'),
    ).toBe(false);
    expect(
      isListIntegrationHealthPrompt('List integration health status'),
    ).toBe(true);
  });

  it('does not detect configure whatsapp mutate', () => {
    expect(
      isExplainIntegrationHealthPrompt('Configure WhatsApp integration'),
    ).toBe(false);
  });

  it('rescues unknown action to explain_integration_health', () => {
    expect(
      rescueExplainIntegrationHealthIntent('Is WhatsApp connected?', 'unknown'),
    ).toEqual({
      action: 'explain_integration_health',
      rescueReason: 'explain_integration_health',
    });
  });
});
