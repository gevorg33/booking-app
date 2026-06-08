import { IonItem, IonLabel, IonRadio, IonRadioGroup } from '@ionic/react';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import type { PublicCustomerSubscription, PublicSubscriptionPlan } from '../lib/types.js';
import { formatPublicMoney } from '../lib/business-currency.js';
import { formatCopy } from '../lib/copy.js';
import { formatDateDisplay } from '../lib/date-format.js';
import type { CheckoutPurchaseType } from '../lib/checkout-subscription.util.js';

function optionStyle(selected: boolean, primary: string) {
  return {
    marginBottom: 8,
    borderRadius: 12,
    border: selected ? `2px solid ${primary}` : '1px solid #e5e7eb',
    background: selected ? '#f5f3ff' : '#fff',
    padding: '12px 14px',
  } as const;
}

export function ConsumerCheckoutSubscriptionOptions({
  copy,
  locale,
  primary,
  currency,
  tenantCurrency,
  activeSubscription,
  subscriptionPlans,
  purchaseType,
  selectedPlanId,
  usingSubscriptionCredit,
  onSelectOneTime,
  onSelectUseExisting,
  onSelectPlan,
}: {
  copy: ConsumerCopy;
  locale: string;
  primary: string;
  currency: string;
  tenantCurrency: string;
  activeSubscription: PublicCustomerSubscription | null | undefined;
  subscriptionPlans: PublicSubscriptionPlan[];
  purchaseType: CheckoutPurchaseType;
  selectedPlanId: string;
  usingSubscriptionCredit: boolean;
  onSelectOneTime: () => void;
  onSelectUseExisting: () => void;
  onSelectPlan: (planId: string) => void;
}) {
  const formatMoney = (amount: number) =>
    formatPublicMoney(amount, currency, tenantCurrency);

  const selectedPlan = subscriptionPlans.find((plan) => plan.id === selectedPlanId);
  const radioValue = usingSubscriptionCredit
    ? 'subscription-credit'
    : purchaseType === 'subscription' && selectedPlanId
      ? `plan-${selectedPlanId}`
      : 'one-time';

  return (
    <div className="ion-margin-top">
      <p style={{ fontWeight: 600, marginBottom: 8 }}>{copy.checkoutHowToBook}</p>

      <IonRadioGroup
        value={radioValue}
        onIonChange={(event) => {
          const value = String(event.detail.value ?? '');
          if (value === 'subscription-credit') {
            onSelectUseExisting();
            return;
          }
          if (value === 'one-time') {
            onSelectOneTime();
            return;
          }
          if (value.startsWith('plan-')) {
            onSelectPlan(value.slice('plan-'.length));
          }
        }}
      >
        {activeSubscription && activeSubscription.appointmentsRemaining > 0 ? (
          <IonItem lines="none" style={optionStyle(usingSubscriptionCredit, '#059669')}>
            <IonRadio slot="start" value="subscription-credit" />
            <IonLabel className="ion-text-wrap">
              <p style={{ fontWeight: 600 }}>{copy.checkoutUseSubscription}</p>
              <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                {activeSubscription.appointmentsRemaining} of{' '}
                {activeSubscription.appointmentsIncluded ?? activeSubscription.appointmentsRemaining}{' '}
                {copy.checkoutAppointmentsLeft} · {copy.checkoutExpiresOn}{' '}
                {formatDateDisplay(new Date(activeSubscription.expiresAt), locale)}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#047857', marginTop: 4 }}>
                {copy.checkoutFreeThisVisit}
              </p>
            </IonLabel>
          </IonItem>
        ) : null}

        <IonItem lines="none" style={optionStyle(purchaseType === 'one-time' && !usingSubscriptionCredit, primary)}>
          <IonRadio slot="start" value="one-time" />
          <IonLabel>
            <p style={{ fontWeight: 600 }}>{copy.checkoutOneTimeAppointment}</p>
          </IonLabel>
        </IonItem>

        {subscriptionPlans.length === 1 ? (
          <IonItem
            lines="none"
            style={optionStyle(
              purchaseType === 'subscription' && selectedPlanId === subscriptionPlans[0].id,
              primary,
            )}
          >
            <IonRadio slot="start" value={`plan-${subscriptionPlans[0].id}`} />
            <IonLabel className="ion-text-wrap">
              <p style={{ fontWeight: 600 }}>{copy.checkoutSubscribeAndSave}</p>
              <p style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: 4 }}>
                {subscriptionPlans[0].name} · {subscriptionPlans[0].includedAppointments}{' '}
                {copy.giftCardSubscriptionAppointments} / {subscriptionPlans[0].durationMonths}{' '}
                {copy.giftCardSubscriptionMonths} ·{' '}
                {formatMoney(subscriptionPlans[0].preview.pricing.subscriptionPrice)}
                {subscriptionPlans[0].preview.pricing.savings > 0 ? (
                  <span style={{ color: '#059669', marginLeft: 4 }}>
                    (
                    {formatCopy(copy.checkoutSaveAmount, {
                      amount: formatMoney(subscriptionPlans[0].preview.pricing.savings),
                    })}
                    )
                  </span>
                ) : null}
              </p>
            </IonLabel>
          </IonItem>
        ) : subscriptionPlans.length > 1 ? (
          <>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', margin: '8px 0' }}>
              {copy.checkoutChooseSubscriptionPlan}
            </p>
            {subscriptionPlans.map((plan) => (
              <IonItem
                key={plan.id}
                lines="none"
                style={optionStyle(purchaseType === 'subscription' && selectedPlanId === plan.id, primary)}
              >
                <IonRadio slot="start" value={`plan-${plan.id}`} />
                <IonLabel className="ion-text-wrap">
                  <p style={{ fontWeight: 600 }}>{plan.name}</p>
                  <p style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: 4 }}>
                    {plan.includedAppointments} {copy.giftCardSubscriptionAppointments} /{' '}
                    {plan.durationMonths} {copy.giftCardSubscriptionMonths} ·{' '}
                    {formatMoney(plan.preview.pricing.subscriptionPrice)}
                    {plan.preview.pricing.savings > 0 ? (
                      <span style={{ color: '#059669', marginLeft: 4 }}>
                        (
                        {formatCopy(copy.checkoutSaveAmount, {
                          amount: formatMoney(plan.preview.pricing.savings),
                        })}
                        )
                      </span>
                    ) : null}
                  </p>
                </IonLabel>
              </IonItem>
            ))}
          </>
        ) : null}
      </IonRadioGroup>

      {usingSubscriptionCredit ? (
        <p style={{ fontSize: '0.875rem', color: '#047857', marginTop: 4 }}>
          {formatCopy(copy.checkoutUsingSubscriptionHint, {
            remaining: String(
              Math.max(0, (activeSubscription?.appointmentsRemaining ?? 1) - 1),
            ),
          })}
        </p>
      ) : null}

      {purchaseType === 'subscription' && selectedPlan ? (
        <p style={{ fontSize: '0.875rem', color: '#047857', marginTop: 4 }}>
          {formatCopy(copy.checkoutPlanIncludesHint, {
            visits: String(selectedPlan.includedAppointments),
          })}
        </p>
      ) : null}
    </div>
  );
}
