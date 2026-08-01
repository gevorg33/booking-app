import {
  IonBadge,
  IonIcon,
  IonSpinner,
} from '@ionic/react';
import { giftOutline, starOutline } from 'ionicons/icons';
import { useQuery } from '@tanstack/react-query';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import { formatPublicMoney } from '../lib/business-currency.js';
import { formatCopy } from '../lib/copy.js';
import type { PublicBusinessProfile } from '../lib/types.js';
import {
  fetchMyRewards,
  fetchPublicPromotions,
} from '../services/public-api.js';
import {
  normalizePublicCustomerRewardsPayload,
  normalizePublicPromotionsPayload,
  shouldShowConsumerRewardsSection,
  type PublicPromotion,
} from '../lib/consumer-rewards-display.util.js';
import { ConsumerActionButton } from './ConsumerActionButton.js';

export interface ConsumerRewardsCardProps {
  slug: string;
  profile: PublicBusinessProfile;
  copy: ConsumerCopy;
  authed: boolean;
  onBook?: () => void;
}

async function loadRewards(slug: string, authed: boolean) {
  if (authed) {
    const raw = await fetchMyRewards(slug);
    return normalizePublicCustomerRewardsPayload(raw);
  }
  const raw = await fetchPublicPromotions(slug);
  const promotions = normalizePublicPromotionsPayload(raw).promotions;
  return {
    loyaltyEnabled: false,
    loyalty: null,
    promotions,
  };
}

function PromoRow({
  promo,
  copy,
  formatMoney,
}: {
  promo: PublicPromotion;
  copy: ConsumerCopy;
  formatMoney: (amount: number) => string;
}) {
  const minOrder =
    promo.minOrderAmount != null && promo.minOrderAmount > 0
      ? formatCopy(copy.rewardsPromoMinimum, {
          amount: formatMoney(promo.minOrderAmount),
        })
      : null;

  return (
    <div
      className="salon-card"
      style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}
    >
      <IonIcon icon={giftOutline} color="tertiary" style={{ fontSize: 22, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <strong>{promo.discountLabel}</strong>
          <IonBadge color="light">{promo.code}</IonBadge>
        </div>
        {promo.description ? (
          <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
            {promo.description}
          </p>
        ) : null}
        {minOrder ? (
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.8125rem' }}>
            {minOrder}
          </p>
        ) : null}
        {promo.expiresAt ? (
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.8125rem' }}>
            {formatCopy(copy.rewardsPromoExpires, {
              date: new Date(promo.expiresAt).toLocaleDateString(),
            })}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function ConsumerRewardsCard({
  slug,
  profile,
  copy,
  authed,
  onBook,
}: ConsumerRewardsCardProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['consumer-rewards', slug, authed],
    queryFn: () => loadRewards(slug, authed),
  });

  const formatMoney = (amount: number) =>
    formatPublicMoney(amount, null, profile.currency);

  if (isLoading) {
    return (
      <div className="salon-card ion-text-center" style={{ marginBottom: 16 }}>
        <IonSpinner />
      </div>
    );
  }

  if (isError || !data) return null;

  if (
    !shouldShowConsumerRewardsSection({
      authed,
      loyaltyEnabled: data.loyaltyEnabled,
      loyalty: data.loyalty,
      promotions: data.promotions,
    })
  ) {
    return null;
  }

  const loyalty = data.loyalty;

  return (
    <section style={{ marginBottom: 16 }} aria-label={copy.rewardsSectionTitle}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 12 }}>
        {copy.rewardsSectionTitle}
      </h2>

      {authed && data.loyaltyEnabled && loyalty ? (
        <div className="salon-card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <IonIcon icon={starOutline} color="warning" style={{ fontSize: 22, marginTop: 2 }} />
            <div>
              <strong>{copy.rewardsLoyaltyBalanceTitle}</strong>
              <p style={{ margin: '6px 0 0', fontSize: '1.25rem', fontWeight: 700 }}>
                {formatCopy(copy.rewardsLoyaltyBalance, {
                  amount: formatMoney(loyalty.pointsValue),
                })}
              </p>
              {loyalty.earnPercentCashback > 0 ? (
                <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
                  {formatCopy(copy.rewardsLoyaltyEarnRate, {
                    percent: String(loyalty.earnPercentCashback),
                  })}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {data.promotions.length > 0 ? (
        <>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: 8 }}>
            {copy.rewardsPromosHint}
          </p>
          {data.promotions.map((promo) => (
            <PromoRow
              key={promo.code}
              promo={promo}
              copy={copy}
              formatMoney={formatMoney}
            />
          ))}
        </>
      ) : null}

      {onBook ? (
        <ConsumerActionButton
          expand="block"
          fill="outline"
          color={profile.branding.primaryColor || '#7c3aed'}
          onClick={onBook}
        >
          {copy.rewardsBookToRedeem}
        </ConsumerActionButton>
      ) : null}
    </section>
  );
}
