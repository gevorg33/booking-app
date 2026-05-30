import { Tag, Gift, CreditCard } from 'lucide-react';
import {
  type BookingPaymentSummary,
  formatBookingMoney,
} from '@/lib/booking-payment-summary';

interface BookingPaymentBreakdownProps {
  summary: BookingPaymentSummary;
  labels: {
    title: string;
    servicePrice: string;
    chargedAmount: string;
    promoDiscount: string;
    loyaltyDiscount: string;
    cashPaid: string;
    fullyCovered: string;
    loyaltyPoints: string;
  };
}

function AdjustmentIcon({ type }: { type: 'promo' | 'gift_card' | 'loyalty' }) {
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
                    ? 'Gift card'
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
        <div className="flex justify-between gap-3 pt-1.5 border-t border-gray-700/80 font-medium">
          <dt className="text-gray-300">
            {summary.cashPaid <= 0 && summary.hasDiscounts ? labels.fullyCovered : labels.cashPaid}
          </dt>
          <dd className="text-gray-100">{formatBookingMoney(summary.cashPaid, currency)}</dd>
        </div>
      </dl>
    </div>
  );
}
