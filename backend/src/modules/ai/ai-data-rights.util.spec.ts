import { EXPLAIN_DATA_RIGHTS_PROMPTS } from './ai-data-rights.fixtures.js';
import {
  isExplainDataRightsPrompt,
  parseExplainDataRightsFromPrompt,
  rescueExplainDataRightsIntent,
} from './ai-data-rights.util.js';

describe('ai-data-rights.util', () => {
  it.each(EXPLAIN_DATA_RIGHTS_PROMPTS)(
    'detects explain_data_rights for $id',
    ({ prompt, aspect }) => {
      expect(isExplainDataRightsPrompt(prompt)).toBe(true);
      const parsed = parseExplainDataRightsFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      expect(parsed?.aspect).toBe(aspect);
      expect(rescueExplainDataRightsIntent(prompt, 'unknown')).toEqual({
        action: 'explain_data_rights',
        rescueReason: 'explain_data_rights',
      });
    },
  );

  it('does not steal direct privacy export/delete mutate prompts', () => {
    expect(isExplainDataRightsPrompt('Export my personal data')).toBe(false);
    expect(isExplainDataRightsPrompt('Delete my account data')).toBe(false);
    expect(
      rescueExplainDataRightsIntent('Export my personal data', 'unknown'),
    ).toBeNull();
  });

  it('distinguishes read vs mutate for export phrasing', () => {
    expect(
      isExplainDataRightsPrompt('How can I export my personal data?'),
    ).toBe(true);
    expect(
      parseExplainDataRightsFromPrompt('How can I export my personal data?')
        ?.aspect,
    ).toBe('export');
  });

  it('does not route dashboard cookie banner configuration', () => {
    expect(
      isExplainDataRightsPrompt('Enable cookie banner on our booking page'),
    ).toBe(false);
  });
});
