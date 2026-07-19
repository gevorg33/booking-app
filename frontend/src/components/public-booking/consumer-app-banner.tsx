'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '@/i18n';
import { detectConsumerMobilePlatform } from '@/lib/consumer-app-platform';
import { appendStoreSlugParam } from '@/lib/tenant-app-install-landing.util';
import { saveDeferredInstallLink } from '@/lib/deferred-install-link.util';
import { getPublicAppInstall } from '@/lib/public-api';

const IOS_STORE_URL = process.env.NEXT_PUBLIC_CONSUMER_IOS_APP_STORE_URL?.trim() || '';
const PLAY_STORE_URL = process.env.NEXT_PUBLIC_CONSUMER_ANDROID_PLAY_STORE_URL?.trim() || '';

function buildCustomSchemeUrl(slug: string): string {
  return `optischedule://book/${slug}`;
}

/** Shown on public booking pages — open installed app, download from store, or scan tenant QR. */
export function ConsumerAppBanner({ slug }: { slug: string }) {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');

  const dismissKey = useMemo(() => `consumer_banner_dismiss_${slug}`, [slug]);

  const { data: appInstall, isLoading: appInstallLoading } = useQuery({
    queryKey: ['public-app-install', slug],
    queryFn: () => getPublicAppInstall(slug),
    enabled: qrOpen,
    staleTime: 60_000,
  });

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

  const rememberTenant = useCallback(() => {
    saveDeferredInstallLink({ slug, installSource: 'web_banner', campaign: 'banner' });
  }, [slug]);

  const openInApp = useCallback(() => {
    rememberTenant();
    window.location.href = buildCustomSchemeUrl(slug);
  }, [rememberTenant, slug]);

  const openStore = useCallback(
    (url: string) => {
      rememberTenant();
      window.location.href = appendStoreSlugParam(url, slug);
    },
    [rememberTenant, slug],
  );

  const showIosDownload =
    !!IOS_STORE_URL && (platform === 'ios' || platform === 'other');
  const showAndroidDownload =
    !!PLAY_STORE_URL && (platform === 'android' || platform === 'other');

  if (dismissed) {
    return null;
  }

  return (
    <>
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
              onClick={() => setQrOpen(true)}
              className="rounded-lg border border-violet-300 bg-white px-3 py-1.5 font-medium hover:bg-violet-100"
            >
              {t('consumerApp.getApp')}
            </button>
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

      {qrOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* e2e-bug.4 spot-check — backdrop dismiss uses native <button> (same as specialist-picker) */}
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label={t('consumerApp.close')}
            onClick={() => setQrOpen(false)}
          />
          <div
            className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label={t('consumerApp.qrModalTitle')}
          >
            <h2 className="text-lg font-semibold text-gray-900">{t('consumerApp.qrModalTitle')}</h2>
            <p className="mt-1 text-sm text-gray-600">{t('consumerApp.qrModalHint')}</p>
            {appInstallLoading ? (
              <div className="mx-auto mt-4 h-48 w-48 animate-pulse rounded-lg bg-gray-100" />
            ) : appInstall?.qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={appInstall.qrDataUrl}
                alt={t('public.appInstallQrAlt')}
                className="mx-auto mt-4 rounded-lg bg-white p-2"
              />
            ) : (
              <p className="mt-4 text-sm text-gray-500">{t('consumerApp.qrUnavailable')}</p>
            )}
            {appInstall?.landingUrl ? (
              <a
                href={appInstall.landingUrl}
                className="mt-4 inline-block text-sm font-semibold text-violet-700 underline"
              >
                {t('public.appInstallOpenLink')}
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => setQrOpen(false)}
              className="mt-4 block w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('consumerApp.close')}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
