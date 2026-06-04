import { IonText } from '@ionic/react';
import {
  type BookingPaymentSummary,
  formatBookingMoney,
} from '../lib/booking-payment-summary';
import { useI18n } from '../i18n';

interface BookingPaymentBreakdownProps {
  summary: BookingPaymentSummary;
}

export default function BookingPaymentBreakdown({ summary }: BookingPaymentBreakdownProps) {
  const { t } = useI18n();
  const { currency } = summary;

  return (
    <div className="ion-margin-bottom payment-breakdown">
      <h3>{t('appointments.paymentBreakdown')}</h3>
      <dl className="payment-breakdown__list">
        {summary.servicePrice != null && (
          <div className="payment-breakdown__row">
            <dt>{t('appointments.paymentServicePrice')}</dt>
            <dd>{formatBookingMoney(summary.servicePrice, currency)}</dd>
          </div>
        )}
        {summary.subtotal != null && summary.subtotal !== summary.servicePrice && (
          <div className="payment-breakdown__row">
            <dt>{t('appointments.paymentChargedAmount')}</dt>
            <dd>{formatBookingMoney(summary.subtotal, currency)}</dd>
          </div>
        )}
        {summary.adjustments.map((item, index) => (
          <div
            key={`${item.type}-${index}`}
            className="payment-breakdown__row payment-breakdown__row--discount"
          >
            <dt>
              {item.type === 'promo'
                ? t('provider.paymentBreakdownPromo')
                : item.type === 'gift_card'
                  ? t('provider.paymentBreakdownGiftCard')
                  : t('provider.paymentBreakdownLoyalty')}
              {item.code ? ` (${item.code})` : ''}
            </dt>
            <dd>−{formatBookingMoney(item.amount, currency)}</dd>
          </div>
        ))}
        {summary.loyaltyPointsRedeemed > 0 && (
          <IonText color="medium">
            <p className="booking-meta">
              {t('appointments.paymentLoyaltyPoints', {
                points: summary.loyaltyPointsRedeemed.toFixed(2),
              })}
            </p>
          </IonText>
        )}
        <div className="payment-breakdown__row payment-breakdown__row--total">
          <dt>
            {summary.cashPaid <= 0 && summary.hasDiscounts
              ? t('appointments.paymentFullyCovered')
              : t('appointments.paymentCashPaid')}
          </dt>
          <dd>{formatBookingMoney(summary.cashPaid, currency)}</dd>
        </div>
      </dl>
    </div>
  );
}
