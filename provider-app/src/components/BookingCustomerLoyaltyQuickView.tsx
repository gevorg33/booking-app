import { IonText } from '@ionic/react';
import { formatDateDisplay } from '../lib/date-format';
import { formatProviderMoney } from '../lib/business-currency';
import { useBusinessCurrency } from '../lib/use-business-currency';
import type { ProviderBookingCustomerLoyaltyQuickView } from '../lib/provider-booking-customer-context.types';
import { useI18n } from '../i18n';

interface BookingCustomerLoyaltyQuickViewProps {
  loyalty: ProviderBookingCustomerLoyaltyQuickView;
}

export default function BookingCustomerLoyaltyQuickView({
  loyalty,
}: BookingCustomerLoyaltyQuickViewProps) {
  const { t } = useI18n();
  const { currency: businessCurrency } = useBusinessCurrency();
  const balanceValue = formatProviderMoney(
    loyalty.pointsValue,
    null,
    businessCurrency,
  );

  return (
    <div className="customer-loyalty-quick-view">
      <div className="payment-breakdown__row">
        <dt>{t('provider.loyaltyQuickViewBalance')}</dt>
        <dd>
          {t('provider.customerContextLoyaltyValue', {
            points: loyalty.pointsBalance,
            value: balanceValue,
          })}
        </dd>
      </div>
      <div className="payment-breakdown__row">
        <dt>{t('provider.loyaltyQuickViewLifetimeEarned')}</dt>
        <dd>{loyalty.lifetimeEarned}</dd>
      </div>
      {loyalty.lastEarn && (
        <div className="payment-breakdown__row">
          <dt>{t('provider.loyaltyQuickViewLastEarn')}</dt>
          <dd>
            {t('provider.loyaltyQuickViewActivityLine', {
              points: loyalty.lastEarn.points,
              date: formatDateDisplay(loyalty.lastEarn.occurredAt),
            })}
          </dd>
        </div>
      )}
      {loyalty.lastRedeem && (
        <div className="payment-breakdown__row">
          <dt>{t('provider.loyaltyQuickViewLastRedeem')}</dt>
          <dd>
            {t('provider.loyaltyQuickViewRedeemActivityLine', {
              points: loyalty.lastRedeem.points,
              date: formatDateDisplay(loyalty.lastRedeem.occurredAt),
            })}
          </dd>
        </div>
      )}
      {!loyalty.lastEarn && !loyalty.lastRedeem && (
        <IonText color="medium">
          <p className="booking-meta">{t('provider.loyaltyQuickViewNoActivity')}</p>
        </IonText>
      )}
      {!loyalty.staffCanAdjust && (
        <IonText color="medium">
          <p className="booking-meta customer-loyalty-quick-view__read-only">
            {t('provider.loyaltyQuickViewReadOnly')}
          </p>
        </IonText>
      )}
    </div>
  );
}
