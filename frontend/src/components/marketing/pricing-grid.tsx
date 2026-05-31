'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import axios from 'axios';
import { useI18n } from '@/i18n';
import { getApiBaseUrl } from '@/lib/api-base';
import { MARKETING_PLANS, type MarketingPlanMeta } from '@/lib/marketing-content';

interface LivePlan {
  id: string;
  name: string;
  priceMonthly: number;
  currency: string;
}

function formatPrice(amount: number, locale: string): string {
  if (amount === 0) return '$0';
  return new Intl.NumberFormat(locale === 'hy' ? 'hy-AM' : locale === 'ru' ? 'ru-RU' : 'en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function PlanCard({ plan, locale }: { plan: MarketingPlanMeta; locale: string }) {
  const { t } = useI18n();
  const prefix = `marketing.pricing.plans.${plan.id}`;

  const ctaHref = plan.cta === 'sales' ? 'mailto:sales@optischedule.com' : '/register';
  const ctaLabel =
    plan.cta === 'free'
      ? t('marketing.pricing.startFree')
      : plan.cta === 'sales'
        ? t('marketing.pricing.contactSales')
        : t('marketing.pricing.startTrial');

  const features = Array.from({ length: plan.featureCount }, (_, i) =>
    t(`${prefix}.feature${i + 1}`),
  );

  return (
    <div
      className={`card relative flex flex-col ${
        plan.popular ? 'ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/10' : ''
      }`}
    >
      {plan.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
          <Sparkles className="w-3 h-3" />
          {t('marketing.pricing.popular')}
        </span>
      )}

      <h3 className="text-xl font-semibold mb-1">{t(`${prefix}.name`)}</h3>
      <p className="text-gray-400 text-sm mb-6 min-h-[2.5rem]">{t(`${prefix}.description`)}</p>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold">{formatPrice(plan.baseMonthly, locale)}</span>
          <span className="text-gray-500">{t('marketing.pricing.perMonth')}</span>
        </div>
        {plan.providerSeat != null && (
          <p className="text-sm text-gray-400 mt-2">
            + {formatPrice(plan.providerSeat, locale)} {t('marketing.pricing.providerSeat')}
            {plan.adminSeat != null && (
              <>
                {' · '}
                {formatPrice(plan.adminSeat, locale)} {t('marketing.pricing.adminSeat')}
              </>
            )}
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-gray-300">
            <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            {feature}
          </li>
        ))}
      </ul>

      {plan.cta === 'sales' ? (
        <a href={ctaHref} className="btn-secondary text-center w-full">
          {ctaLabel}
        </a>
      ) : (
        <Link href={ctaHref} className={plan.popular ? 'btn-primary text-center w-full' : 'btn-secondary text-center w-full'}>
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}

export function PricingGrid() {
  const { t, locale } = useI18n();
  const [livePlans, setLivePlans] = useState<LivePlan[]>([]);

  useEffect(() => {
    axios
      .get<LivePlan[]>(`${getApiBaseUrl()}/billing/plans`)
      .then((res) => setLivePlans(res.data))
      .catch(() => setLivePlans([]));
  }, []);

  return (
    <div>
      {livePlans.length > 0 && (
        <div className="mb-10 rounded-xl border border-blue-500/20 bg-blue-600/5 px-5 py-4 text-sm text-gray-300">
          <p className="font-medium text-blue-300 mb-1">{t('marketing.pricing.checkoutNoteTitle')}</p>
          <p>
            {t('marketing.pricing.checkoutNoteBody', {
              plan: livePlans.map((p) => `${p.name} (${formatPrice(p.priceMonthly, locale)}/mo)`).join(', '),
            })}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {MARKETING_PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} locale={locale} />
        ))}
      </div>

      <p className="text-center text-sm text-gray-500 mt-8">{t('marketing.pricing.seatNote')}</p>
      <p className="text-center text-sm text-gray-500 mt-2">{t('marketing.pricing.annualNote')}</p>
    </div>
  );
}
