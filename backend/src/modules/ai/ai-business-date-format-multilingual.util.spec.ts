import { MULTILINGUAL_BUSINESS_DATE_FORMAT_EVAL_SCENARIOS } from './ai-business-date-format-multilingual.fixtures.js';
import {
  isConfigureBusinessDateFormatPrompt,
  isExplainBusinessDateFormatPrompt,
  parseBusinessDateFormatFromPrompt,
  rescueBusinessDateFormatIntent,
} from './ai-business-date-format.util.js';

describe('ai-business-date-format multilingual (ai-cmd-fmt-3)', () => {
  it.each(MULTILINGUAL_BUSINESS_DATE_FORMAT_EVAL_SCENARIOS)(
    'rescues $locale $id → $expectedAction',
    ({ prompt, expectedAction, rescueReason, paramsPartial }) => {
      const rescued = rescueBusinessDateFormatIntent(prompt, 'unknown');
      expect(rescued?.action).toBe(expectedAction);
      expect(rescued?.rescueReason).toBe(rescueReason);

      if (expectedAction === 'configure_business_date_format') {
        expect(isConfigureBusinessDateFormatPrompt(prompt)).toBe(true);
        expect(parseBusinessDateFormatFromPrompt(prompt)).toEqual(
          expect.objectContaining(paramsPartial ?? {}),
        );
      } else {
        expect(isExplainBusinessDateFormatPrompt(prompt)).toBe(true);
      }
    },
  );
});
