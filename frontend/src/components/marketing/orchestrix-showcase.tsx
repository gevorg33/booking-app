'use client';

import Link from 'next/link';
import { ArrowRight, Bot, CheckCircle2, GitBranch, ShieldCheck, Zap } from 'lucide-react';
import { useI18n } from '@/i18n';
import { ORCHESTRIX_FEATURE_IDS } from '@/lib/marketing-content';

const FEATURE_ICONS = {
  intent: Zap,
  agents: Bot,
  approve: CheckCircle2,
  audit: GitBranch,
} as const;

export function OrchestrixShowcase() {
  const { t } = useI18n();

  return (
    <section id="orchestrix" className="scroll-mt-20 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-600/10 border border-purple-500/30 rounded-full px-4 py-1.5 text-purple-300 text-sm mb-6">
              <Bot className="w-4 h-4" />
              {t('marketing.orchestrix.badge')}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-blue-100 to-purple-300 bg-clip-text text-transparent">
                {t('marketing.orchestrix.title')}
              </span>
            </h2>
            <p className="text-lg text-gray-400 mb-8 leading-relaxed">
              {t('marketing.orchestrix.subtitle')}
            </p>
            <ul className="space-y-4 mb-10">
              {ORCHESTRIX_FEATURE_IDS.map((id) => {
                const Icon = FEATURE_ICONS[id];
                return (
                  <li key={id} className="flex gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {t(`marketing.orchestrix.features.${id}.title`)}
                      </p>
                      <p className="text-sm text-gray-400">
                        {t(`marketing.orchestrix.features.${id}.body`)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <Link
              href="/register"
              className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-lg"
            >
              {t('marketing.orchestrix.cta')} <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="card bg-gradient-to-br from-gray-900 via-gray-950 to-blue-950/40 border-blue-500/20 p-6 md:p-8 font-mono text-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-4 pb-4 border-b border-gray-800">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              {t('marketing.orchestrix.demoLabel')}
            </div>
            <p className="text-blue-300 mb-4">{t('marketing.orchestrix.demoPrompt')}</p>
            <div className="space-y-3 text-gray-400">
              <p className="text-purple-300">→ {t('marketing.orchestrix.demoStep1')}</p>
              <p className="text-purple-300">→ {t('marketing.orchestrix.demoStep2')}</p>
              <p className="text-purple-300">→ {t('marketing.orchestrix.demoStep3')}</p>
              <p className="text-green-400 mt-4">✓ {t('marketing.orchestrix.demoResult')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
