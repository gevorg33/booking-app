export const DEFAULT_TAX_NAME = 'VAT';

export interface TaxRuleBreakdown {
  id: string;
  name: string;
  rate: number;
  amount: number;
}

export interface PublicBusinessTaxSettings {
  enabled: boolean;
  name: string;
  rate: number;
  model: 'inclusive' | 'exclusive';
  rules?: Array<{ name: string; rate: number }>;
}

export interface CheckoutTaxQuote {
  taxEnabled?: boolean;
  taxAmount?: number;
  taxName?: string | null;
  taxRate?: number | null;
  taxModel?: 'inclusive' | 'exclusive' | null;
  taxRules?: TaxRuleBreakdown[];
  subtotal?: number;
  amountDue?: number;
}

export function formatTaxLineLabel(taxName: string, taxRate: number): string {
  const label = taxName.trim() || DEFAULT_TAX_NAME;
  const rate = Number.isInteger(taxRate) ? String(taxRate) : taxRate.toFixed(1);
  return `${label} (${rate}%)`;
}

export function shouldShowInclusiveTaxBadge(
  tax?: PublicBusinessTaxSettings | null,
): boolean {
  if (!tax?.enabled || tax.model !== 'inclusive') return false;
  const stacked = tax.rules?.reduce((sum, rule) => sum + Math.max(0, rule.rate), 0) ?? 0;
  return (stacked > 0 ? stacked : tax.rate) > 0;
}

export function formatInclusiveTaxBadge(
  tax: Pick<PublicBusinessTaxSettings, 'name' | 'rate' | 'rules'>,
): string {
  const names = (tax.rules?.length
    ? tax.rules.map((rule) => rule.name)
    : [tax.name]
  )
    .map((name) => name.trim())
    .filter(Boolean);
  const label = names.length > 0 ? names.join(' + ') : DEFAULT_TAX_NAME;
  const rate = tax.rules?.length
    ? Math.round(tax.rules.reduce((sum, rule) => sum + rule.rate, 0) * 100) / 100
    : tax.rate;
  const rateLabel = Number.isInteger(rate) ? String(rate) : rate.toFixed(1);
  return `incl. ${rateLabel}% ${label}`;
}

export function resolveCheckoutTaxDisplayLines(
  quote: CheckoutTaxQuote,
): TaxRuleBreakdown[] {
  const taxAmount = quote.taxAmount ?? 0;
  if (!quote.taxEnabled || taxAmount <= 0) return [];
  if (quote.taxRules && quote.taxRules.length > 1) {
    return quote.taxRules;
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
