import QRCode from 'qrcode';
import type { AppLocale } from '../i18n/messages.js';
import { t } from '../i18n/messages.js';

export type TenantAppInstallCampaign =
  | 'venue_qr'
  | 'confirmation_qr'
  | 'receipt_qr';

export function isValidTenantSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(slug);
}

export function buildTenantAppInstallUrl(
  frontendUrl: string,
  slug: string,
  options?: {
    serviceId?: string;
    campaign?: TenantAppInstallCampaign;
  },
): string | null {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!isValidTenantSlug(normalizedSlug)) return null;

  const base = frontendUrl.replace(/\/$/, '');
  const url = new URL(`${base}/book/${normalizedSlug}`);
  const serviceId = options?.serviceId?.trim();
  if (serviceId) url.searchParams.set('serviceId', serviceId);
  url.searchParams.set('src', 'qr');
  url.searchParams.set('utm_campaign', options?.campaign ?? 'venue_qr');
  return url.toString();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function buildTenantAppInstallLinkText(
  url: string,
  locale: AppLocale,
): string {
  return `\n\n${t(locale, 'email.appInstallPromoText', { url })}`;
}

export function buildTenantAppInstallLinkHtml(
  url: string,
  locale: AppLocale,
  qrDataUrl?: string | null,
): string {
  const safeUrl = escapeHtml(url);
  const link = `<a href="${safeUrl}" style="text-decoration:underline">${escapeHtml(t(locale, 'email.appInstallPromoLinkLabel'))}</a>`;
  const qr = qrDataUrl
    ? `<br/><img src="${qrDataUrl}" alt="${escapeHtml(t(locale, 'email.appInstallQrAlt'))}" width="140" height="140" style="margin-top:12px;border-radius:8px"/>`
    : '';
  return `<br/><br/><strong>${escapeHtml(t(locale, 'email.appInstallPromoHeading'))}</strong><br/>${link}${qr}`;
}

export async function buildTenantAppInstallQrDataUrl(
  installUrl: string,
): Promise<string | null> {
  try {
    return await QRCode.toDataURL(installUrl, { margin: 1, width: 140 });
  } catch {
    return null;
  }
}

export async function buildTenantAppInstallEmailBlocks(input: {
  frontendUrl: string;
  slug: string;
  serviceId?: string;
  campaign: TenantAppInstallCampaign;
  locale: AppLocale;
  includeQr?: boolean;
}): Promise<{ appInstallLinkText: string; appInstallLinkHtml: string }> {
  const installUrl = buildTenantAppInstallUrl(input.frontendUrl, input.slug, {
    serviceId: input.serviceId,
    campaign: input.campaign,
  });
  if (!installUrl) {
    return { appInstallLinkText: '', appInstallLinkHtml: '' };
  }

  const qrDataUrl =
    input.includeQr === false
      ? null
      : await buildTenantAppInstallQrDataUrl(installUrl);

  return {
    appInstallLinkText: buildTenantAppInstallLinkText(installUrl, input.locale),
    appInstallLinkHtml: buildTenantAppInstallLinkHtml(
      installUrl,
      input.locale,
      qrDataUrl,
    ),
  };
}

export function emptyTenantAppInstallEmailBlocks(): {
  appInstallLinkText: string;
  appInstallLinkHtml: string;
} {
  return { appInstallLinkText: '', appInstallLinkHtml: '' };
}
