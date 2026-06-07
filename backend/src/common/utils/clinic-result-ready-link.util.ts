import { resolveFrontendBaseUrl } from '../../modules/gift-cards/gift-card-delivery-content.util.js';

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
): ClinicResultReadyLinks | null {
  if (!businessSlug?.trim()) return null;
  const base = resolveFrontendBaseUrl(frontendUrl);
  const slug = businessSlug.trim();
  return {
    webResultsUrl: `${base}/book/${slug}/account?section=results`,
    consumerAppUrl: `optischedule://book/${slug}/results`,
    consumerWebUrl: `${base}/s/${slug}/results`,
  };
}
