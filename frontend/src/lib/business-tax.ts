/** Business tax settings (mirrors backend business-tax.util). */
export const TAX_PRICING_MODELS = ['inclusive', 'exclusive'] as const;
export type TaxPricingModel = (typeof TAX_PRICING_MODELS)[number];

export const DEFAULT_TAX_NAME = 'VAT';

export interface TaxRule {
  id: string;
  name: string;
  rate: number;
}

export interface TaxRuleBreakdown {
  id: string;
  name: string;
  rate: number;
  amount: number;
}

export interface BusinessTaxSettings {
  enabled: boolean;
  name: string;
  rate: number;
  model: TaxPricingModel;
  taxNumber: string;
  rules?: TaxRule[];
}

export interface PublicTaxRule {
  name: string;
  rate: number;
}

export interface PublicBusinessTaxSettings {
  enabled: boolean;
  name: string;
  rate: number;
  model: TaxPricingModel;
  rules?: PublicTaxRule[];
}

export const DEFAULT_BUSINESS_TAX_SETTINGS: BusinessTaxSettings = {
  enabled: false,
  name: DEFAULT_TAX_NAME,
  rate: 0,
  model: 'exclusive',
  taxNumber: '',
};

const MODEL_SET = new Set<string>(TAX_PRICING_MODELS);

export function normalizeTaxPricingModel(
  value: string | null | undefined,
): TaxPricingModel | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  return MODEL_SET.has(trimmed) ? (trimmed as TaxPricingModel) : null;
}

export function normalizeTaxRatePercent(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) return null;
  return Math.round(parsed * 100) / 100;
}

function normalizeTaxRuleId(value: unknown, index: number): string {
  if (typeof value === 'string' && value.trim()) {
    return value.trim().slice(0, 40);
  }
  return `rule-${index + 1}`;
}

export function normalizeTaxRule(value: unknown, index = 0): TaxRule | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const rate = normalizeTaxRatePercent(raw.rate);
  if (rate == null || rate <= 0) return null;
  const name =
    typeof raw.name === 'string' && raw.name.trim()
      ? raw.name.trim().slice(0, 40)
      : DEFAULT_TAX_NAME;
  return {
    id: normalizeTaxRuleId(raw.id, index),
    name,
    rate,
  };
}

export function normalizeTaxRules(value: unknown): TaxRule[] {
  if (!Array.isArray(value)) return [];
  const rules: TaxRule[] = [];
  value.forEach((entry, index) => {
    const rule = normalizeTaxRule(entry, index);
    if (rule) rules.push(rule);
  });
  return rules;
}

export function sumTaxRuleRates(rules: readonly Pick<TaxRule, 'rate'>[]): number {
  return Math.round(
    rules.reduce((sum, rule) => sum + Math.max(0, rule.rate), 0) * 100,
  ) / 100;
}

export function formatAggregateTaxName(
  rules: readonly Pick<TaxRule, 'name'>[],
  fallback = DEFAULT_TAX_NAME,
): string {
  const names = rules
    .map((rule) => rule.name.trim())
    .filter((name) => name.length > 0);
  if (names.length === 0) return fallback;
  return names.join(' + ');
}

export function getEffectiveTaxRate(
  tax: Pick<BusinessTaxSettings, 'rate' | 'rules'>,
): number {
  const stacked = sumTaxRuleRates(tax.rules ?? []);
  if (stacked > 0) return stacked;
  return Math.max(0, tax.rate);
}

export function businessTaxIsActive(tax: BusinessTaxSettings): boolean {
  return tax.enabled && getEffectiveTaxRate(tax) > 0;
}

export function hasStackedTaxRules(
  tax: Pick<BusinessTaxSettings, 'rules'>,
): boolean {
  const rules = tax.rules;
  return Array.isArray(rules) && rules.length > 0;
}

export function readBusinessTaxSettings(
  settings?: Record<string, unknown> | null,
): BusinessTaxSettings {
  const raw = (settings?.tax as Record<string, unknown> | undefined) ?? {};
  const enabled = raw.enabled === true;
  const name =
    typeof raw.name === 'string' && raw.name.trim()
      ? raw.name.trim()
      : DEFAULT_TAX_NAME;
  const rate = normalizeTaxRatePercent(raw.rate) ?? 0;
  const model =
    normalizeTaxPricingModel(raw.model as string | undefined) ?? 'exclusive';
  const taxNumber =
    typeof raw.taxNumber === 'string' ? raw.taxNumber.trim() : '';
  const rules = normalizeTaxRules(raw.rules);
  return {
    enabled,
    name,
    rate,
    model,
    taxNumber,
    ...(rules.length > 0 ? { rules } : {}),
  };
}

export function formatInclusiveTaxBadge(
  tax: Pick<PublicBusinessTaxSettings, 'name' | 'rate' | 'rules'>,
): string {
  const label = formatAggregateTaxName(
    tax.rules ?? [{ name: tax.name?.trim() || DEFAULT_TAX_NAME }],
    tax.name?.trim() || DEFAULT_TAX_NAME,
  );
  const rate = getEffectiveTaxRate({
    rate: tax.rate,
    rules: tax.rules?.map((rule, index) => ({
      id: `badge-${index}`,
      name: rule.name,
      rate: rule.rate,
    })),
  });
  const rateLabel = Number.isInteger(rate) ? String(rate) : rate.toFixed(1);
  return `incl. ${rateLabel}% ${label}`;
}

export function shouldShowInclusiveTaxBadge(
  tax?: PublicBusinessTaxSettings | null,
): boolean {
  return Boolean(
    tax?.enabled &&
      tax.model === 'inclusive' &&
      getEffectiveTaxRate({
        rate: tax.rate,
        rules: tax.rules?.map((rule, index) => ({
          id: `badge-${index}`,
          name: rule.name,
          rate: rule.rate,
        })),
      }) > 0,
  );
}

export function formatTaxLineLabel(
  taxName: string,
  taxRate: number,
): string {
  const label = taxName.trim() || DEFAULT_TAX_NAME;
  const rate = Number.isInteger(taxRate) ? String(taxRate) : taxRate.toFixed(1);
  return `${label} (${rate}%)`;
}

export function createEmptyTaxRule(index: number): TaxRule {
  return {
    id: `rule-${index + 1}`,
    name: index === 0 ? 'Federal' : index === 1 ? 'State' : `Tax ${index + 1}`,
    rate: 0,
  };
}

export function resolveCheckoutTaxDisplayLines(quote: {
  taxEnabled?: boolean;
  taxAmount?: number;
  taxName?: string | null;
  taxRate?: number | null;
  taxRules?: TaxRuleBreakdown[];
}): TaxRuleBreakdown[] {
  const taxAmount = quote.taxAmount ?? 0;
  const stackedRules = quote.taxRules;
  if (!quote.taxEnabled || taxAmount <= 0) return [];
  if (stackedRules && stackedRules.length > 1) {
    return stackedRules;
  }
  return [
    {
      id: 'aggregate',
      name: quote.taxName?.trim() || DEFAULT_TAX_NAME,
      rate: quote.taxRate ?? 0,
      amount: taxAmount,
    },
  ];
}
