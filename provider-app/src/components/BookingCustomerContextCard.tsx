import { IonBadge, IonText } from '@ionic/react';
import { formatDateDisplay } from '../lib/date-format';
import BookingCustomerLoyaltyQuickView from './BookingCustomerLoyaltyQuickView';
import type {
  ProviderBookingCustomerContext,
  ProviderCustomerSnapshotBadge,
} from '../lib/provider-booking-customer-context.types';
import { useI18n } from '../i18n';

interface BookingCustomerContextCardProps {
  context: ProviderBookingCustomerContext;
}

function formatMarketingOptIn(
  value: boolean | null,
  t: (key: string) => string,
): string {
  if (value === true) return t('provider.customerContextMarketingYes');
  if (value === false) return t('provider.customerContextMarketingNo');
  return t('provider.customerContextMarketingUnknown');
}

function badgeLabel(
  badge: ProviderCustomerSnapshotBadge,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  switch (badge.id) {
    case 'first_visit':
      return t('provider.customerSnapshotBadgeFirstVisit');
    case 'win_back':
      return t('provider.customerSnapshotBadgeWinBack');
    case 'referred_by':
      return t('provider.customerSnapshotBadgeReferredBy', {
        name: badge.referredByCustomerName ?? '',
      });
    default:
      return '';
  }
}

function badgeColor(
  badge: ProviderCustomerSnapshotBadge,
): 'success' | 'tertiary' | 'secondary' {
  switch (badge.tone) {
    case 'success':
      return 'success';
    case 'tertiary':
      return 'tertiary';
    case 'secondary':
      return 'secondary';
    default:
      return 'secondary';
  }
}

export default function BookingCustomerContextCard({
  context,
}: BookingCustomerContextCardProps) {
  const { t } = useI18n();

  return (
    <div className="ion-margin-bottom customer-context-card">
      <h3>{t('common.customer')}</h3>
      <p className="customer-context-card__name">{context.name}</p>
      {context.badges.length > 0 && (
        <div className="booking-checkout-context__badges ion-margin-top">
          {context.badges.map((badge) => (
            <IonBadge
              key={badge.id}
              color={badgeColor(badge)}
              className="booking-checkout-context__badge"
            >
              {badgeLabel(badge, t)}
            </IonBadge>
          ))}
        </div>
      )}
      {context.phone && (
        <a className="contact-link" href={`tel:${context.phone}`}>
          {context.phone}
        </a>
      )}
      {context.email && (
        <a className="contact-link" href={`mailto:${context.email}`}>
          {context.email}
        </a>
      )}

      <dl className="payment-breakdown__list ion-margin-top">
        <BookingCustomerLoyaltyQuickView loyalty={context.loyaltyQuickView} />
        <div className="payment-breakdown__row">
          <dt>{t('provider.customerContextVisits')}</dt>
          <dd>{context.completedVisitCount}</dd>
        </div>
        <div className="payment-breakdown__row">
          <dt>{t('provider.customerContextLastVisit')}</dt>
          <dd>
            {context.lastCompletedVisitAt
              ? formatDateDisplay(context.lastCompletedVisitAt)
              : t('common.none')}
          </dd>
        </div>
        <div className="payment-breakdown__row">
          <dt>{t('common.noShows')}</dt>
          <dd>{context.noShowCount}</dd>
        </div>
        <div className="payment-breakdown__row">
          <dt>{t('provider.customerContextMarketing')}</dt>
          <dd>{formatMarketingOptIn(context.marketingOptIn, t)}</dd>
        </div>
        {context.referral && (
          <div className="payment-breakdown__row">
            <dt>{t('provider.customerContextReferral')}</dt>
            <dd>
              {context.referral.referredByCustomerName}
              {context.referral.referralCodeUsed && (
                <IonText color="medium">
                  <span className="customer-context-card__referral-code">
                    {' '}
                    (
                    {t('provider.customerContextReferralCode', {
                      code: context.referral.referralCodeUsed,
                    })}
                    )
                  </span>
                </IonText>
              )}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
