'use client';

import { PublicBookingLanguageSwitcher } from '@/components/public-booking/public-booking-language-switcher';
import { useI18n } from '@/i18n';

export function PublicBookingFooter({ slug }: { slug: string }) {
  const { t } = useI18n();

  return (
    <footer className="max-w-lg mx-auto px-4 py-8 space-y-4">
      <div className="flex justify-center">
        <PublicBookingLanguageSwitcher slug={slug} />
      </div>
      <p className="text-center text-xs text-gray-400">{t('common.poweredBy')}</p>
    </footer>
  );
}
