'use client';

import { useI18n } from '@/i18n';
import { MARKETING_STAT_IDS } from '@/lib/marketing-content';

export function MarketingStatsBar() {
  const { t } = useI18n();

  return (
    <section className="border-y border-gray-800 bg-gray-950/80">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
        {MARKETING_STAT_IDS.map((id) => (
          <div key={id} className="text-center">
            <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {t(`marketing.stats.${id}.value`)}
            </p>
            <p className="text-sm text-gray-400 mt-2">{t(`marketing.stats.${id}.label`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
