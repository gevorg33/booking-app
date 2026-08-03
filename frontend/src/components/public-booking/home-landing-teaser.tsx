'use client';

import Link from 'next/link';
import { Clock, Layers } from 'lucide-react';
import type { PublicBusinessProfile } from '@/lib/public-api';
import type { HomeCategoryTeaser } from '@/lib/home-landing-teaser.util';
import { hasHomeLandingTeaserContent } from '@/lib/home-landing-teaser.util';
import { bookPath } from '@/lib/tenant-host';
import { useI18n } from '@/i18n';

interface HomeLandingTeaserProps {
  slug: string;
  tenant: PublicBusinessProfile;
  categories: HomeCategoryTeaser[];
}

/** e2e-bug.207 — compact hours + service-category teaser on public booking home. */
export function HomeLandingTeaser({
  slug,
  tenant,
  categories,
}: HomeLandingTeaserProps) {
  const { t } = useI18n();
  const summaryLines = tenant.openingHours?.summaryLines ?? [];
  if (!hasHomeLandingTeaserContent({ summaryLines, categories })) {
    return null;
  }

  const primary = tenant.branding.primaryColor || '#7c3aed';
  const hours = summaryLines.filter((line) => line.trim().length > 0);

  return (
    <section
      className="bg-white rounded-3xl border border-gray-100 p-5 mb-5 shadow-sm"
      data-testid="home-landing-teaser"
      aria-label={t('public.homeLandingTeaserLabel')}
    >
      {hours.length > 0 ? (
        <div data-testid="home-landing-hours" className="text-sm text-gray-600">
          <div className="flex items-center gap-2 mb-1.5">
            <Clock className="w-4 h-4 shrink-0 text-gray-400" aria-hidden />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              {t('public.hours')}
            </span>
            <Link
              href={bookPath(slug, '/profile')}
              className="ml-auto text-xs font-medium hover:underline"
              style={{ color: primary }}
            >
              {t('public.seeProfile')}
            </Link>
          </div>
          <ul className="space-y-0.5 pl-6">
            {hours.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {categories.length > 0 ? (
        <div
          data-testid="home-landing-categories"
          className={hours.length > 0 ? 'mt-4 pt-4 border-t border-gray-100' : ''}
        >
          <div className="flex items-center gap-2 mb-2.5">
            <Layers className="w-4 h-4 shrink-0 text-gray-400" aria-hidden />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              {t('public.serviceCategories')}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`${bookPath(slug, '/services')}?category=${encodeURIComponent(category.id)}`}
                className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 hover:border-gray-300"
                style={{ borderColor: `${primary}33` }}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
