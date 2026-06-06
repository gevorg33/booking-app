import {
  EXPLAIN_DATE_INPUT_FORMAT_PROMPTS,
  PREVIEW_DATE_INPUT_PARSE_PROMPTS,
} from './ai-date-input-format.fixtures.js';
import {
  isExplainDateInputFormatPrompt,
  isPreviewDateInputParsePrompt,
  parseDateStringsFromPrompt,
  rescueDateInputFormatIntent,
} from './ai-date-input-format.util.js';

describe('ai-date-input-format.util (ai-cmd-fmt-13..14)', () => {
  it.each(EXPLAIN_DATE_INPUT_FORMAT_PROMPTS)(
    'detects explain prompt $id',
    ({ prompt }) => {
      expect(isExplainDateInputFormatPrompt(prompt)).toBe(true);
      expect(isPreviewDateInputParsePrompt(prompt)).toBe(false);
      expect(rescueDateInputFormatIntent(prompt, 'unknown')).toEqual({
        action: 'explain_date_input_format',
        rescueReason: 'explain_date_input_format',
      });
    },
  );

  it.each(PREVIEW_DATE_INPUT_PARSE_PROMPTS)(
    'detects preview prompt $id',
    ({ prompt, dateStrings }) => {
      expect(isPreviewDateInputParsePrompt(prompt)).toBe(true);
      expect(isExplainDateInputFormatPrompt(prompt)).toBe(false);
      expect(rescueDateInputFormatIntent(prompt, 'unknown')).toEqual({
        action: 'preview_date_input_parse',
        rescueReason: 'preview_date_input_parse',
      });
      expect(parseDateStringsFromPrompt(prompt)).toEqual(dateStrings);
    },
  );

  it('does not rescue when action is already explain_date_input_format', () => {
    expect(
      rescueDateInputFormatIntent(
        'How do typed date fields parse input with our current date format?',
        'explain_date_input_format',
      ),
    ).toBeNull();
  });
});
