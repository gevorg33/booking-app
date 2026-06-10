import { IonBadge, IonText } from '@ionic/react';
import { formatProviderMoney } from '../lib/business-currency';
import { formatDateDisplay, formatTimeRangeDisplay } from '../lib/date-format';
import { formatStatusLabel } from '../lib/booking-types';
import { useBusinessCurrency } from '../lib/use-business-currency';
import type { ProviderBookingCheckoutContext } from '../lib/provider-booking-checkout-context.types';
import { useI18n } from '../i18n';

interface BookingCheckoutContextBadgesProps {
  context: ProviderBookingCheckoutContext;
}

export default function BookingCheckoutContextBadges({
  context,
}: BookingCheckoutContextBadgesProps) {
  const { t } = useI18n();
  const { currency: businessCurrency } = useBusinessCurrency();

  const hasContent =
    context.package || context.subscription || context.multiService;
  if (!hasContent) return null;

  const money = (amount: number, currency: string) =>
    formatProviderMoney(amount, currency, businessCurrency);

  return (
    <div className="ion-margin-bottom booking-checkout-context">
      <div className="booking-checkout-context__badges">
        {context.package && (
          <IonBadge color="tertiary" className="booking-checkout-context__badge">
            {t('provider.checkoutContextPackageBadge', {
              name: context.package.packageName,
              index: context.package.serviceIndex,
              total: context.package.serviceTotal,
              remaining: context.package.visitsRemaining,
            })}
          </IonBadge>
        )}
        {context.subscription && (
          <IonBadge
            color={context.subscription.isActive ? 'success' : 'medium'}
            className="booking-checkout-context__badge"
          >
            {t('provider.checkoutContextSubscriptionBadge', {
              name: context.subscription.planName,
              remaining: context.subscription.appointmentsRemaining,
              total: context.subscription.appointmentsIncluded,
            })}
          </IonBadge>
        )}
        {context.multiService && (
          <IonBadge color="secondary" className="booking-checkout-context__badge">
            {t('provider.checkoutContextMultiServiceBadge', {
              count: context.multiService.serviceCount,
              duration: context.multiService.totalDurationMinutes,
            })}
          </IonBadge>
        )}
      </div>

      {context.multiService && context.multiService.lines.length > 0 && (
        <div className="booking-checkout-context__multi">
          <IonText color="medium">
            <p className="booking-meta">
              {context.multiService.schedulingMode === 'same_visit'
                ? t('provider.checkoutContextMultiSameVisit')
                : t('provider.checkoutContextMultiPerService')}
              {' · '}
              {money(context.multiService.totalPrice, context.multiService.currency)}
            </p>
          </IonText>
          <ul className="booking-checkout-context__lines">
            {context.multiService.lines.map((line) => (
              <li
                key={line.bookingId}
                className={
                  line.isCurrent
                    ? 'booking-checkout-context__line booking-checkout-context__line--current'
                    : 'booking-checkout-context__line'
                }
              >
                <span className="booking-checkout-context__line-title">
                  {line.serviceName}
                  {line.isCurrent ? ` (${t('provider.checkoutContextCurrentService')})` : ''}
                </span>
                <span className="booking-checkout-context__line-meta">
                  {formatDateDisplay(line.startTime)} ·{' '}
                  {formatTimeRangeDisplay(line.startTime, line.endTime)} ·{' '}
                  {line.employeeName} · {formatStatusLabel(line.status, t)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
