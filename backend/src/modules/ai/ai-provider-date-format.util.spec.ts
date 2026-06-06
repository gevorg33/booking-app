import {
  CONFIGURE_PROVIDER_PUSH_DATE_FORMAT_PROMPTS,
  EXPLAIN_PROVIDER_DATE_DISPLAY_PROMPTS,
} from './ai-provider-date-format.fixtures.js';
import {
  isConfigureProviderPushDateFormatPrompt,
  isExplainProviderDateDisplayPrompt,
  parseProviderPushTimeFormatFromPrompt,
  rescueProviderDateFormatIntent,
} from './ai-provider-date-format.util.js';

describe('ai-provider-date-format.util (ai-cmd-fmt-15..16)', () => {
  it.each(EXPLAIN_PROVIDER_DATE_DISPLAY_PROMPTS)(
    'detects explain prompt $id',
    ({ prompt }) => {
      expect(isExplainProviderDateDisplayPrompt(prompt)).toBe(true);
      expect(isConfigureProviderPushDateFormatPrompt(prompt)).toBe(false);
      expect(rescueProviderDateFormatIntent(prompt, 'unknown')).toEqual({
        action: 'explain_provider_date_display',
        rescueReason: 'explain_provider_date_display',
      });
    },
  );

  it.each(CONFIGURE_PROVIDER_PUSH_DATE_FORMAT_PROMPTS)(
    'detects configure prompt $id',
    ({ prompt, timeFormat }) => {
      expect(isConfigureProviderPushDateFormatPrompt(prompt)).toBe(true);
      expect(isExplainProviderDateDisplayPrompt(prompt)).toBe(false);
      expect(rescueProviderDateFormatIntent(prompt, 'unknown')).toEqual({
        action: 'configure_provider_push_date_format',
        rescueReason: 'configure_provider_push_date_format',
      });
      if (timeFormat) {
        expect(parseProviderPushTimeFormatFromPrompt(prompt)?.timeFormat).toBe(
          timeFormat,
        );
      }
    },
  );

  it('does not rescue when action is already explain_provider_date_display', () => {
    expect(
      rescueProviderDateFormatIntent(
        'How does the provider app format dates on booking cards?',
        'explain_provider_date_display',
      ),
    ).toBeNull();
  });
});
