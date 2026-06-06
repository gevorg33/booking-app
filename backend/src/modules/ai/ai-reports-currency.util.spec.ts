import { EXPLAIN_REPORTS_CURRENCY_PROMPTS } from './ai-reports-currency.fixtures.js';
import {
  hasReportsCurrencyContext,
  isExplainReportsCurrencyPrompt,
  isReportsCurrencyIntent,
  rescueReportsCurrencyIntent,
} from './ai-reports-currency.util.js';

describe('ai-reports-currency.util (ai-cmd-curr-13)', () => {
  it.each(EXPLAIN_REPORTS_CURRENCY_PROMPTS)(
    'detects explain reports currency prompt $id',
    ({ prompt }) => {
      expect(isExplainReportsCurrencyPrompt(prompt)).toBe(true);
    },
  );

  it('does not classify revenue analytics data queries as reports currency explain', () => {
    expect(
      isExplainReportsCurrencyPrompt('Calculate total earnings for today'),
    ).toBe(false);
    expect(
      isExplainReportsCurrencyPrompt('Top 3 specialists by revenue last week'),
    ).toBe(false);
    expect(isExplainReportsCurrencyPrompt('Summarize P&L this month')).toBe(
      false,
    );
  });

  it('does not rescue when action is already explain_reports_currency', () => {
    expect(
      rescueReportsCurrencyIntent(
        'Why do staff revenue reports show AMD?',
        'explain_reports_currency',
      ),
    ).toBeNull();
  });

  it('rescues misclassified reports currency prompts', () => {
    expect(
      rescueReportsCurrencyIntent(
        'Why do staff revenue reports show amounts in AMD?',
        'unknown',
      ),
    ).toEqual({
      action: 'explain_reports_currency',
      rescueReason: 'explain_reports_currency',
    });
  });

  it('recognizes reports currency intent id', () => {
    expect(isReportsCurrencyIntent('explain_reports_currency')).toBe(true);
  });

  it('matches Russian reports revenue currency prompt', () => {
    const prompt = 'Почему в отчётах выручка показана в драмах?';
    expect(hasReportsCurrencyContext(prompt)).toBe(true);
    expect(isExplainReportsCurrencyPrompt(prompt)).toBe(true);
  });
});
