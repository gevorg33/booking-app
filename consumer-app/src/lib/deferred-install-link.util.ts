import { buildSalonPath, isValidSlug, parseTenantSlugFromUrl } from './deep-link.js';
import {
  normalizeDeferredBookingFields,
  resolveDeferredInstallNavigationPath,
} from './deferred-install-resume.util.js';

export type InstallSource = 'web_banner' | 'qr' | 'referral' | 'ad' | 'link' | 'share' | 'unknown';

export interface DeferredInstallLink {
  slug: string;
  serviceId?: string;
  referralCode?: string;
  installSource?: InstallSource;
  campaign?: string;
  /** YYYY-MM-DD — web selection preserved for post-install resume (n99-3.1). */
  date?: string;
  /** ISO startTime — lands on confirm without re-search (n99-3.1). */
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

  if (utmMedium === 'cpc' || utmMedium === 'paid' || utmMedium === 'paid_social') {
    return 'ad';
  }
  if (utmSource === 'qr') return 'qr';
  if (utmSource === 'referral' || utmSource === 'invite') return 'referral';
  if (utmSource === 'ad' || utmSource === 'facebook' || utmSource === 'instagram') {
    return 'ad';
  }

  return undefined;
}

function normalizeReferralCodeParam(raw: string | null): string | undefined {
  const code = raw?.trim().toUpperCase();
  if (!code || code.length < 4 || code.length > 16) return undefined;
  if (!/^[A-Z0-9]+$/.test(code)) return undefined;
  return code;
}

export function buildAttributedBookUrl(
  origin: string,
  link: Pick<
    DeferredInstallLink,
    'slug' | 'serviceId' | 'installSource' | 'campaign' | 'date' | 'slot' | 'employeeId'
  >,
): string {
  const base = origin.replace(/\/$/, '');
  const url = new URL(`${base}/book/${link.slug}`);
  if (link.serviceId?.trim()) url.searchParams.set('serviceId', link.serviceId.trim());
  if (link.referralCode?.trim()) url.searchParams.set('ref', link.referralCode.trim());
  if (link.installSource) url.searchParams.set('src', link.installSource);
  if (link.campaign?.trim()) url.searchParams.set('utm_campaign', link.campaign.trim());
  if (link.date?.trim()) url.searchParams.set('date', link.date.trim().slice(0, 10));
  if (link.slot?.trim()) url.searchParams.set('slot', link.slot.trim());
  if (link.employeeId?.trim()) url.searchParams.set('employeeId', link.employeeId.trim());
  return url.toString();
}

export function parseDeferredInstallFromUrl(raw: string): DeferredInstallLink | null {
  const slug = parseTenantSlugFromUrl(raw);
  if (!slug) return null;

  try {
    const url = raw.includes('://') ? new URL(raw) : new URL(raw, 'https://local.invalid');
    const referralCode = normalizeReferralCodeParam(url.searchParams.get('ref'));
    const bookingFields = normalizeDeferredBookingFields({
      date: url.searchParams.get('date'),
      slot: url.searchParams.get('slot'),
      employeeId: url.searchParams.get('employeeId'),
    });
    return {
      slug,
      serviceId: url.searchParams.get('serviceId')?.trim() || undefined,
      referralCode,
      installSource: parseInstallAttributionFromParams({
        src: url.searchParams.get('src'),
        ref: url.searchParams.get('ref'),
        utm_source: url.searchParams.get('utm_source'),
        utm_medium: url.searchParams.get('utm_medium'),
      }),
      campaign: url.searchParams.get('utm_campaign')?.trim() || undefined,
      ...bookingFields,
      capturedAt: new Date().toISOString(),
    };
  } catch {
    return { slug, capturedAt: new Date().toISOString() };
  }
}

export function saveDeferredInstallLink(
  link: Omit<DeferredInstallLink, 'capturedAt'> & { capturedAt?: string },
): void {
  if (typeof localStorage === 'undefined' || !isValidSlug(link.slug)) return;
  const payload: DeferredInstallLink = {
    slug: link.slug.toLowerCase(),
    serviceId: link.serviceId?.trim() || undefined,
    referralCode: link.referralCode?.trim().toUpperCase() || undefined,
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

export function peekDeferredInstallLink(): DeferredInstallLink | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(DEFERRED_INSTALL_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as DeferredInstallLink;
      if (parsed?.slug && isValidSlug(parsed.slug)) return parsed;
    } catch {
      /* fall through */
    }
  }
  const legacySlug = localStorage.getItem(LEGACY_DEFERRED_SLUG_KEY);
  if (legacySlug && isValidSlug(legacySlug)) {
    return { slug: legacySlug, capturedAt: new Date().toISOString() };
  }
  return null;
}

export function consumeDeferredInstallLink(): DeferredInstallLink | null {
  const link = peekDeferredInstallLink();
  if (!link || typeof localStorage === 'undefined') return null;
  localStorage.removeItem(DEFERRED_INSTALL_KEY);
  localStorage.removeItem(LEGACY_DEFERRED_SLUG_KEY);
  return link;
}

export function resolveDeferredNavigationPath(link: DeferredInstallLink): string {
  return resolveDeferredInstallNavigationPath(link);
}

export function buildInstallAttributionProps(
  link: DeferredInstallLink | null,
): Record<string, string | boolean> | undefined {
  if (!link) return undefined;
  const props: Record<string, string | boolean> = {
    intentQualified: true,
  };
  if (link.installSource) props.installSource = link.installSource;
  if (link.serviceId) props.serviceId = link.serviceId;
  if (link.date) props.date = link.date;
  if (link.slot) props.slot = link.slot;
  if (link.employeeId) props.employeeId = link.employeeId;
  if (link.referralCode) props.referralCode = link.referralCode;
  if (link.campaign) props.campaign = link.campaign;
  return props;
}
