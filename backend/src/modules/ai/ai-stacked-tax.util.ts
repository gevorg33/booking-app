import {
  normalizeTaxRatePercent,
  type TaxRule,
} from '../../common/utils/business-tax.util.js';

const SERVICE_TAX_SCOPE_CUE =
  /\b(?:service|services|massage|consultation|consultations|treatment|treatments|facial|facials|dental|spa|catalog)\b/i;

function containsArmenianScript(text: string): boolean {
  return /[\u0530-\u058F]/.test(text);
}

function containsCyrillicScript(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

function isServiceScopedTaxPrompt(prompt: string): boolean {
  if (!SERVICE_TAX_SCOPE_CUE.test(prompt)) return false;
  return (
    /\b(?:tax[- ]?exempt|no\s+tax|zero\s+tax|0\s*%?\s*tax)\b/i.test(prompt) ||
    /\b(?:apply|make|set|assign|use)\b/i.test(prompt)
  );
}

export const STACKED_TAX_INTENTS = [
  'configure_stacked_tax_rules',
  'explain_stacked_tax',
] as const;

export const STACKED_TAX_MUTATE_INTENTS = [
  'configure_stacked_tax_rules',
] as const;

export type StackedTaxIntent = (typeof STACKED_TAX_INTENTS)[number];

export type StackedTaxOperation = 'add' | 'remove';

export interface ParsedStackedTaxRule {
  name: string;
  rate: number;
}

export interface ParsedConfigureStackedTaxRules {
  operation: StackedTaxOperation;
  rules?: ParsedStackedTaxRule[];
  removeRuleName?: string;
}

const STACKED_TAX_NAME_ALIASES: Record<string, string> = {
  gst: 'GST',
  pst: 'PST',
  hst: 'HST',
  vat: 'VAT',
  federal: 'Federal',
  state: 'State',
  provincial: 'Provincial',
  regional: 'Regional',
  'sales tax': 'Sales Tax',
  федеральный: 'Federal',
  федеральн: 'Federal',
  региональный: 'Regional',
  региональн: 'Regional',
  регионального: 'Regional',
  провинциальный: 'Provincial',
  провинциальн: 'Provincial',
  провинциального: 'Provincial',
  նահանգային: 'State',
  պրովինցիական: 'Provincial',
  ֆեդերալ: 'Federal',
  федерального: 'Federal',
};

function normalizeStackedTaxName(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (STACKED_TAX_NAME_ALIASES[trimmed]) {
    return STACKED_TAX_NAME_ALIASES[trimmed];
  }
  if (/^sales\s*tax$/i.test(trimmed)) return 'Sales Tax';
  return raw.trim().replace(/\b\w/g, (char) => char.toUpperCase());
}

function hasStackedTaxContext(prompt: string): boolean {
  if (/\b(stack(?:ed)?|multiple\s+tax\s+rules?|tax\s+rules?)\b/i.test(prompt)) {
    return true;
  }
  if (
    /\b(?:gst|pst|hst)\b.*\b(?:and|plus|\+)\b.*\b(?:gst|pst|hst)\b/i.test(
      prompt,
    )
  ) {
    return true;
  }
  if (/\bfederal\b.*\b(?:state|provincial)\b/i.test(prompt)) return true;
  if (/\bprovincial\b/i.test(prompt) && /\btax\b/i.test(prompt)) return true;
  if (/\bregional\b/i.test(prompt) && /\btax\b/i.test(prompt)) return true;
  if (
    /\b(?:remove|delete|drop)\b/i.test(prompt) &&
    /\b(?:tax\s+rule|rule)\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\b(?:add|stack)\b/i.test(prompt) &&
    /\b(?:gst|pst|hst|federal|state|provincial|regional)\b/i.test(prompt)
  ) {
    return true;
  }
  if (containsArmenianScript(prompt)) {
    if (/(gst|pst|hst).*(և|\+).*(gst|pst|hst)/i.test(prompt)) return true;
    if (/(ֆեդերալ|նահանգ|պրովինցիական|կուտակված).*հարկ/i.test(prompt)) {
      return true;
    }
    if (/(կանոն|կուտակված)/i.test(prompt) && /հարկ/i.test(prompt)) {
      return true;
    }
  }
  if (containsCyrillicScript(prompt)) {
    if (/(gst|pst|hst).*(и|плюс|\+).*(gst|pst|hst)/i.test(prompt)) {
      return true;
    }
    if (
      /(федеральн|региональн|провинциальн|stacked|stack).*налог/i.test(prompt)
    ) {
      return true;
    }
    if (/налогов.*правил/i.test(prompt)) return true;
  }
  return false;
}

function extractPairedRatesForNamedTaxes(
  prompt: string,
): ParsedStackedTaxRule[] {
  const pairMatch = prompt.match(
    /(\d+(?:\.\d+)?)\s*%?\s*(?:и|and|\+|և)\s*(\d+(?:\.\d+)?)\s*%?/i,
  );
  if (!pairMatch) return [];

  const firstRate = normalizeTaxRatePercent(pairMatch[1]);
  const secondRate = normalizeTaxRatePercent(pairMatch[2]);
  if (firstRate == null || secondRate == null) return [];

  const rules: ParsedStackedTaxRule[] = [];
  if (/\b(?:federal|федеральн)/i.test(prompt)) {
    rules.push({ name: 'Federal', rate: firstRate });
  }
  if (/\b(?:regional|региональн)/i.test(prompt)) {
    rules.push({ name: 'Regional', rate: secondRate });
  } else if (/\b(?:provincial|պրովինցիական)/i.test(prompt)) {
    rules.push({ name: 'Provincial', rate: secondRate });
  } else if (/\b(?:state|նահանգ)/i.test(prompt)) {
    rules.push({ name: 'State', rate: secondRate });
  }
  return rules.length >= 2 ? rules : [];
}

function extractStackedTaxRules(prompt: string): ParsedStackedTaxRule[] {
  const rules: ParsedStackedTaxRule[] = [];
  const seen = new Set<string>();

  const pairedRates = extractPairedRatesForNamedTaxes(prompt);
  for (const rule of pairedRates) {
    const key = rule.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      rules.push(rule);
    }
  }

  const rateFirstPattern =
    /(\d+(?:\.\d+)?)\s*%?\s*(gst|pst|hst|vat|federal|state|provincial|regional|sales\s*tax|федеральн(?:ый)?|региональн(?:ый)?|провинциальн(?:ый)?|նահանգային|պրովինցիական|ֆեդերալ)/gi;
  for (const match of prompt.matchAll(rateFirstPattern)) {
    const rate = normalizeTaxRatePercent(match[1]);
    if (rate == null || rate <= 0) continue;
    const name = normalizeStackedTaxName(match[2]);
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    rules.push({ name, rate });
  }

  const nameFirstPattern =
    /\b(gst|pst|hst|vat|federal|state|provincial|regional)\s+(?:at\s+)?(\d+(?:\.\d+)?)\s*%?/gi;
  for (const match of prompt.matchAll(nameFirstPattern)) {
    const rate = normalizeTaxRatePercent(match[2]);
    if (rate == null || rate <= 0) continue;
    const name = normalizeStackedTaxName(match[1]);
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    rules.push({ name, rate });
  }

  return rules;
}

