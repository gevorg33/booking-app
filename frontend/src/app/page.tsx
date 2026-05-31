'use client';

import Link from 'next/link';
import { Calendar, Brain, Shield, ArrowRight } from 'lucide-react';
import { useI18n } from '@/i18n';
import { MarketingShell } from '@/components/marketing/marketing-shell';
import { TestimonialsSection } from '@/components/marketing/testimonials-section';

export default function HomePage() {
  const { t } = useI18n();

  return (
    <MarketingShell activeNav="home">
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-400 text-sm mb-6">
            <Brain className="w-4 h-4" />
            {t('landing.badge')}
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            {t('landing.title')}
          </h1>
          <p className="text-xl text-gray-400 mb-10 leading-relaxed">
            {t('landing.subtitle')}
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="btn-primary text-lg px-8 py-3 flex items-center gap-2"
            >
              {t('landing.startFree')} <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="btn-secondary text-lg px-8 py-3">
              {t('nav.signIn')}
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card">
            <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('landing.featureAiTitle')}</h3>
            <p className="text-gray-400">
              {t('landing.featureAiBody')}
            </p>
          </div>
          <div className="card">
            <div className="w-12 h-12 bg-green-600/10 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('landing.featureSafeTitle')}</h3>
            <p className="text-gray-400">
              {t('landing.featureSafeBody')}
            </p>
          </div>
          <div className="card">
            <div className="w-12 h-12 bg-purple-600/10 rounded-xl flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('landing.featureCalendarTitle')}</h3>
            <p className="text-gray-400">
              {t('landing.featureCalendarBody')}
            </p>
          </div>
        </div>
      </section>

      <TestimonialsSection />

      <section className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold mb-3">{t('marketing.cta.title')}</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">{t('marketing.cta.body')}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/register" className="btn-primary inline-flex items-center gap-2 px-8 py-3">
              {t('marketing.cta.button')} <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/pricing" className="btn-secondary px-8 py-3">
              {t('marketing.nav.pricing')}
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
