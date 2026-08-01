import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import type { PublicCheckoutQuote } from '../lib/types.js';
import { formatPublicMoney } from '../lib/business-currency.js';
import { formatCopy } from '../lib/copy.js';
import {
  formatTaxLineLabel,
  resolveCheckoutTaxDisplayLines,
} from '../lib/business-tax.js';

/**
 * `servicePrice` is the full price; `subtotal` is actually the pre-discount
 * online-charge base (prepaymentDue) — the gap between them, independent of
 * any promo/gift-card/loyalty discount, is what's left to pay at the visit.
 */
export function resolveCheckoutDepositRemainder(quote: PublicCheckoutQuote): number {
  return Math.max(0, quote.servicePrice - quote.subtotal);
}

export function ConsumerCheckoutQuoteSummary({
  quote,
  tenantCurrency,
  copy,
}: {
  quote: PublicCheckoutQuote;
  tenantCurrency: string;
  copy: ConsumerCopy;
}) {
  const currency = quote.currency || tenantCurrency;
  const formatMoney = (amount: number) => formatPublicMoney(amount, currency, tenantCurrency);
  const taxLines = resolveCheckoutTaxDisplayLines(quote);
  const amountDue = quote.amountDue ?? quote.subtotal ?? 0;
  const subtotal = quote.servicePrice ?? quote.subtotal ?? amountDue;

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
        <span>{copy.checkoutSubtotal}</span>
        <span>{formatMoney(subtotal)}</span>
      </div>

      {(quote.promoDiscount ?? 0) > 0 ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 6 }}>
          <span>{copy.checkoutPromoDiscount}</span>
          <span>-{formatMoney(quote.promoDiscount!)}</span>
        </div>
      ) : null}

      {(quote.giftCardDiscount ?? 0) > 0 ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 6 }}>
          <span>{copy.checkoutGiftCardDiscount}</span>
          <span>-{formatMoney(quote.giftCardDiscount!)}</span>
        </div>
      ) : null}

      {(quote.loyaltyDiscount ?? 0) > 0 ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 6 }}>
          <span>{copy.checkoutLoyaltyDiscount}</span>
          <span>-{formatMoney(quote.loyaltyDiscount!)}</span>
        </div>
      ) : null}

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
            {quote.taxModel === 'inclusive' ? ` (${copy.taxIncluded})` : ''}
          </span>
          <span>
            {quote.taxModel === 'exclusive' ? '+' : ''}
            {formatMoney(line.amount)}
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
        <span>{amountDue <= 0 && (quote.totalDiscount ?? 0) > 0 ? copy.checkoutFreeAfterDiscounts : copy.checkoutTotalDue}</span>
        <span>{formatMoney(amountDue)}</span>
      </div>

      {amountDue > 0 && resolveCheckoutDepositRemainder(quote) > 0.005 ? (
        <p style={{ marginTop: 8, marginBottom: 0, color: '#6b7280' }}>
          {formatCopy(copy.checkoutDepositNotice, {
            amount: formatMoney(resolveCheckoutDepositRemainder(quote)),
          })}
        </p>
      ) : null}
    </div>
  );
}