function extractRemoveRuleName(
  prompt: string,
  params: Record<string, unknown> = {},
): string | undefined {
  if (
    typeof params.removeRuleName === 'string' &&
    params.removeRuleName.trim()
  ) {
    return params.removeRuleName.trim();
  }

  const patterns = [
    /\b(?:remove|delete|drop)\s+(?:the\s+)?(.+?)\s+(?:tax\s+)?rule\b/i,
    /\b(?:remove|delete|drop)\s+(?:the\s+)?(.+?)\s+tax\b/i,
    /(?:հեռացնել|ջնջել)\s+(.+?)\s+հարկի\s+կանոն[\w]*/i,
    /(?:удалить|убрать)\s+(?:правило\s+)?(.+?)\s+(?:налог|налога)/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match?.[1]) {
      const raw = match[1].trim();
      if (raw.length >= 2) return normalizeStackedTaxName(raw);
    }
  }
  return undefined;
}

export function parseConfigureStackedTaxRulesFromPrompt(
  prompt: string,
  params: Record<string, unknown> = {},
): ParsedConfigureStackedTaxRules | null {
  const removeRuleName = extractRemoveRuleName(prompt, params);
  const rulesFromParams = normalizeRulesFromParams(params.rules);
  const rules = rulesFromParams.length
    ? rulesFromParams
    : extractStackedTaxRules(prompt);

  const operationFromParams =
    params.operation === 'add' || params.operation === 'remove'
      ? params.operation
      : undefined;

  const isRemove =
    operationFromParams === 'remove' ||
    (removeRuleName !== undefined &&
      (/\b(?:remove|delete|drop)\b/i.test(prompt) ||
        (containsArmenianScript(prompt) && /(հեռացնել|ջնջել)/i.test(prompt)) ||
        (containsCyrillicScript(prompt) && /(удалить|убрать)/i.test(prompt))));

  if (isRemove) {
    if (!removeRuleName) return null;
    return { operation: 'remove', removeRuleName };
  }

  if (rules.length > 0) {
    const operation = operationFromParams ?? 'add';
    return { operation, rules };
  }

  if (
    (/\b(?:stack|add|set up)\b/i.test(prompt) ||
      (containsArmenianScript(prompt) &&
        /(ավելացնել|կուտակել|նախադրել)/i.test(prompt)) ||
      (containsCyrillicScript(prompt) &&
        /(добавить|настроить|stack)/i.test(prompt))) &&
    hasStackedTaxContext(prompt)
  ) {
    return { operation: 'add', rules: [] };
  }

  return null;
}

