'use client';

import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { useI18n } from '@/i18n';
import {
  buildTenantAppInstallUrl,
  type TenantAppInstallCampaign,
} from '@/lib/deferred-install-link.util';
import {
  buildTenantAppInstallQrFilename,
  downloadTenantAppInstallQrPng,
} from '@/lib/tenant-app-install.util';

function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <input className="input text-xs flex-1 font-mono" readOnly value={value} aria-label={label} />
      <button
        type="button"
        className="btn-secondary text-xs px-2 py-1.5"
        onClick={() => {
          void navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

export function TenantAppInstallQrPanel({
  slug,
  publicOrigin,
  serviceId,
  campaign = 'venue_qr',
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
  const qrFilename = buildTenantAppInstallQrFilename(slug, campaign);

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(installUrl, { margin: 1, width: 180 }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [installUrl]);

  return (
    <div className="rounded-lg border border-gray-800 p-4 space-y-3">
      <div>
        <h4 className="font-medium">{t('growthDistribution.appInstallQrTitle')}</h4>
        <p className="text-sm text-gray-400 mt-1">{t('growthDistribution.appInstallQrHint')}</p>
      </div>
      {qrDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrDataUrl} alt={t('growthDistribution.appInstallQrAlt')} className="rounded-lg bg-white p-2" />
      ) : (
        <div className="h-[180px] w-[180px] rounded-lg bg-gray-900 animate-pulse" />
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-secondary text-xs px-3 py-1.5"
          onClick={() => {
            void downloadTenantAppInstallQrPng(installUrl, qrFilename);
          }}
        >
          {t('growthDistribution.appInstallQrDownload')}
        </button>
      </div>
      <CopyField value={installUrl} label={t('growthDistribution.appInstallLinkLabel')} />
    </div>
  );
}
