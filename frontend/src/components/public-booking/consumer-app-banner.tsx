'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { detectConsumerMobilePlatform } from '@/lib/consumer-app-platform';
import {
  buildConsumerAppBannerDismissKey,
  buildConsumerAppBannerOpenInAppUrls,
  buildConsumerAppBannerStoreUrl,
  buildDeferredLinkForBanner,
  resolveConsumerAppBannerStoreButtons,
} from '@/lib/consumer-app-banner.util';
import { saveDeferredInstallLink, type InstallSource } from '@/lib/deferred-install-link.util';

const IOS_STORE_URL = process.env.NEXT_PUBLIC_CONSUMER_IOS_APP_STORE_URL?.trim() || '';
const PLAY_STORE_URL = process.env.NEXT_PUBLIC_CONSUMER_ANDROID_PLAY_STORE_URL?.trim() || '';
const WEB_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
  (typeof window !== 'undefined' ? window.location.origin : '');

/** Shown on public booking pages — open installed app or download from App Store / Play Store. */
export function ConsumerAppBanner({
  slug,
  serviceId,
  date,
  slot,
  employeeId,
  installSource = 'web_banner',
}: {
  slug: string;
  serviceId?: string;
  date?: string;
  slot?: string;
  employeeId?: string;
  installSource?: InstallSource;
}) {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');

  const dismissKey = useMemo(() => buildConsumerAppBannerDismissKey(slug), [slug]);
  const deferredLink = useMemo(
    () =>
      buildDeferredLinkForBanner({
        slug,
        serviceId,
        date,
        slot,
        employeeId,
        installSource,
      }),
    [slug, serviceId, date, slot, employeeId, installSource],
  );

  useEffect(() => {
    queueMicrotask(() => setPlatform(detectConsumerMobilePlatform()));
    try {
      queueMicrotask(() => setDismissed(sessionStorage.getItem(dismissKey) === '1'));
    } catch {
      queueMicrotask(() => setDismissed(false));
    }
  }, [dismissKey]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      sessionStorage.setItem(dismissKey, '1');
    } catch {
      /* ignore */
    }
  }, [dismissKey]);

  const openInApp = useCallback(() => {
    saveDeferredInstallLink(deferredLink);
    const { universalUrl, customSchemeUrl } = buildConsumerAppBannerOpenInAppUrls(
      WEB_ORIGIN,
      deferredLink,
    );
    window.location.href = universalUrl;
    window.setTimeout(() => {
      window.location.href = customSchemeUrl;
    }, 600);
  }, [deferredLink]);

  const openStore = useCallback(
    (url: string) => {
      saveDeferredInstallLink(deferredLink);
      window.location.href = buildConsumerAppBannerStoreUrl(url, deferredLink);
    },
    [deferredLink],
  );

  const { showIosDownload, showAndroidDownload } = resolveConsumerAppBannerStoreButtons(
    platform,
    IOS_STORE_URL,
    PLAY_STORE_URL,
  );

  if (dismissed) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label={t('consumerApp.bannerAria')}
      className="border-b border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-950"
    >
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
        <p className="font-medium">{t('consumerApp.bannerTitle')}</p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openInApp}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-white hover:bg-violet-700"
          >
            {t('consumerApp.openInApp')}
          </button>
          {showIosDownload ? (
            <button
              type="button"
              onClick={() => openStore(IOS_STORE_URL)}
              className="rounded-lg border border-violet-300 bg-white px-3 py-1.5 hover:bg-violet-100"
            >
              {t('consumerApp.downloadIos')}
            </button>
          ) : null}
          {showAndroidDownload ? (
            <button
              type="button"
              onClick={() => openStore(PLAY_STORE_URL)}
              className="rounded-lg border border-violet-300 bg-white px-3 py-1.5 hover:bg-violet-100"
            >
              {t('consumerApp.downloadAndroid')}
            </button>
          ) : null}
          <button
            type="button"
            onClick={dismiss}
            className="px-2 text-violet-700/80 hover:text-violet-900"
            aria-label={t('consumerApp.dismiss')}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
