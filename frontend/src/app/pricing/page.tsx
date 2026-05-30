'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useI18n } from '@/i18n';
import { MarketingShell } from '@/components/marketing/marketing-shell';
import { PricingGrid } from '@/components/marketing/pricing-grid';

export default function PricingPage() {
  const { t } = useI18n();

  return (
    <MarketingShell activeNav="pricing">
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            {t('marketing.pricing.title')}
          </h1>
          <p className="text-lg text-gray-400">{t('marketing.pricing.subtitle')}</p>
        </div>

        <PricingGrid />
      </section>

      <section className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold mb-3">{t('marketing.cta.title')}</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">{t('marketing.cta.body')}</p>
          <Link href="/register" className="btn-primary inline-flex items-center gap-2 px-8 py-3">
            {t('marketing.cta.button')} <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
