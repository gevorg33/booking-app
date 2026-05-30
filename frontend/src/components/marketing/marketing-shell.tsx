'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';
import { useI18n } from '@/i18n';
import { LanguageSwitcher } from '@/components/language-switcher';
import type { MarketingNavId } from '@/lib/marketing-content';

interface MarketingShellProps {
  children: React.ReactNode;
  activeNav?: MarketingNavId;
}

const NAV_ITEMS: { id: MarketingNavId; href: string }[] = [
  { id: 'home', href: '/' },
  { id: 'pricing', href: '/pricing' },
  { id: 'testimonials', href: '/#testimonials' },
  { id: 'trust', href: '/trust' },
];

export function MarketingShell({ children, activeNav }: MarketingShellProps) {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">OptiSchedule</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={
                  activeNav === item.id
                    ? 'text-white font-medium'
                    : 'text-gray-400 hover:text-white transition-colors'
                }
              >
                {t(`marketing.nav.${item.id}`)}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="dark" compact />
            <Link
              href="/login"
              className="hidden sm:inline text-gray-400 hover:text-white transition-colors text-sm"
            >
              {t('nav.signIn')}
            </Link>
            <Link href="/register" className="btn-primary text-sm px-4 py-2">
              {t('nav.getStarted')}
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-gray-800 px-6 py-10 mt-16">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
          <p>{t('marketing.footer.tagline')}</p>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="hover:text-gray-300 transition-colors">
              {t('marketing.nav.pricing')}
            </Link>
            <Link href="/trust" className="hover:text-gray-300 transition-colors">
              {t('marketing.nav.trust')}
            </Link>
            <Link href="/register" className="hover:text-gray-300 transition-colors">
              {t('nav.getStarted')}
            </Link>
          </div>
          <p>{t('marketing.footer.rights', { year: String(year) })}</p>
        </div>
      </footer>
    </div>
  );
}
