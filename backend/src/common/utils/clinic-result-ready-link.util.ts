import { resolveFrontendBaseUrl } from '../../modules/gift-cards/gift-card-delivery-content.util.js';
import { buildTenantPublicUrl } from './tenant-public-url.util.js';

export interface ClinicResultReadyLinks {
  /** Public web account deep link — scrolls to My results. */
  webResultsUrl: string;
  /** Consumer app custom scheme (adopt-4.2). */
  consumerAppUrl: string;
  /** Consumer in-app web route (/s/{slug}/results). */
  consumerWebUrl: string;
}

export function buildClinicResultReadyLinks(
  businessSlug: string | null | undefined,
  frontendUrl?: string | null,
  rootDomain?: string,
): ClinicResultReadyLinks | null {
  if (!businessSlug?.trim()) return null;
  const slug = businessSlug.trim();
  const base = resolveFrontendBaseUrl(frontendUrl);
  return {
    webResultsUrl: buildTenantPublicUrl({
      slug,
      frontendUrl,
      rootDomain,
      pathSuffix: '/account',
      query: { section: 'results' },
    }),
    consumerAppUrl: `optischedule://book/${slug}/results`,
    consumerWebUrl: `${base}/s/${slug}/results`,
  };
}
