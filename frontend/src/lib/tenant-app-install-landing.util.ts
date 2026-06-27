export type TenantAppInstallCampaign = 'venue_qr' | 'confirmation_qr' | 'receipt_qr';

export function buildTenantAppInstallLandingPath(slug: string): string {
  return `/get-app/${slug.trim().toLowerCase()}`;
}

export function buildTenantAppInstallLandingUrl(
  origin: string,
  slug: string,
  options?: {
    campaign?: TenantAppInstallCampaign;
    installSource?: string;
    serviceId?: string;
  },
): string {
  const base = origin.replace(/\/$/, '');
  const url = new URL(`${base}${buildTenantAppInstallLandingPath(slug)}`);
  url.searchParams.set('src', options?.installSource ?? 'qr');
  url.searchParams.set('utm_campaign', options?.campaign ?? 'venue_qr');
  if (options?.serviceId?.trim()) {
    url.searchParams.set('serviceId', options.serviceId.trim());
  }
  return url.toString();
}

export function appendStoreSlugParam(storeUrl: string, slug: string): string {
  const param = `slug=${encodeURIComponent(slug.trim().toLowerCase())}`;
  return storeUrl.includes('?') ? `${storeUrl}&${param}` : `${storeUrl}?${param}`;
}

export function resolveTenantAppInstallRedirect(
  platform: 'ios' | 'android' | 'other',
  input: {
    slug: string;
    iosStoreUrl: string;
    androidStoreUrl: string;
    customSchemeUrl: string;
  },
): { primary: string; fallback?: string } | null {
  const slug = input.slug.trim().toLowerCase();
  if (platform === 'ios' && input.iosStoreUrl) {
    return {
      primary: input.customSchemeUrl,
      fallback: appendStoreSlugParam(input.iosStoreUrl, slug),
    };
  }
  if (platform === 'android' && input.androidStoreUrl) {
    return {
      primary: input.customSchemeUrl,
      fallback: appendStoreSlugParam(input.androidStoreUrl, slug),
    };
  }
  return null;
}
