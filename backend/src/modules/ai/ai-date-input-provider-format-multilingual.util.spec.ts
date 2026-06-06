import { MULTILINGUAL_DATE_INPUT_PROVIDER_FORMAT_EVAL_SCENARIOS } from './ai-date-input-provider-format-multilingual.fixtures.js';
import { rescueDateInputFormatIntent } from './ai-date-input-format.util.js';
import { rescueProviderDateFormatIntent } from './ai-provider-date-format.util.js';

function rescueDateInputProviderFormatIntent(
  prompt: string,
  action: string,
): { action: string; rescueReason: string } | null {
  const dateInput = rescueDateInputFormatIntent(prompt, action);
  if (dateInput) return dateInput;
  return rescueProviderDateFormatIntent(prompt, action);
}

describe('ai-date-input-provider-format multilingual (ai-cmd-fmt-17)', () => {
  it.each(MULTILINGUAL_DATE_INPUT_PROVIDER_FORMAT_EVAL_SCENARIOS)(
    'rescues $locale $id → $expectedAction',
    ({ prompt, expectedAction, rescueReason, needsMultilingual }) => {
      const rescued = rescueDateInputProviderFormatIntent(prompt, 'unknown');
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescueReason).toBe(rescueReason);
      if (needsMultilingual) {
        expect(prompt).toMatch(/[\u0530-\u058F\u0400-\u04FF]/);
      }
    },
  );
});
