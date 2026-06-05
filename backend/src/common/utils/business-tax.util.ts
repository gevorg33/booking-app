import { roundBonus } from '../../modules/loyalty/loyalty.constants.js';

function roundMoney(value: number): number {
  return roundBonus(value);
}

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
  /** v2 — when present with valid rates, rules stack on the same taxable base. */
  rules?: TaxRule[];
}

export const DEFAULT_BUSINESS_TAX_SETTINGS: BusinessTaxSettings = {
  enabled: false,
  name: DEFAULT_TAX_NAME,
  rate: 0,
  model: 'exclusive',
  taxNumber: '',
};

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

export interface TaxBreakdown {
  netAmount: number;
  taxAmount: number;
  grossAmount: number;
  taxRate: number;
  taxModel: TaxPricingModel;
  taxName: string;
  rules?: TaxRuleBreakdown[];
}

export interface TaxCheckoutOverlay {
  taxEnabled: boolean;
  taxName: string;
  taxRate: number;
  taxModel: TaxPricingModel;
  taxAmount: number;
  netAmount: number;
  paymentAmount: number;
  taxRules?: TaxRuleBreakdown[];
}

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
  return roundMoney(parsed);
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
  let name = DEFAULT_TAX_NAME;
  if (typeof raw.name === 'string' && raw.name.trim()) {
    name = raw.name.trim().slice(0, 40);
  }
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