function normalizeRulesFromParams(value: unknown): ParsedStackedTaxRule[] {
  if (!Array.isArray(value)) return [];
  const rules: ParsedStackedTaxRule[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const raw = entry as Record<string, unknown>;
    const rate = normalizeTaxRatePercent(raw.rate);
    const name =
      typeof raw.name === 'string' && raw.name.trim()
        ? normalizeStackedTaxName(raw.name)
        : undefined;
    if (rate != null && rate > 0 && name) {
      rules.push({ name, rate });
    }
  }
  return rules;
}

export function isConfigureStackedTaxRulesPrompt(prompt: string): boolean {
  if (!hasStackedTaxContext(prompt)) return false;
  if (isServiceScopedTaxPrompt(prompt)) return false;

  if (
    /\b(?:preview|quote|estimate|staff\s+booking|before\s+creat)\b/i.test(
      prompt,
    )
  ) {
    return false;
  }

  if (
    /\b(explain|describe|what|which|why|how|list|show)\b/i.test(prompt) &&
    !/\b(?:add|stack|remove|delete|drop)\b/i.test(prompt) &&
    !(containsArmenianScript(prompt) && /(ավելացնել|հեռացնել)/i.test(prompt)) &&
    !(
      containsCyrillicScript(prompt) &&
      /(добавить|удалить|убрать|настроить)/i.test(prompt)
    )
  ) {
    return false;
  }

  if (
    /\b(?:remove|delete|drop)\b/i.test(prompt) ||
    (containsArmenianScript(prompt) && /(հեռացնել|ջնջել)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) && /(удалить|убрать)/i.test(prompt))
  ) {
    return true;
  }
  if (
    /\b(?:add|stack|set up)\b/i.test(prompt) ||
    (containsArmenianScript(prompt) && /(ավելացնել|կուտակել)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(добавить|настроить|stack)/i.test(prompt))
  ) {
    return true;
  }

  return extractStackedTaxRules(prompt).length >= 2;
}

export function isExplainStackedTaxPrompt(prompt: string): boolean {
  if (!hasStackedTaxContext(prompt)) return false;
  if (isConfigureStackedTaxRulesPrompt(prompt)) return false;
  if (isServiceScopedTaxPrompt(prompt)) return false;

  if (
    /\b(?:preview|quote|estimate|before\s+creat|staff\s+booking)\b/i.test(
      prompt,
    ) &&
    /\b(?:tax|vat|gst|service|massage|consultation|haircut)\b/i.test(prompt)
  ) {
    return false;
  }

  if (
    /\b(booking page|service cards?|incl\.?|before i pay)\b/i.test(prompt) ||
    (/\bcheckout\b/i.test(prompt) &&
      !/\b(stacked|rules?|gst|pst|federal|state)\b/i.test(prompt))
  ) {
    return false;
  }

  const explainCue =
    /\b(?:what|which|explain|describe|show|how|list|combined|effective|breakdown|example)\b/i.test(
      prompt,
    ) ||
    /\b(?:plus|\+)\b/i.test(prompt) ||
    (containsArmenianScript(prompt) &&
      /(ինչ|բացատրիր|ցույց|համակցված|կուտակված)/i.test(prompt)) ||
    (containsCyrillicScript(prompt) &&
      /(какой|объясни|покажи|комбинирован|stacked|stack|плюс)/i.test(prompt));

  return explainCue;
}

export function ruleMatchesRemoveQuery(
  rule: Pick<TaxRule, 'name'>,
  query: string,
): boolean {
  const ruleName = rule.name.trim().toLowerCase();
  const normalizedQuery = query.trim().toLowerCase();
  if (!ruleName || !normalizedQuery) return false;
  return (
    ruleName.includes(normalizedQuery) || normalizedQuery.includes(ruleName)
  );
}

export function toTaxRuleId(name: string, index: number): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || `rule-${index + 1}`;
}

export function rescueStackedTaxIntent(
  prompt: string,
  action: string,
): { action: StackedTaxIntent; rescueReason: string } | null {
  if ((STACKED_TAX_INTENTS as readonly string[]).includes(action)) {
    return null;
  }

  if (
    isConfigureStackedTaxRulesPrompt(prompt) &&
    parseConfigureStackedTaxRulesFromPrompt(prompt)
  ) {
    return {
      action: 'configure_stacked_tax_rules',
      rescueReason: 'configure_stacked_tax_rules',
    };
  }

  if (isExplainStackedTaxPrompt(prompt)) {
    return {
      action: 'explain_stacked_tax',
      rescueReason: 'explain_stacked_tax',
    };
  }

  return null;
}
