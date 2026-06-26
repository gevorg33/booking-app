import { Tag, Gift, CreditCard, ShoppingBag } from 'lucide-react';
import {
  type BookingPaymentSummary,
  formatBookingMoney,
  resolveBookingTaxDisplayLines,
} from '@/lib/booking-payment-summary';
import { formatTaxLineLabel } from '@/lib/business-tax';

interface BookingPaymentBreakdownProps {
  summary: BookingPaymentSummary;
  labels: {
    title: string;
    servicePrice: string;
    chargedAmount: string;
    promoDiscount: string;
    giftCardDiscount: string;
    loyaltyDiscount: string;
    cashPaid: string;
    fullyCovered: string;
    loyaltyPoints: string;
    retailTotal: string;
    grandTotal: string;
    taxIncluded: string;
  };
}

function AdjustmentIcon({ type }: { type: 'promo' | 'gift_card' | 'loyalty' | 'retail' }) {
  if (type === 'retail') return <ShoppingBag className="w-3.5 h-3.5 shrink-0" />;
  if (type === 'promo') return <Tag className="w-3.5 h-3.5 shrink-0" />;
  return <Gift className="w-3.5 h-3.5 shrink-0" />;
}

export function BookingPaymentBreakdown({ summary, labels }: BookingPaymentBreakdownProps) {
  const { currency } = summary;

  return (
    <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/80">
      <p className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
        <CreditCard className="w-3.5 h-3.5" />
        {labels.title}
      </p>
      <dl className="space-y-1.5 text-sm">
        {summary.servicePrice != null && (
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">{labels.servicePrice}</dt>
            <dd className="text-gray-200">{formatBookingMoney(summary.servicePrice, currency)}</dd>
          </div>
        )}
        {summary.subtotal != null && summary.subtotal !== summary.servicePrice && (
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">{labels.chargedAmount}</dt>
            <dd className="text-gray-200">{formatBookingMoney(summary.subtotal, currency)}</dd>
          </div>
        )}
        {summary.adjustments.map((item, index) => (
          <div key={`${item.type}-${index}`} className="flex justify-between gap-3 text-green-400/90">
            <dt className="flex items-center gap-1.5 min-w-0">
              <AdjustmentIcon type={item.type} />
              <span className="truncate">
                {item.type === 'promo'
                  ? labels.promoDiscount
                  : item.type === 'gift_card'
                    ? labels.giftCardDiscount
                    : item.type === 'retail'
                      ? item.label
                      : labels.loyaltyDiscount}
                {item.code ? ` (${item.code})` : ''}
              </span>
            </dt>
            <dd className="shrink-0">−{formatBookingMoney(item.amount, currency)}</dd>
          </div>
        ))}
        {summary.loyaltyPointsRedeemed > 0 && (
          <p className="text-[11px] text-gray-500">
            {labels.loyaltyPoints.replace('{points}', summary.loyaltyPointsRedeemed.toFixed(2))}
          </p>
        )}
        {summary.retailTotal != null && summary.retailTotal > 0 && (
          <div className="flex justify-between gap-3 text-gray-300">
            <dt className="flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" />
              {labels.retailTotal}
            </dt>
            <dd>{formatBookingMoney(summary.retailTotal, currency)}</dd>
          </div>
        )}
        {resolveBookingTaxDisplayLines(summary).map((line) => (
          <div key={line.id} className="flex justify-between gap-3 text-gray-400">
            <dt>
              {formatTaxLineLabel(line.name, line.rate)}
              {summary.taxModel === 'inclusive' ? ` (${labels.taxIncluded})` : ''}
            </dt>
            <dd>
              {summary.taxModel === 'exclusive' ? '+' : ''}
              {formatBookingMoney(line.amount, currency)}
            </dd>
          </div>
        ))}
        <div className="flex justify-between gap-3 pt-1.5 border-t border-gray-700/80 font-medium">
          <dt className="text-gray-300">
            {summary.grandTotal != null && summary.grandTotal > (summary.cashPaid ?? 0)
              ? labels.grandTotal
              : summary.cashPaid <= 0 && summary.hasDiscounts
                ? labels.fullyCovered
                : labels.cashPaid}
          </dt>
          <dd className="text-gray-100">
            {formatBookingMoney(summary.grandTotal ?? summary.cashPaid, currency)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
