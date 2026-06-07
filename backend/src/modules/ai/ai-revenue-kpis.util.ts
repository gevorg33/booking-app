import {
  isBulkUpdateServiceCurrencyPrompt,
  isConfigureBusinessCurrencyPrompt,
} from './ai-business-currency.util.js';
import { isSummarizePlPrompt } from './ai-retail-finance.util.js';
import { isExplainReportsCurrencyPrompt } from './ai-reports-currency.util.js';
import {
  isTopStaffRevenuePrompt,
  isTotalEarningsPrompt,
} from './dashboard-revenue-analytics.util.js';

export const REVENUE_KPIS_INTENTS = ['summarize_revenue_kpis'] as const;

export type RevenueKpisIntent = (typeof REVENUE_KPIS_INTENTS)[number];

export function isRevenueKpisIntent(
  action: string,
): action is RevenueKpisIntent {
  return (REVENUE_KPIS_INTENTS as readonly string[]).includes(action);
}

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

export function hasRevenueKpiSummaryContext(prompt: string): boolean {
  if (isExplainReportsCurrencyPrompt(prompt)) return false;

  if (
    /\b(kpi|kpis)\b/i.test(prompt) &&
    /\b(revenue|earnings|sales|income|կամուտ|выручк)/i.test(prompt) &&
    /\b(summarize|summary|overview|tell me|give me|show me|picture|snapshot|recap|ամփոփ|сводк|обзор)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    /\b(summarize|summary|overview|snapshot|recap|kpi|kpis|picture)\b/i.test(
      prompt,
    ) &&
    /\b(revenue|earnings|sales|income|կամուտ|выручк)/i.test(prompt) &&
    /\b(dashboard|reports?|analytics|staff|service|դաշտբորդ|հաշվետվ|отчёт|отчет|дашборд)/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (
    /\b(dashboard|reports?|analytics)\b/i.test(prompt) &&
    /\b(revenue|earnings)\b/i.test(prompt) &&
    /\b(summarize|summary|overview|tell me|give me|show me|snapshot)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }

  if (containsCyrillicScript(prompt)) {
    if (
      /(сводк|обзор|кратк|kpi)/i.test(prompt) &&
      /(выручк|дашборд|отчёт|отчет|аналитик)/i.test(prompt)
    ) {
      return true;
    }
  }

  if (containsArmenianScript(prompt)) {
    if (
      /(ամփոփ|ակնարկ|kpi)/i.test(prompt) &&
      /(եկամուտ|դաշտբորդ|հաշվետվ)/i.test(prompt)
    ) {
      return true;
    }
  }

  return false;
}

export function isSummarizeRevenueKpisPrompt(prompt: string): boolean {
  if (!hasRevenueKpiSummaryContext(prompt)) return false;
  if (isExplainReportsCurrencyPrompt(prompt)) return false;
  if (
    isConfigureBusinessCurrencyPrompt(prompt) &&
    !/\b(kpi|kpis|dashboard|reports?|overview|snapshot)\b/i.test(prompt)
  ) {
    return false;
  }
  if (isBulkUpdateServiceCurrencyPrompt(prompt)) return false;

  if (
    isTopStaffRevenuePrompt(prompt) &&
    !/\b(kpi|kpis|dashboard|reports?)\b/i.test(prompt)
  ) {
    return false;
  }

  if (
    isTotalEarningsPrompt(prompt) &&
    !/\b(kpi|kpis|dashboard|reports?|overview|snapshot)\b/i.test(prompt)
  ) {
    return false;
  }

  if (
    isSummarizePlPrompt(prompt) &&
    !/\b(dashboard|reports?|overview|kpi|kpis)\b/i.test(prompt)
  ) {
    return false;
  }

  return true;
}

export function rescueRevenueKpisIntent(
  prompt: string,
  action: string,
): { action: RevenueKpisIntent; rescueReason: string } | null {
  if (isRevenueKpisIntent(action)) return null;
  if (!isSummarizeRevenueKpisPrompt(prompt)) return null;
  return {
    action: 'summarize_revenue_kpis',
    rescueReason: 'summarize_revenue_kpis',
  };
}
