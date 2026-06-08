import { IonButton } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import { formatPublicMoney } from '../lib/business-currency.js';
import { formatCopy } from '../lib/copy.js';
import { formatDateDisplay } from '../lib/date-format.js';
import { buildSalonPath } from '../lib/deep-link.js';
import { canBookWithRedeemedGift } from '../lib/gift-card-redeemed.util.js';
import type { PublicGiftCardRedeemed } from '../lib/gift-card.types.js';

export function ConsumerGiftCardsRedeemedSection({
  slug,
  copy,
  locale,
  tenantCurrency,
  redeemed,
}: {
  slug: string;
  copy: ConsumerCopy;
  locale: string;
  tenantCurrency: string;
  redeemed: PublicGiftCardRedeemed[];
}) {
  const history = useHistory();

  if (redeemed.length === 0) {
    return <p style={{ color: '#6b7280' }}>{copy.giftCardNoRedeemed}</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 14, color: '#6b7280' }}>{copy.giftCardRedeemedHint}</p>
      {redeemed.map((item) => (
        <article key={item.id} className="salon-card">
          <p style={{ fontWeight: 600, textTransform: 'capitalize' }}>{item.cardType}</p>
          <p style={{ fontSize: 12, fontFamily: 'monospace', color: '#6b7280' }}>{item.code}</p>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            {formatCopy(copy.giftCardClaimedOn, {
              date: formatDateDisplay(item.claimedAt, locale),
            })}
          </p>
          {item.cardType === 'package' ? (
            <p style={{ fontSize: 13, marginTop: 4 }}>{copy.giftCardRedeemedPackageHint}</p>
          ) : null}
          {item.cardType === 'subscription' ? (
            <p style={{ fontSize: 13, marginTop: 4 }}>{copy.giftCardRedeemedSubscriptionHint}</p>
          ) : null}
          {item.cardType === 'service' || item.cardType === 'bundle' ? (
            <p style={{ fontSize: 13, marginTop: 4 }}>{copy.giftCardRedeemedServiceHint}</p>
          ) : null}
          {item.serviceCredits.length > 0 ? (
            <ul style={{ fontSize: 13, marginTop: 8, paddingLeft: 16 }}>
              {item.serviceCredits.map((credit) => (
                <li key={credit.serviceId}>
                  {credit.serviceName} · {credit.quantityRemaining}/{credit.quantityTotal}{' '}
                  {copy.giftCardCreditsRemaining}
                </li>
              ))}
            </ul>
          ) : null}
          {item.purchaseAmount != null && item.purchaseAmount > 0 ? (
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              {formatPublicMoney(item.purchaseAmount, item.currency, tenantCurrency)}
            </p>
          ) : null}
          {canBookWithRedeemedGift(item) ? (
            <IonButton
              fill="clear"
              size="small"
              style={{ marginTop: 8 }}
              onClick={() => history.push(buildSalonPath(slug, '/services'))}
            >
              {copy.giftCardBookToUse}
            </IonButton>
          ) : null}
        </article>
      ))}
    </div>
  );
}
