import { IonText } from '@ionic/react';
import { useBusinessCurrency } from '../lib/use-business-currency';
import {
  type BookingPaymentSummary,
  formatBookingMoney,
  formatTaxLineLabel,
  resolveBookingTaxDisplayLines,
} from '../lib/booking-payment-summary';
import { useI18n } from '../i18n';

interface BookingPaymentBreakdownProps {
  summary: BookingPaymentSummary;
}

export default function BookingPaymentBreakdown({ summary }: BookingPaymentBreakdownProps) {
  const { t } = useI18n();
  const { currency: businessCurrency } = useBusinessCurrency();
  const money = (amount: number | null | undefined) =>
    formatBookingMoney(amount, summary.currency, businessCurrency);

  return (
    <div className="ion-margin-bottom payment-breakdown">
      <h3>{t('appointments.paymentBreakdown')}</h3>
      <dl className="payment-breakdown__list">
        {summary.servicePrice != null && (
          <div className="payment-breakdown__row">
            <dt>{t('appointments.paymentServicePrice')}</dt>
            <dd>{money(summary.servicePrice)}</dd>
          </div>
        )}
        {summary.subtotal != null && summary.subtotal !== summary.servicePrice && (
          <div className="payment-breakdown__row">
            <dt>{t('appointments.paymentChargedAmount')}</dt>
            <dd>{money(summary.subtotal)}</dd>
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
                  : item.type === 'retail'
                    ? item.label
                    : t('provider.paymentBreakdownLoyalty')}
              {item.code ? ` (${item.code})` : ''}
            </dt>
            <dd>−{money(item.amount)}</dd>
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
        {summary.retailTotal > 0 && (
          <div className="payment-breakdown__row">
            <dt>{t('retailPos.retailTotal')}</dt>
            <dd>{money(summary.retailTotal)}</dd>
          </div>
        )}
        {resolveBookingTaxDisplayLines(summary).map((line) => (
          <div key={line.id} className="payment-breakdown__row">
            <dt>
              {formatTaxLineLabel(line.name, line.rate)}
              {summary.taxModel === 'inclusive' ? ` (${t('provider.taxIncluded')})` : ''}
            </dt>
            <dd>
              {summary.taxModel === 'exclusive' ? '+' : ''}
              {money(line.amount)}
            </dd>
          </div>
        ))}
        <div className="payment-breakdown__row payment-breakdown__row--total">
          <dt>
            {summary.grandTotal > (summary.cashPaid ?? 0)
              ? t('retailPos.grandTotal')
              : summary.cashPaid <= 0 && summary.hasDiscounts
                ? t('appointments.paymentFullyCovered')
                : t('appointments.paymentCashPaid')}
          </dt>
          <dd>{money(summary.grandTotal ?? summary.cashPaid)}</dd>
        </div>
      </dl>
    </div>
  );
}
