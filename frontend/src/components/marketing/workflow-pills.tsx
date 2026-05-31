'use client';

import { Sparkles } from 'lucide-react';
import { useI18n } from '@/i18n';
import { WORKFLOW_PILL_IDS } from '@/lib/marketing-content';

export function WorkflowPills() {
  const { t } = useI18n();

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <p className="text-center text-sm uppercase tracking-widest text-gray-500 mb-6">
        {t('marketing.pills.eyebrow')}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {WORKFLOW_PILL_IDS.map((id) => (
          <span
            key={id}
            className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900/60 px-4 py-2 text-sm text-gray-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            {t(`marketing.pills.items.${id}`)}
          </span>
        ))}
      </div>
    </section>
  );
}
