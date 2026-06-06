'use client';

import { formatTaxLineLabel, resolveCheckoutTaxDisplayLines } from '@/lib/business-tax';
import { formatServicePrice } from '@/lib/booking-types';

export interface StaffBookingQuote {
  subtotal: number;
  amountDue: number;
  taxEnabled?: boolean;
  taxName?: string | null;
  taxRate?: number | null;
  taxModel?: 'inclusive' | 'exclusive' | null;
  taxAmount?: number;
  taxRules?: Array<{ id: string; name: string; rate: number; amount: number }>;
  currency: string;
}

export function StaffBookingTaxPreview({
  quote,
  labels,
}: {
  quote: StaffBookingQuote;
  labels: {
    subtotal: string;
    totalDue: string;
    taxIncluded: string;
  };
}) {
  const taxLines = resolveCheckoutTaxDisplayLines(quote);
  const currency = quote.currency;

  return (
    <div className="rounded-lg border border-gray-700/80 bg-gray-800/40 p-3 space-y-1.5 text-sm">
      <div className="flex justify-between gap-3 text-gray-400">
        <span>{labels.subtotal}</span>
        <span>{formatServicePrice(quote.subtotal, currency)}</span>
      </div>
      {taxLines.map((line) => (
        <div key={line.id} className="flex justify-between gap-3 text-gray-400">
          <span>
            {formatTaxLineLabel(line.name, line.rate)}
            {quote.taxModel === 'inclusive' ? ` (${labels.taxIncluded})` : ''}
          </span>
          <span>
            {quote.taxModel === 'exclusive' ? '+' : ''}
            {formatServicePrice(line.amount, currency)}
          </span>
        </div>
      ))}
      <div className="flex justify-between gap-3 pt-1 border-t border-gray-700/80 font-medium text-gray-200">
        <span>{labels.totalDue}</span>
        <span>{formatServicePrice(quote.amountDue, currency)}</span>
      </div>
    </div>
  );
}
