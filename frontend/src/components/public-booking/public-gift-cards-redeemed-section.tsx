'use client';

import Link from 'next/link';
import { CheckCircle2, Package } from 'lucide-react';
import { formatPrice, type PublicGiftCardRedeemed } from '@/lib/public-api';
import { formatDateDisplay } from '@/lib/date-format';
import { bookPath } from '@/lib/tenant-host';
import { useI18n } from '@/i18n';

export function PublicGiftCardsRedeemedSection({
  slug,
  redeemed,
  locale,
}: {
  slug: string;
  redeemed: PublicGiftCardRedeemed[];
  locale: string;
}) {
  const { t } = useI18n();

  if (redeemed.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 px-5 py-8 text-center">
        <p className="text-gray-500">{t('public.giftCards.noRedeemed')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">{t('public.giftCards.redeemedHint')}</p>
      {redeemed.map((item) => (
        <article key={item.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900 capitalize flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400" />
                {item.cardType}
              </p>
              <p className="text-sm text-gray-500 mt-1 font-mono">{item.code}</p>
              <p className="text-sm text-gray-600 mt-1 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {t('public.giftCards.claimedOn', {
                  date: formatDateDisplay(item.claimedAt, locale),
                })}
              </p>
              {(item.cardType === 'package' || item.cardType === 'subscription') && (
                <p className="text-sm text-gray-600 mt-2">
                  {item.cardType === 'package'
                    ? t('public.giftCards.redeemedPackageHint')
                    : t('public.giftCards.redeemedSubscriptionHint')}
                </p>
              )}
              {(item.cardType === 'service' || item.cardType === 'bundle') && (
                <p className="text-sm text-gray-600 mt-2">{t('public.giftCards.redeemedServiceHint')}</p>
              )}
              {item.serviceCredits.length > 0 && (
                <ul className="text-sm text-gray-600 mt-2 space-y-0.5">
                  {item.serviceCredits.map((credit) => (
                    <li key={credit.serviceId}>
                      {credit.serviceName} · {credit.quantityRemaining}/{credit.quantityTotal}{' '}
                      {t('public.giftCards.creditsRemaining')}
                    </li>
                  ))}
                </ul>
              )}
              {item.purchaseAmount != null && item.purchaseAmount > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {formatPrice(item.purchaseAmount, item.currency, locale)}
                </p>
              )}
            </div>
          </div>
          <Link
            href={bookPath(slug)}
            className="inline-block mt-3 text-sm font-medium text-violet-700 hover:text-violet-900"
          >
            {t('public.giftCards.bookToUse')}
          </Link>
        </article>
      ))}
    </div>
  );
}
