import { IonText } from '@ionic/react';
import {
  type BookingPaymentSummary,
  formatBookingMoney,
} from '../lib/booking-payment-summary';

interface BookingPaymentBreakdownProps {
  summary: BookingPaymentSummary;
}

export default function BookingPaymentBreakdown({ summary }: BookingPaymentBreakdownProps) {
  const { currency } = summary;

  return (
    <div className="ion-margin-bottom payment-breakdown">
      <h3>Payment breakdown</h3>
      <dl className="payment-breakdown__list">
        {summary.servicePrice != null && (
          <div className="payment-breakdown__row">
            <dt>Service price</dt>
            <dd>{formatBookingMoney(summary.servicePrice, currency)}</dd>
          </div>
        )}
        {summary.subtotal != null && summary.subtotal !== summary.servicePrice && (
          <div className="payment-breakdown__row">
            <dt>Charged at checkout</dt>
            <dd>{formatBookingMoney(summary.subtotal, currency)}</dd>
          </div>
        )}
        {summary.adjustments.map((item, index) => (
          <div key={`${item.type}-${index}`} className="payment-breakdown__row payment-breakdown__row--discount">
            <dt>
              {item.type === 'promo' ? 'Promo' : item.type === 'gift_card' ? 'Gift card' : 'Loyalty bonuses'}
              {item.code ? ` (${item.code})` : ''}
            </dt>
            <dd>−{formatBookingMoney(item.amount, currency)}</dd>
          </div>
        ))}
        {summary.loyaltyPointsRedeemed > 0 && (
          <IonText color="medium">
            <p className="booking-meta">
              {summary.loyaltyPointsRedeemed.toFixed(2)} bonuses redeemed
            </p>
          </IonText>
        )}
        <div className="payment-breakdown__row payment-breakdown__row--total">
          <dt>
            {summary.cashPaid <= 0 && summary.hasDiscounts
              ? 'Fully covered by discounts'
              : 'Paid in cash/card'}
          </dt>
          <dd>{formatBookingMoney(summary.cashPaid, currency)}</dd>
        </div>
      </dl>
    </div>
  );
}
