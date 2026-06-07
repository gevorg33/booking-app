import {
  isBulkUpdateServiceCurrencyPrompt,
  isConfigureBusinessCurrencyPrompt,
} from './ai-business-currency.util.js';
import { isSummarizePlPrompt } from './ai-retail-finance.util.js';
import {
  isTopStaffRevenuePrompt,
  isTotalEarningsPrompt,
} from './dashboard-revenue-analytics.util.js';

export const REPORTS_CURRENCY_INTENTS = ['explain_reports_currency'] as const;

export type ReportsCurrencyIntent = (typeof REPORTS_CURRENCY_INTENTS)[number];

export function isReportsCurrencyIntent(
  action: string,
): action is ReportsCurrencyIntent {
  return (REPORTS_CURRENCY_INTENTS as readonly string[]).includes(action);
}

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

function hasCurrencyCue(prompt: string): boolean {
  return (
    /[€֏₽$£]/.test(prompt) ||
    /\b(currency|currencies|iso|conversion|convert|fx|exchange)\b/i.test(
      prompt,
    ) ||
    /\b(AMD|EUR|RUB|USD|GBP|GEL|dram|euro|euros|ruble|dollar)\b/i.test(
      prompt,
    ) ||
    /(?:драм|драмах|евро)/i.test(prompt) ||
    /դրամ/i.test(prompt)
  );
}

export function hasReportsCurrencyContext(prompt: string): boolean {
  if (!hasCurrencyCue(prompt)) return false;

  const hasEnglishReportsSurface =
    /\b(reports?|analytics|dashboard|dashboard\s+overview|operations|p\s*&\s*l|profit\s+(and|&)\s+loss|p\/l|kpi|kpis)\b/i.test(
      prompt,
    ) ||
    /\b(staff\s+(?:performance|revenue)|service\s+(?:popularity|revenue)|revenue\s+this\s+month|net\s+profit|gross\s+revenue|expenses|commissions)\b/i.test(
      prompt,
    );

  if (hasEnglishReportsSurface) return true;

  if (containsArmenianScript(prompt) && /(հաշվետվ|վերլուծ)/i.test(prompt)) {
    return true;
  }

  if (
    containsCyrillicScript(prompt) &&
    /(отчёт|отчет|аналитик|выручк|p\s*&\s*l|операци)/i.test(prompt)
  ) {
    return true;
  }

  return false;
}

function isRevenueNumericQueryPrompt(prompt: string): boolean {
  if (
    /\b(why|explain|what\s+currency|which\s+currency|convert|conversion|fx)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  return (
    isTopStaffRevenuePrompt(prompt) ||
    isTotalEarningsPrompt(prompt) ||
    (isSummarizePlPrompt(prompt) &&
      !/\b(currency|currencies|convert|conversion)\b/i.test(prompt)) ||
    (/\b(calculate|compute|summarize|top\s+\d+|how\s+much\s+did)\b/i.test(
      prompt,
    ) &&
      /\b(revenue|earnings|earned|profit|p\s*&\s*l)\b/i.test(prompt))
  );
}

function hasRevenueKpiSummaryContextInline(prompt: string): boolean {
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

export function isExplainReportsCurrencyPrompt(prompt: string): boolean {
  if (isConfigureBusinessCurrencyPrompt(prompt)) return false;
  if (isBulkUpdateServiceCurrencyPrompt(prompt)) return false;
  if (isRevenueNumericQueryPrompt(prompt)) return false;
  if (hasRevenueKpiSummaryContextInline(prompt)) return false;
  if (!hasReportsCurrencyContext(prompt)) return false;

  if (
    /\b(why|what|which|explain|tell me|do|does|is|are)\b/i.test(prompt) ||
    /\b(convert|conversion|fx|exchange)\b/i.test(prompt)
  ) {
    return true;
  }

  if (containsArmenianScript(prompt)) {
    if (
      /(ինչու|ինչ|որ|բացատր)/i.test(prompt) &&
      /(հաշվետվ|վերլուծ|գումար|արժույթ|դրամ|€|֏)/i.test(prompt)
    ) {
      return true;
    }
  }

  if (containsCyrillicScript(prompt)) {
    if (
      /(почему|зачем|какая|какой|объясни)/i.test(prompt) &&
      /(отчёт|отчет|аналитик|выручк|валют|драм|€|֏)/i.test(prompt)
    ) {
      return true;
    }
  }

  return false;
}

export function rescueReportsCurrencyIntent(
  prompt: string,
  action: string,
): { action: ReportsCurrencyIntent; rescueReason: string } | null {
  if (isReportsCurrencyIntent(action)) return null;
  if (!isExplainReportsCurrencyPrompt(prompt)) return null;
  return {
    action: 'explain_reports_currency',
    rescueReason: 'explain_reports_currency',
  };
}
