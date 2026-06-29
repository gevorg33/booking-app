'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useI18n } from '@/i18n';
import { detectConsumerMobilePlatform } from '@/lib/consumer-app-platform';
import {
  appendStoreSlugParam,
  resolveTenantAppInstallRedirect,
} from '@/lib/tenant-app-install-landing.util';
import {
  parseInstallAttributionFromParams,
  saveDeferredInstallLink,
} from '@/lib/deferred-install-link.util';

const IOS_STORE_URL = process.env.NEXT_PUBLIC_CONSUMER_IOS_APP_STORE_URL?.trim() || '';
const PLAY_STORE_URL = process.env.NEXT_PUBLIC_CONSUMER_ANDROID_PLAY_STORE_URL?.trim() || '';

export function GetAppClient({ slug }: { slug: string }) {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const customSchemeUrl = `optischedule://book/${slug}`;

  useEffect(() => {
    saveDeferredInstallLink({
      slug,
      serviceId: searchParams.get('serviceId') ?? undefined,
      installSource: parseInstallAttributionFromParams({
        src: searchParams.get('src'),
        ref: searchParams.get('ref'),
        utm_source: searchParams.get('utm_source'),
        utm_medium: searchParams.get('utm_medium'),
      }) ?? 'qr',
      campaign: searchParams.get('utm_campaign') ?? 'venue_qr',
    });

    const platform = detectConsumerMobilePlatform();
    const redirect = resolveTenantAppInstallRedirect(platform, {
      slug,
      iosStoreUrl: IOS_STORE_URL,
      androidStoreUrl: PLAY_STORE_URL,
      customSchemeUrl,
    });
    if (!redirect) return;

    window.location.href = redirect.primary;
    if (redirect.fallback) {
      window.setTimeout(() => {
        window.location.href = redirect.fallback!;
      }, 700);
    }
  }, [customSchemeUrl, searchParams, slug]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-12 text-center">
      <h1 className="text-xl font-semibold text-gray-900">{t('consumerApp.getAppTitle')}</h1>
      <p className="mt-2 text-sm text-gray-600">{t('consumerApp.getAppSubtitle')}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {IOS_STORE_URL ? (
          <a
            href={appendStoreSlugParam(IOS_STORE_URL, slug)}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            {t('consumerApp.downloadIos')}
          </a>
        ) : null}
        {PLAY_STORE_URL ? (
          <a
            href={appendStoreSlugParam(PLAY_STORE_URL, slug)}
            className="rounded-lg border border-violet-300 bg-white px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50"
          >
            {t('consumerApp.downloadAndroid')}
          </a>
        ) : null}
        <a
          href={customSchemeUrl}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {t('consumerApp.openInApp')}
        </a>
      </div>
    </div>
  );
}
