import { DEFAULT_TAX_NAME } from './business-tax.util.js';

export interface BookingReceiptTaxLine {
  id: string;
  name: string;
  rate: number;
  amount: number;
}

export interface BookingReceiptTaxSnapshot {
  taxEnabled: boolean;
  subtotal: number | null;
  taxAmount: number;
  grossAmount: number | null;
  netAmount: number | null;
  taxName: string | null;
  taxRate: number | null;
  taxModel: 'inclusive' | 'exclusive' | null;
  taxLines: BookingReceiptTaxLine[];
}

export interface BookingTaxRevenueTotals {
  grossRevenue: number;
  taxCollected: number;
  netRevenue: number;
}

export interface BookingAccountingTaxFields {
  subtotal: number;
  taxRate: number | null;
  taxAmount: number;
  taxName: string | null;
  total: number;
  amount: number;
}

export interface BookingReceiptTaxSource {
  service?: { price?: number | string | null } | null;
  metadata?: Record<string, unknown> | null;
}

function readPricing(
  metadata?: Record<string, unknown> | null,
): Record<string, unknown> | null {
  const safe = metadata ?? {};
  const pricing = safe.pricing;
  return pricing && typeof pricing === 'object'
    ? (pricing as Record<string, unknown>)
    : null;
}

function readNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function resolveTaxLinesFromPricing(
  pricing: Record<string, unknown>,
  taxAmount: number,
): BookingReceiptTaxLine[] {
  const rawRules = pricing.taxRules;
  if (Array.isArray(rawRules) && rawRules.length > 1) {
    const lines: BookingReceiptTaxLine[] = [];
    for (const [index, entry] of rawRules.entries()) {
      if (!entry || typeof entry !== 'object') continue;
      const row = entry as Record<string, unknown>;
      const amount = readNumber(row.amount);
      const rate = readNumber(row.rate);
      if (amount == null || amount <= 0) continue;
      lines.push({
        id:
          typeof row.id === 'string' && row.id.trim()
            ? row.id.trim()
            : `rule-${index + 1}`,
        name:
          typeof row.name === 'string' && row.name.trim()
            ? row.name.trim()
            : DEFAULT_TAX_NAME,
        rate: rate ?? 0,
        amount,
      });
    }
    if (lines.length > 0) return lines;
  }

  return [
    {
      id: 'aggregate',
      name:
        typeof pricing.taxName === 'string' && pricing.taxName.trim()
          ? pricing.taxName.trim()
          : DEFAULT_TAX_NAME,
      rate: readNumber(pricing.taxRate) ?? 0,
      amount: taxAmount,
    },
  ];
}

/** Tax breakdown stored on booking metadata for receipts and exports. */
export function readBookingReceiptTaxSnapshot(
  source: BookingReceiptTaxSource,
): BookingReceiptTaxSnapshot | null {
  const pricing = readPricing(source.metadata);
  if (!pricing) return null;

  const taxEnabled = pricing.taxEnabled === true;
  const taxAmount = readNumber(pricing.taxAmount) ?? 0;
  if (!taxEnabled || taxAmount <= 0) return null;

  return {
    taxEnabled: true,
    subtotal: readNumber(pricing.subtotal),
    taxAmount,
    grossAmount: readNumber(pricing.amountDue),
    netAmount: readNumber(pricing.netAmount),
    taxName: typeof pricing.taxName === 'string' ? pricing.taxName : null,
    taxRate: readNumber(pricing.taxRate),
    taxModel:
      pricing.taxModel === 'inclusive' || pricing.taxModel === 'exclusive'
        ? pricing.taxModel
        : null,
    taxLines: resolveTaxLinesFromPricing(pricing, taxAmount),
  };
}

export function resolveBookingPaidGrossAmount(
  source: BookingReceiptTaxSource,
): number {
  const pricing = readPricing(source.metadata);
  const gross =
    readNumber(pricing?.amountDue) ??
    readNumber(source.metadata?.amountPaid) ??
    readNumber(source.metadata?.prepaymentAmount);
  if (gross != null && gross >= 0) return gross;
  const servicePrice = readNumber(source.service?.price);
  return servicePrice != null && servicePrice >= 0 ? servicePrice : 0;
}

export function resolveBookingTaxCollected(
  source: BookingReceiptTaxSource,
): number {
  const pricing = readPricing(source.metadata);
  if (pricing?.taxEnabled !== true) return 0;
  return Math.max(0, readNumber(pricing.taxAmount) ?? 0);
}

export function resolveBookingNetRevenue(
  source: BookingReceiptTaxSource,
): number {
  const pricing = readPricing(source.metadata);
  const net = readNumber(pricing?.netAmount) ?? readNumber(pricing?.subtotal);
  if (net != null && net >= 0) return net;
  const gross = resolveBookingPaidGrossAmount(source);
  const tax = resolveBookingTaxCollected(source);
  return Math.max(0, Math.round((gross - tax) * 100) / 100);
}

export function sumBookingTaxRevenue(
  bookings: BookingReceiptTaxSource[],
): BookingTaxRevenueTotals {
  let grossRevenue = 0;
  let taxCollected = 0;
  let netRevenue = 0;
  for (const booking of bookings) {
    grossRevenue += resolveBookingPaidGrossAmount(booking);
    taxCollected += resolveBookingTaxCollected(booking);
    netRevenue += resolveBookingNetRevenue(booking);
  }
  return {
    grossRevenue: Math.round(grossRevenue * 100) / 100,
    taxCollected: Math.round(taxCollected * 100) / 100,
    netRevenue: Math.round(netRevenue * 100) / 100,
  };
}

export function resolveBookingAccountingTaxFields(
  source: BookingReceiptTaxSource,
): BookingAccountingTaxFields {
  const snapshot = readBookingReceiptTaxSnapshot(source);
  const servicePrice = readNumber(source.service?.price) ?? 0;
  const total = resolveBookingPaidGrossAmount(source);
  const taxAmount = snapshot?.taxAmount ?? 0;
  const subtotal =
    snapshot?.subtotal ??
    snapshot?.netAmount ??
    (taxAmount > 0
      ? Math.max(0, total - taxAmount)
      : total > 0
        ? total
        : servicePrice);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxRate: snapshot?.taxRate ?? null,
    taxAmount: Math.round(taxAmount * 100) / 100,
    taxName: snapshot?.taxName ?? null,
    total: Math.round(total * 100) / 100,
    amount: Math.round(total * 100) / 100,
  };
}
