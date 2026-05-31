'use client';

import { X, Check } from 'lucide-react';
import { useI18n } from '@/i18n';
import { COMPARISON_ROW_IDS } from '@/lib/marketing-content';

export function VersusSection() {
  const { t } = useI18n();

  return (
    <section className="border-t border-gray-800 bg-gray-950/50">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('marketing.compare.title')}</h2>
          <p className="text-gray-400 text-lg">{t('marketing.compare.subtitle')}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-4 pr-4 text-gray-500 font-medium text-sm" />
                <th className="text-left py-4 px-4 text-gray-500 font-medium text-sm">
                  {t('marketing.compare.colLegacy')}
                </th>
                <th className="text-left py-4 px-4 text-gray-500 font-medium text-sm">
                  {t('marketing.compare.colGeneric')}
                </th>
                <th className="text-left py-4 pl-4 text-blue-400 font-semibold text-sm">
                  {t('marketing.compare.colUs')}
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROW_IDS.map((id) => (
                <tr key={id} className="border-b border-gray-800/80">
                  <td className="py-4 pr-4 font-medium text-gray-200">
                    {t(`marketing.compare.rows.${id}.label`)}
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-2 text-gray-500 text-sm">
                      <X className="w-4 h-4 text-red-400/80 shrink-0" />
                      {t(`marketing.compare.rows.${id}.legacy`)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-2 text-gray-500 text-sm">
                      <X className="w-4 h-4 text-amber-400/80 shrink-0" />
                      {t(`marketing.compare.rows.${id}.generic`)}
                    </span>
                  </td>
                  <td className="py-4 pl-4">
                    <span className="inline-flex items-center gap-2 text-gray-200 text-sm">
                      <Check className="w-4 h-4 text-green-400 shrink-0" />
                      {t(`marketing.compare.rows.${id}.us`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