export function sumTaxRuleRates(
  rules: readonly Pick<TaxRule, 'rate'>[],
): number {
  return roundMoney(
    rules.reduce((sum, rule) => sum + Math.max(0, rule.rate), 0),
  );
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
  settings?: Record<string, unknown>,
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

export function toPublicBusinessTaxSettings(
  settings: BusinessTaxSettings,
): PublicBusinessTaxSettings | undefined {
  if (!businessTaxIsActive(settings)) return undefined;
  const effectiveRate = getEffectiveTaxRate(settings);
  const stackedRules = settings.rules ?? [];
  const aggregateName =
    stackedRules.length > 0
      ? formatAggregateTaxName(stackedRules, settings.name)
      : settings.name;
  return {
    enabled: true,
    name: aggregateName,
    rate: effectiveRate,
    model: settings.model,
    ...(stackedRules.length > 0
      ? {
          rules: stackedRules.map(({ name, rate }) => ({ name, rate })),
        }
      : {}),
  };
}

export function assertBusinessTaxSettings(
  input: Partial<BusinessTaxSettings>,
): BusinessTaxSettings {
  const enabled = input.enabled === true;
  const name =
    typeof input.name === 'string' && input.name.trim()
      ? input.name.trim().slice(0, 40)
      : DEFAULT_TAX_NAME;
  const rate = normalizeTaxRatePercent(input.rate) ?? 0;
  const model = normalizeTaxPricingModel(input.model) ?? 'exclusive';
  const taxNumber =
    typeof input.taxNumber === 'string'
      ? input.taxNumber.trim().slice(0, 64)
      : '';
  const rules = normalizeTaxRules(input.rules);
  const effectiveRate = getEffectiveTaxRate({ rate, rules });
  if (enabled && effectiveRate <= 0) {
    throw new Error('Tax rate must be greater than 0 when tax is enabled');
  }
  const normalizedRate = rules.length > 0 ? effectiveRate : rate;
  return {
    enabled,
    name,
    rate: normalizedRate,
    model,
    taxNumber,
    ...(rules.length > 0 ? { rules } : {}),
  };
}

export function mergeBusinessTaxSettings(
  settings: Record<string, unknown>,
  tax: BusinessTaxSettings,
): Record<string, unknown> {
  return { ...settings, tax };
}

export function readServiceTaxRatePercent(
  metadata?: Record<string, unknown> | null,
): number | null {
  if (!metadata || typeof metadata !== 'object') return null;
  return normalizeTaxRatePercent(metadata.taxRatePercent);
}

export function applyServiceTaxRateToMetadata(
  metadata: Record<string, unknown>,
  taxRatePercent?: number | null,
): Record<string, unknown> {
  if (taxRatePercent === undefined) return metadata;
  const next = { ...metadata };
  if (taxRatePercent === null) {
    delete next.taxRatePercent;
    return next;
  }
  const normalized = normalizeTaxRatePercent(taxRatePercent);
  if (normalized == null) {
    delete next.taxRatePercent;
    return next;
  }
  next.taxRatePercent = normalized;
  return next;
}

export function resolveEffectiveTaxRate(
  businessRate: number,
  serviceRatePercent?: number | null,
): number {
  const override = normalizeTaxRatePercent(serviceRatePercent);
  if (override != null) return override;
  return Math.max(0, businessRate);
}

export function resolveCheckoutTaxRules(
  tax: BusinessTaxSettings,
  serviceRatePercent?: number | null,
): TaxRule[] {
  const override = normalizeTaxRatePercent(serviceRatePercent);
  if (override != null) {
    if (override <= 0) return [];
    return [
      {
        id: 'service-override',
        name: formatAggregateTaxName([{ name: tax.name }], DEFAULT_TAX_NAME),
        rate: override,
      },
    ];
  }
  const stacked = tax.rules ?? [];
  if (stacked.length > 0) return stacked;
  if (tax.rate <= 0) return [];
  return [
    {
      id: 'default',
      name: formatAggregateTaxName([{ name: tax.name }], DEFAULT_TAX_NAME),
      rate: tax.rate,
    },
  ];
}

function allocateInclusiveRuleAmounts(
  rules: TaxRule[],
  totalTax: number,
): TaxRuleBreakdown[] {
  const effectiveRate = sumTaxRuleRates(rules);
  if (effectiveRate <= 0 || totalTax <= 0) {
    return rules.map((rule) => ({ ...rule, amount: 0 }));
  }
  const breakdowns = rules.map((rule) => ({
    ...rule,
    amount: roundMoney((totalTax * rule.rate) / effectiveRate),
  }));
  const allocated = roundMoney(
    breakdowns.reduce((sum, rule) => sum + rule.amount, 0),
  );
  const delta = roundMoney(totalTax - allocated);
  if (delta !== 0 && breakdowns.length > 0) {
    const last = breakdowns[breakdowns.length - 1];
    last.amount = roundMoney(last.amount + delta);
  }
  return breakdowns;
}

/** Split a taxable amount into net, tax, and gross components. */
export function calculateTaxBreakdown(
  taxableAmount: number,
  ratePercent: number,
  model: TaxPricingModel,
  taxName = DEFAULT_TAX_NAME,
): TaxBreakdown {
  const amount = roundMoney(Math.max(0, taxableAmount));
  const rate = Math.max(0, Math.min(100, ratePercent));
  if (rate <= 0 || amount <= 0) {
    return {
      netAmount: amount,
      taxAmount: 0,
      grossAmount: amount,
      taxRate: rate,
      taxModel: model,
      taxName,
    };
  }
  if (model === 'exclusive') {
    const taxAmount = roundMoney((amount * rate) / 100);
    return {
      netAmount: amount,
      taxAmount,
      grossAmount: roundMoney(amount + taxAmount),
      taxRate: rate,
      taxModel: model,
      taxName,
    };
  }
  const taxAmount = roundMoney((amount * rate) / (100 + rate));
  const netAmount = roundMoney(amount - taxAmount);
  return {
    netAmount,
    taxAmount,
    grossAmount: amount,
    taxRate: rate,
    taxModel: model,
    taxName,
  };
}

/** Stack multiple tax rules on the same taxable base (parallel stacking). */
export function calculateStackedTaxBreakdown(
  taxableAmount: number,
  rules: TaxRule[],
  model: TaxPricingModel,
  aggregateName?: string,
): TaxBreakdown {
  const amount = roundMoney(Math.max(0, taxableAmount));
  const activeRules = rules.filter((rule) => rule.rate > 0);
  const effectiveRate = sumTaxRuleRates(activeRules);
  const taxName =
    aggregateName?.trim() ||
    formatAggregateTaxName(activeRules, DEFAULT_TAX_NAME);

  if (effectiveRate <= 0 || amount <= 0 || activeRules.length === 0) {
    return {
      netAmount: amount,
      taxAmount: 0,
      grossAmount: amount,
      taxRate: effectiveRate,
      taxModel: model,
      taxName,
      rules: activeRules.map((rule) => ({ ...rule, amount: 0 })),
    };
  }

  if (model === 'exclusive') {
    const ruleBreakdowns = activeRules.map((rule) => ({
      ...rule,
      amount: roundMoney((amount * rule.rate) / 100),
    }));
    const taxAmount = roundMoney(
      ruleBreakdowns.reduce((sum, rule) => sum + rule.amount, 0),
    );
    return {
      netAmount: amount,
      taxAmount,
      grossAmount: roundMoney(amount + taxAmount),
      taxRate: effectiveRate,
      taxModel: model,
      taxName,
      rules: ruleBreakdowns,
    };
  }

  const combined = calculateTaxBreakdown(
    amount,
    effectiveRate,
    'inclusive',
    taxName,
  );
  const ruleBreakdowns = allocateInclusiveRuleAmounts(
    activeRules,
    combined.taxAmount,
  );
  return {
    netAmount: combined.netAmount,
    taxAmount: combined.taxAmount,
    grossAmount: combined.grossAmount,
    taxRate: effectiveRate,
    taxModel: model,
    taxName,
    rules: ruleBreakdowns,
  };
}

/** Apply business tax rules to a post-discount checkout amount. */
export function applyTaxToCheckoutAmount(
  discountedAmount: number,
  tax: BusinessTaxSettings,
  serviceRatePercent?: number | null,
): TaxCheckoutOverlay | null {
  if (!tax.enabled) return null;
  const rules = resolveCheckoutTaxRules(tax, serviceRatePercent);
  if (rules.length === 0) return null;

  const breakdown =
    rules.length > 1
      ? calculateStackedTaxBreakdown(
          discountedAmount,
          rules,
          tax.model,
          formatAggregateTaxName(rules, tax.name),
        )
      : calculateTaxBreakdown(
          discountedAmount,
          rules[0].rate,
          tax.model,
          rules[0].name,
        );

  return {
    taxEnabled: true,
    taxName: breakdown.taxName,
    taxRate: breakdown.taxRate,
    taxModel: breakdown.taxModel,
    taxAmount: breakdown.taxAmount,
    netAmount: breakdown.netAmount,
    paymentAmount: breakdown.grossAmount,
    ...(breakdown.rules && breakdown.rules.length > 1
      ? { taxRules: breakdown.rules }
      : {}),
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
