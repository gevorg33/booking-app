'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n';
import type { TenantAppInstallCampaign } from '@/lib/deferred-install-link.util';
import {
  buildTenantAppInstallQrFilename,
  downloadQrDataUrl,
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
  landingUrl,
  qrDataUrl,
  campaign = 'venue_qr',
}: {
  slug: string;
  landingUrl: string;
  qrDataUrl: string;
  campaign?: TenantAppInstallCampaign;
}) {
  const { t } = useI18n();
  const qrFilename = buildTenantAppInstallQrFilename(slug, campaign);

  return (
    <div className="rounded-lg border border-gray-800 p-4 space-y-3">
      <div>
        <h4 className="font-medium">{t('growthDistribution.appInstallQrTitle')}</h4>
        <p className="text-sm text-gray-400 mt-1">{t('growthDistribution.appInstallQrHint')}</p>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrDataUrl} alt={t('growthDistribution.appInstallQrAlt')} className="rounded-lg bg-white p-2" />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-secondary text-xs px-3 py-1.5"
          onClick={() => {
            downloadQrDataUrl(qrDataUrl, qrFilename);
          }}
        >
          {t('growthDistribution.appInstallQrDownload')}
        </button>
      </div>
      <CopyField value={landingUrl} label={t('growthDistribution.appInstallLinkLabel')} />
    </div>
  );
}
