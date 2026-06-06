import { EXPLAIN_REPORTS_CURRENCY_PROMPTS } from './ai-reports-currency.fixtures.js';
import { SUMMARIZE_REVENUE_KPIS_PROMPTS } from './ai-revenue-kpis.fixtures.js';
import {
  isSummarizeRevenueKpisPrompt,
  isRevenueKpisIntent,
  rescueRevenueKpisIntent,
} from './ai-revenue-kpis.util.js';

describe('ai-revenue-kpis.util (ai-cmd-curr-14)', () => {
  it.each(SUMMARIZE_REVENUE_KPIS_PROMPTS)(
    'detects summarize revenue KPIs prompt $id',
    ({ prompt }) => {
      expect(isSummarizeRevenueKpisPrompt(prompt)).toBe(true);
    },
  );

  it.each(EXPLAIN_REPORTS_CURRENCY_PROMPTS)(
    'does not classify reports currency explain prompt $id as revenue KPI summary',
    ({ prompt }) => {
      expect(isSummarizeRevenueKpisPrompt(prompt)).toBe(false);
    },
  );

  it('does not classify single total earnings as revenue KPI summary', () => {
    expect(isSummarizeRevenueKpisPrompt('Calculate total earnings for today')).toBe(
      false,
    );
    expect(
      isSummarizeRevenueKpisPrompt('Top 3 specialists by revenue last week'),
    ).toBe(false);
    expect(isSummarizeRevenueKpisPrompt('Summarize P&L this month')).toBe(false);
  });

  it('does not rescue when action is already summarize_revenue_kpis', () => {
    expect(
      rescueRevenueKpisIntent(
        'Summarize revenue KPIs for this month',
        'summarize_revenue_kpis',
      ),
    ).toBeNull();
  });

  it('rescues misclassified revenue KPI prompts', () => {
    expect(
      rescueRevenueKpisIntent(
        'Summarize revenue KPIs for this month',
        'unknown',
      ),
    ).toEqual({
      action: 'summarize_revenue_kpis',
      rescueReason: 'summarize_revenue_kpis',
    });
  });

  it('recognizes revenue KPIs intent id', () => {
    expect(isRevenueKpisIntent('summarize_revenue_kpis')).toBe(true);
  });
});
