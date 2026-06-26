'use client';

import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { useI18n } from '@/i18n';
import {
  buildTenantAppInstallUrl,
  saveDeferredInstallLink,
  type TenantAppInstallCampaign,
} from '@/lib/deferred-install-link.util';
import {
  shouldShowTenantAppInstallQr,
} from '@/lib/tenant-app-install.util';

const IOS_STORE_URL = process.env.NEXT_PUBLIC_CONSUMER_IOS_APP_STORE_URL?.trim() || '';
const PLAY_STORE_URL = process.env.NEXT_PUBLIC_CONSUMER_ANDROID_PLAY_STORE_URL?.trim() || '';

export function TenantAppInstallQrCompact({
  slug,
  publicOrigin,
  serviceId,
  campaign = 'confirmation_qr',
}: {
  slug: string;
  publicOrigin: string;
  serviceId?: string;
  campaign?: TenantAppInstallCampaign;
}) {
  const { t } = useI18n();
  const installUrl = useMemo(
    () =>
      buildTenantAppInstallUrl(publicOrigin, slug, {
        serviceId,
        installSource: 'qr',
        campaign,
      }),
    [campaign, publicOrigin, serviceId, slug],
  );
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    saveDeferredInstallLink({
      slug,
      serviceId,
      installSource: 'qr',
      campaign,
    });
  }, [campaign, serviceId, slug]);

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(installUrl, { margin: 1, width: 128 }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [installUrl]);

  if (!shouldShowTenantAppInstallQr(IOS_STORE_URL, PLAY_STORE_URL)) {
    return null;
  }

  return (
    <div className="mt-6 w-full max-w-sm rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center">
      <p className="text-sm font-semibold text-gray-900">{t('public.appInstallQrTitle')}</p>
      <p className="text-xs text-gray-500 mt-1">{t('public.appInstallQrHint')}</p>
      {qrDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qrDataUrl}
          alt={t('public.appInstallQrAlt')}
          className="mx-auto mt-3 rounded-lg bg-white p-2"
        />
      ) : (
        <div className="mx-auto mt-3 h-32 w-32 rounded-lg bg-white animate-pulse" />
      )}
      <a
        href={installUrl}
        className="mt-3 inline-block text-xs font-semibold text-violet-700 underline"
      >
        {t('public.appInstallOpenLink')}
      </a>
    </div>
  );
}
