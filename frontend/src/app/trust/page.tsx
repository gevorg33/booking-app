'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Brain,
  CreditCard,
  FileCheck,
  Lock,
  Server,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useI18n } from '@/i18n';
import { MarketingShell } from '@/components/marketing/marketing-shell';
import { TRUST_SECTION_IDS } from '@/lib/marketing-content';

const TRUST_ICONS = {
  encryption: Lock,
  privacy: UserCheck,
  aiSafety: Brain,
  payments: CreditCard,
  infrastructure: Server,
  audit: FileCheck,
} as const;

export default function TrustPage() {
  const { t } = useI18n();

  return (
    <MarketingShell activeNav="trust">
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 bg-green-600/10 border border-green-500/20 rounded-full px-4 py-1.5 text-green-400 text-sm mb-6">
            <ShieldCheck className="w-4 h-4" />
            {t('marketing.trust.badge')}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            {t('marketing.trust.title')}
          </h1>
          <p className="text-lg text-gray-400">{t('marketing.trust.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TRUST_SECTION_IDS.map((sectionId) => {
            const Icon = TRUST_ICONS[sectionId];
            return (
              <article key={sectionId} className="card">
                <div className="w-12 h-12 bg-green-600/10 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-green-400" />
                </div>
                <h2 className="text-lg font-semibold mb-2">
                  {t(`marketing.trust.sections.${sectionId}.title`)}
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {t(`marketing.trust.sections.${sectionId}.body`)}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-16 card bg-gray-900/50">
          <h2 className="text-xl font-semibold mb-3">{t('marketing.trust.commitmentTitle')}</h2>
          <p className="text-gray-400 leading-relaxed">{t('marketing.trust.commitmentBody')}</p>
        </div>
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
