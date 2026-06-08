import { IonButton, IonInput, IonItem, IonLabel, IonSpinner } from '@ionic/react';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import type { PublicCheckoutQuote } from '../lib/types.js';
import type { PublicLoyaltySummary } from '../lib/consumer-rewards-display.util.js';
import { formatCopy } from '../lib/copy.js';
import { formatPublicMoney } from '../lib/business-currency.js';
import { isCheckoutPromoApplied, resolveMaxLoyaltyRedemption } from '../lib/checkout-discounts.util.js';

export function ConsumerCheckoutDiscounts({
  copy,
  currency,
  tenantCurrency,
  authed,
  loyalty,
  quote,
  quoteLoading,
  promoCode,
  appliedPromo,
  promoError,
  quoteError,
  loyaltyPoints,
  fallbackSubtotal,
  onPromoCodeChange,
  onApplyPromo,
  onClearPromo,
  onLoyaltyPointsChange,
  onUseMaxLoyalty,
}: {
  copy: ConsumerCopy;
  currency: string;
  tenantCurrency: string;
  authed: boolean;
  loyalty: PublicLoyaltySummary | null | undefined;
  quote: PublicCheckoutQuote | null | undefined;
  quoteLoading?: boolean;
  promoCode: string;
  appliedPromo: string;
  promoError: string | null;
  quoteError: string | null;
  loyaltyPoints: number;
  fallbackSubtotal: number;
  onPromoCodeChange: (value: string) => void;
  onApplyPromo: () => void;
  onClearPromo: () => void;
  onLoyaltyPointsChange: (value: number) => void;
  onUseMaxLoyalty: () => void;
}) {
  const formatMoney = (amount: number) =>
    formatPublicMoney(amount, currency, tenantCurrency);
  const promoApplied = isCheckoutPromoApplied(appliedPromo, quote);
  const maxLoyalty = resolveMaxLoyaltyRedemption({ loyalty, quote, fallbackSubtotal });
  const showLoyalty = authed && (loyalty?.pointsBalance ?? 0) > 0;

  return (
    <section style={{ marginTop: 16, marginBottom: 8 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{copy.checkoutPromoCode}</h3>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <IonInput
          value={promoCode}
          placeholder={copy.checkoutPromoPlaceholder}
          style={{
            flex: 1,
            '--background': '#f9fafb',
            textTransform: 'uppercase',
          }}
          onIonInput={(e) => onPromoCodeChange((e.detail.value ?? '').toUpperCase())}
        />
        <IonButton fill="outline" onClick={onApplyPromo} disabled={quoteLoading}>
          {copy.checkoutApplyPromo}
        </IonButton>
      </div>

      {promoApplied ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 8,
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: '#15803d' }}>
            {formatCopy(copy.checkoutPromoApplied, {
              code: quote?.giftCardCode ?? quote?.promoCode ?? appliedPromo,
            })}
          </p>
          <IonButton fill="clear" size="small" onClick={onClearPromo}>
            {copy.checkoutRemovePromo}
          </IonButton>
        </div>
      ) : null}

      {(promoError || quoteError) && !promoApplied ? (
        <p style={{ color: '#b91c1c', fontSize: 12, marginTop: 8 }}>{promoError ?? quoteError}</p>
      ) : null}

      {showLoyalty ? (
        <div style={{ marginTop: 16 }}>
          <IonLabel>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>{copy.checkoutLoyaltyPoints}</p>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
              {formatCopy(copy.checkoutLoyaltyBalance, {
                points: (loyalty?.pointsBalance ?? 0).toFixed(2),
                value: formatMoney(loyalty?.pointsValue ?? 0),
              })}
              {maxLoyalty > 0
                ? ` · ${formatCopy(copy.checkoutLoyaltyMaxHint, { max: maxLoyalty.toFixed(2) })}`
                : ''}
            </p>
          </IonLabel>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <IonInput
              type="number"
              inputMode="decimal"
              value={loyaltyPoints > 0 ? String(loyaltyPoints) : ''}
              style={{ flex: 1, '--background': '#f9fafb' }}
              onIonInput={(e) =>
                onLoyaltyPointsChange(Math.max(0, parseFloat(e.detail.value ?? '') || 0))
              }
            />
            <IonButton fill="outline" onClick={onUseMaxLoyalty} disabled={maxLoyalty <= 0}>
              {copy.checkoutUseMaxPoints}
            </IonButton>
          </div>
        </div>
      ) : null}

      {quoteLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <IonSpinner name="dots" style={{ width: 16, height: 16 }} />
          <span style={{ fontSize: 12, color: '#6b7280' }}>{copy.assistantThinking}</span>
        </div>
      ) : null}
    </section>
  );
}
