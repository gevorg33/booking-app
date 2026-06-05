import {
  formatTaxLineLabel,
  resolveCheckoutTaxDisplayLines,
  type CheckoutTaxQuote,
} from '../lib/business-tax.js';
import { formatPublicMoney } from '../lib/business-currency.js';

export function CheckoutTaxSummary({
  quote,
  currency,
  tenantCurrency,
  labels,
}: {
  quote: CheckoutTaxQuote;
  currency?: string | null;
  tenantCurrency: string;
  labels: {
    subtotal: string;
    totalDue: string;
    taxIncluded: string;
  };
}) {
  const resolvedCurrency = currency || tenantCurrency;
  const taxLines = resolveCheckoutTaxDisplayLines(quote);
  const subtotal = quote.subtotal ?? quote.amountDue ?? 0;
  const amountDue = quote.amountDue ?? subtotal;

  return (
    <div
      style={{
        marginTop: 16,
        padding: 12,
        borderRadius: 12,
        background: '#f9fafb',
        textAlign: 'left',
        fontSize: '0.875rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: '#4b5563' }}>
        <span>{labels.subtotal}</span>
        <span>{formatPublicMoney(subtotal, resolvedCurrency, tenantCurrency)}</span>
      </div>
      {taxLines.map((line) => (
        <div
          key={line.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            color: '#4b5563',
            marginTop: 6,
          }}
        >
          <span>
            {formatTaxLineLabel(line.name, line.rate)}
            {quote.taxModel === 'inclusive' ? ` (${labels.taxIncluded})` : ''}
          </span>
          <span>
            {quote.taxModel === 'exclusive' ? '+' : ''}
            {formatPublicMoney(line.amount, resolvedCurrency, tenantCurrency)}
          </span>
        </div>
      ))}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          marginTop: 8,
          paddingTop: 8,
          borderTop: '1px solid #e5e7eb',
          fontWeight: 600,
          color: '#111827',
        }}
      >
        <span>{labels.totalDue}</span>
        <span>{formatPublicMoney(amountDue, resolvedCurrency, tenantCurrency)}</span>
      </div>
    </div>
  );
}
