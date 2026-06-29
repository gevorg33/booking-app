import { buildTenantAppInstallQrDataUrl } from './tenant-app-install-link.util.js';
import type { TenantAppInstallCampaign } from './tenant-app-install-link.util.js';
import { isValidTenantSlug } from './tenant-app-install-link.util.js';

export interface TenantAppInstallSettings {
  landingUrl: string;
  qrDataUrl: string;
  generatedAt: string;
}

export interface TenantAppInstallView {
  slug: string;
  landingUrl: string;
  qrDataUrl: string;
  customSchemeUrl: string;
  generatedAt: string;
}

const SETTINGS_KEY = 'appInstall';

export function buildTenantAppInstallLandingUrl(
  frontendUrl: string,
  slug: string,
  options?: {
    campaign?: TenantAppInstallCampaign;
    installSource?: string;
  },
): string | null {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!isValidTenantSlug(normalizedSlug)) return null;

  const base = frontendUrl.replace(/\/$/, '');
  const url = new URL(`${base}/get-app/${normalizedSlug}`);
  url.searchParams.set('src', options?.installSource ?? 'qr');
  url.searchParams.set('utm_campaign', options?.campaign ?? 'venue_qr');
  return url.toString();
}

export function buildTenantAppCustomSchemeUrl(slug: string): string {
  return `optischedule://book/${slug.trim().toLowerCase()}`;
}

export function readTenantAppInstallSettings(
  settings?: Record<string, unknown> | null,
): TenantAppInstallSettings | null {
  const raw = settings?.[SETTINGS_KEY];
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.landingUrl !== 'string' || !record.landingUrl.trim()) {
    return null;
  }
  if (typeof record.qrDataUrl !== 'string' || !record.qrDataUrl.startsWith('data:image/')) {
    return null;
  }
  return {
    landingUrl: record.landingUrl,
    qrDataUrl: record.qrDataUrl,
    generatedAt:
      typeof record.generatedAt === 'string'
        ? record.generatedAt
        : new Date().toISOString(),
  };
}

export function mergeTenantAppInstallIntoSettings(
  settings: Record<string, unknown>,
  appInstall: TenantAppInstallSettings,
): Record<string, unknown> {
  return {
    ...settings,
    [SETTINGS_KEY]: appInstall,
  };
}

export function toTenantAppInstallView(
  slug: string,
  appInstall: TenantAppInstallSettings,
): TenantAppInstallView {
  return {
    slug: slug.trim().toLowerCase(),
    landingUrl: appInstall.landingUrl,
    qrDataUrl: appInstall.qrDataUrl,
    customSchemeUrl: buildTenantAppCustomSchemeUrl(slug),
    generatedAt: appInstall.generatedAt,
  };
}

export async function generateTenantAppInstallSettings(
  slug: string,
  frontendUrl: string,
): Promise<TenantAppInstallSettings | null> {
  const landingUrl = buildTenantAppInstallLandingUrl(frontendUrl, slug);
  if (!landingUrl) return null;

  const qrDataUrl = await buildTenantAppInstallQrDataUrl(landingUrl, 512);
  if (!qrDataUrl) return null;

  return {
    landingUrl,
    qrDataUrl,
    generatedAt: new Date().toISOString(),
  };
}
