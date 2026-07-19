'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { syncAnalyticsConsentFromCookies } from '@/lib/app-analytics';
import {
  shouldShowCookieConsentBanner,
  writeCookieConsent,
  type CookieConsentChoice,
} from '@/lib/cookie-consent';
import type { PublicBusinessProfile } from '@/lib/public-api';

export function CookieConsentBanner({
  slug,
  tenant,
}: {
  slug: string;
  tenant: Pick<PublicBusinessProfile, 'privacy'>;
}) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const privacy = tenant.privacy;
  const bannerEnabled = privacy?.cookieBannerEnabled === true;

  useEffect(() => {
    queueMicrotask(() => {
      setVisible(shouldShowCookieConsentBanner(slug, bannerEnabled));
    });
  }, [slug, bannerEnabled]);

  if (!bannerEnabled || !visible) return null;

  const message =
    privacy?.cookieBannerMessage?.trim() || t('public.cookieBannerDefault');

  const choose = (choice: CookieConsentChoice) => {
    writeCookieConsent(slug, choice);
    // Keep in-memory analytics gate in sync without a full reload.
    syncAnalyticsConsentFromCookies(slug, { cookieBannerEnabled: true });
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label={t('public.cookieBannerTitle')}
      className="fixed bottom-0 inset-x-0 z-[60] border-t border-gray-200 bg-white/95 backdrop-blur px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg"
    >
      <div className="mx-auto max-w-3xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-700">{message}</p>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={() => choose('rejected')}
          >
            {t('public.cookieBannerReject')}
          </button>
          <button
            type="button"
            className="btn-primary text-sm"
            onClick={() => choose('accepted')}
          >
            {t('public.cookieBannerAccept')}
          </button>
        </div>
      </div>
    </div>
  );
}
