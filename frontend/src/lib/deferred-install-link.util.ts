import { buildTenantPublicUrl } from '@/lib/tenant-host';

export type InstallSource = 'web_banner' | 'qr' | 'referral' | 'ad' | 'link' | 'share' | 'unknown';

export type TenantAppInstallCampaign = 'venue_qr' | 'confirmation_qr' | 'receipt_qr';

export interface DeferredInstallLink {
  slug: string;
  serviceId?: string;
  installSource?: InstallSource;
  campaign?: string;
  date?: string;
  slot?: string;
  employeeId?: string;
  capturedAt: string;
}

const DEFERRED_INSTALL_KEY = 'consumer_deferred_install';
const LEGACY_DEFERRED_SLUG_KEY = 'consumer_deferred_slug';

const INSTALL_SOURCES = new Set<InstallSource>([
  'web_banner',
  'qr',
  'referral',
  'ad',
  'link',
  'share',
  'unknown',
]);

export function isValidTenantSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(slug);
}

export function parseInstallSource(raw: string | null | undefined): InstallSource | undefined {
  const value = raw?.trim().toLowerCase();
  if (!value) return undefined;
  return INSTALL_SOURCES.has(value as InstallSource) ? (value as InstallSource) : 'unknown';
}

export function parseInstallAttributionFromParams(params: {
  src?: string | null;
  ref?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
}): InstallSource | undefined {
  const explicit = parseInstallSource(params.src);
  if (explicit) return explicit;
  if (params.ref?.trim()) return 'referral';
  const utmSource = params.utm_source?.trim().toLowerCase();
  const utmMedium = params.utm_medium?.trim().toLowerCase();
  if (utmMedium === 'cpc' || utmMedium === 'paid' || utmMedium === 'paid_social') return 'ad';
  if (utmSource === 'qr') return 'qr';
  if (utmSource === 'referral' || utmSource === 'invite') return 'referral';
  if (utmSource === 'ad' || utmSource === 'facebook' || utmSource === 'instagram') return 'ad';
  return undefined;
}

export function buildAttributedBookUrl(
  origin: string,
  link: Pick<
    DeferredInstallLink,
    'slug' | 'serviceId' | 'installSource' | 'campaign' | 'date' | 'slot' | 'employeeId'
  >,
): string {
  const url = new URL(
    buildTenantPublicUrl(link.slug, '', { origin: origin.replace(/\/$/, '') }),
  );
  if (link.serviceId?.trim()) url.searchParams.set('serviceId', link.serviceId.trim());
  if (link.installSource) url.searchParams.set('src', link.installSource);
  if (link.campaign?.trim()) url.searchParams.set('utm_campaign', link.campaign.trim());
  if (link.date?.trim()) url.searchParams.set('date', link.date.trim().slice(0, 10));
  if (link.slot?.trim()) url.searchParams.set('slot', link.slot.trim());
  if (link.employeeId?.trim()) url.searchParams.set('employeeId', link.employeeId.trim());
  return url.toString();
}

export function buildCustomSchemeBookUrl(
  link: Pick<
    DeferredInstallLink,
    'slug' | 'serviceId' | 'installSource' | 'campaign' | 'date' | 'slot' | 'employeeId'
  >,
): string {
  const url = new URL(`optischedule://book/${link.slug}`);
  if (link.serviceId?.trim()) url.searchParams.set('serviceId', link.serviceId.trim());
  if (link.installSource) url.searchParams.set('src', link.installSource);
  if (link.campaign?.trim()) url.searchParams.set('utm_campaign', link.campaign.trim());
  if (link.date?.trim()) url.searchParams.set('date', link.date.trim().slice(0, 10));
  if (link.slot?.trim()) url.searchParams.set('slot', link.slot.trim());
  if (link.employeeId?.trim()) url.searchParams.set('employeeId', link.employeeId.trim());
  return url.toString();
}

export function saveDeferredInstallLink(
  link: Omit<DeferredInstallLink, 'capturedAt'> & { capturedAt?: string },
): void {
  if (typeof localStorage === 'undefined' || !isValidTenantSlug(link.slug)) return;
  const payload: DeferredInstallLink = {
    slug: link.slug.toLowerCase(),
    serviceId: link.serviceId?.trim() || undefined,
    installSource: link.installSource,
    campaign: link.campaign?.trim() || undefined,
    date: link.date?.trim().slice(0, 10) || undefined,
    slot: link.slot?.trim() || undefined,
    employeeId: link.employeeId?.trim() || undefined,
    capturedAt: link.capturedAt ?? new Date().toISOString(),
  };
  localStorage.setItem(DEFERRED_INSTALL_KEY, JSON.stringify(payload));
  localStorage.setItem(LEGACY_DEFERRED_SLUG_KEY, payload.slug);
}

export function appendAttributionParams(storeUrl: string, link: DeferredInstallLink): string {
  const url = new URL(storeUrl);
  url.searchParams.set('slug', link.slug);
  if (link.serviceId) url.searchParams.set('serviceId', link.serviceId);
  if (link.date) url.searchParams.set('date', link.date);
  if (link.slot) url.searchParams.set('slot', link.slot);
  if (link.employeeId) url.searchParams.set('employeeId', link.employeeId);
  if (link.installSource) url.searchParams.set('src', link.installSource);
  if (link.campaign) url.searchParams.set('utm_campaign', link.campaign);
  return url.toString();
}

export function buildTenantAppInstallUrl(
  origin: string,
  slug: string,
  options?: {
    serviceId?: string;
    installSource?: InstallSource;
    campaign?: TenantAppInstallCampaign;
  },
): string {
  return buildAttributedBookUrl(origin, {
    slug,
    serviceId: options?.serviceId,
    installSource: options?.installSource ?? 'qr',
    campaign: options?.campaign ?? 'venue_qr',
  });
}
