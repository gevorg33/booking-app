import {
  CONFIGURE_STACKED_TAX_RULES_PROMPTS,
  EXPLAIN_STACKED_TAX_PROMPTS,
} from './ai-stacked-tax.fixtures.js';
import {
  parseConfigureStackedTaxRulesFromPrompt,
  rescueStackedTaxIntent,
  ruleMatchesRemoveQuery,
} from './ai-stacked-tax.util.js';

describe('ai-stacked-tax.util (ai-cmd-tax-6..7)', () => {
  it.each(CONFIGURE_STACKED_TAX_RULES_PROMPTS)(
    'parses configure stacked tax prompt $id',
    ({ prompt, operation, rules, removeRuleName }) => {
      const parsed = parseConfigureStackedTaxRulesFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      expect(parsed?.operation).toBe(operation);
      if (removeRuleName) {
        expect(parsed?.removeRuleName?.toLowerCase()).toContain(
          removeRuleName.toLowerCase(),
        );
      }
      if (rules && rules.length > 0) {
        expect(parsed?.rules).toEqual(rules);
      }
    },
  );

  it.each(EXPLAIN_STACKED_TAX_PROMPTS)(
    'rescues explain stacked tax prompt $id',
    ({ prompt }) => {
      expect(rescueStackedTaxIntent(prompt, 'unknown')).toEqual({
        action: 'explain_stacked_tax',
        rescueReason: 'explain_stacked_tax',
      });
    },
  );

  it.each(
    CONFIGURE_STACKED_TAX_RULES_PROMPTS.filter(
      (entry) => !('clarify' in entry && entry.clarify),
    ),
  )('rescues configure stacked tax prompt $id', ({ prompt }) => {
    expect(rescueStackedTaxIntent(prompt, 'unknown')).toEqual({
      action: 'configure_stacked_tax_rules',
      rescueReason: 'configure_stacked_tax_rules',
    });
  });

  it('rescues rateless stack prompt for clarification flow', () => {
    expect(
      rescueStackedTaxIntent('Stack federal and state sales tax', 'unknown'),
    ).toEqual({
      action: 'configure_stacked_tax_rules',
      rescueReason: 'configure_stacked_tax_rules',
    });
    expect(
      parseConfigureStackedTaxRulesFromPrompt(
        'Stack federal and state sales tax',
      ),
    ).toEqual({ operation: 'add', rules: [] });
  });

  it('matches remove queries against stacked rule names', () => {
    expect(ruleMatchesRemoveQuery({ name: 'State' }, 'state')).toBe(true);
    expect(ruleMatchesRemoveQuery({ name: 'GST' }, 'provincial')).toBe(false);
  });

  it('does not rescue when action already matches', () => {
    expect(
      rescueStackedTaxIntent('Explain our stacked tax rules', 'explain_stacked_tax'),
    ).toBeNull();
  });
});
