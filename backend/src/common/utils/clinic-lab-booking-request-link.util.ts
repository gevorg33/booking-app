import { resolveFrontendBaseUrl } from '../../modules/gift-cards/gift-card-delivery-content.util.js';

export interface ClinicLabBookingRequestLinks {
  /** Public web account deep link — scrolls to Lab appointments to book. */
  webAccountUrl: string;
  /** Consumer app custom scheme (adopt-4.2 / vert-clinic-2.2.13). */
  consumerAppUrl: string;
  /** Consumer in-app web route (/s/{slug}/lab-requests or /results). */
  consumerWebUrl: string;
}

export function buildClinicLabBookingRequestLinks(
  businessSlug: string | null | undefined,
  frontendUrl?: string | null,
  options?: {
    collectionServiceId?: string | null;
    clinicOrderToken?: string | null;
  },
): ClinicLabBookingRequestLinks | null {
  if (!businessSlug?.trim()) return null;
  const base = resolveFrontendBaseUrl(frontendUrl);
  const slug = businessSlug.trim();

  const params = new URLSearchParams();
  if (options?.collectionServiceId?.trim()) {
    params.set('serviceId', options.collectionServiceId.trim());
  }
  if (options?.clinicOrderToken?.trim()) {
    params.set('clinicOrderToken', options.clinicOrderToken.trim());
  }
  const query = params.toString();
  const consumerAppBase = `optischedule://book/${slug}/lab-requests`;
  const consumerAppUrl = query
    ? `${consumerAppBase}?${query}`
    : consumerAppBase;

  return {
    webAccountUrl: `${base}/book/${slug}/account?section=lab-requests`,
    consumerAppUrl,
    consumerWebUrl: query
      ? `${base}/s/${slug}/lab-requests?${query}`
      : `${base}/s/${slug}/results`,
  };
}
