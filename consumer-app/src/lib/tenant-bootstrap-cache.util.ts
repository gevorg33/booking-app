import {
  extractApiErrorMessage,
  formatFriendlyNetworkError,
  getHttpErrorStatus,
} from './consumer-network-ux.util.js';

/**
 * e2e-bug.23 — after a failed live profile fetch, keep showing store/localStorage
 * data and treat it as unverified (fromCache banner), including when Zustand already
 * had a "ready" profile from earlier in the session.
 */
export function resolveTenantBootstrapFetchFailure(input: {
  storeReady: boolean;
  hasCachedEnabledProfile: boolean;
}): {
  keepShowingProfile: boolean;
  /** Always true when we keep showing after a failed live refresh. */
  fromCache: boolean;
  /** Hydrate Zustand from localStorage when the in-memory store is empty. */
  hydrateFromCache: boolean;
} {
  const keepShowingProfile =
    input.storeReady || input.hasCachedEnabledProfile;
  return {
    keepShowingProfile,
    fromCache: keepShowingProfile,
    hydrateFromCache: !input.storeReady && input.hasCachedEnabledProfile,
  };
}

const SALON_MISSING_RE = /\b(business|salon|tenant)\b.*\bnot found\b|\bnot found\b.*\b(business|salon|tenant)\b/i;

/**
 * e2e-bug.20 — never show raw axios "Request failed with status code 404" (or Nest
 * "Business not found") when the customer mistypes a salon code.
 */
export function resolveTenantBootstrapErrorMessage(
  error: unknown,
  copy: { salonNotFound: string },
): string {
  const status = getHttpErrorStatus(error);
  if (status === 404) return copy.salonNotFound;

  const apiMessage = extractApiErrorMessage(error);
  if (apiMessage && SALON_MISSING_RE.test(apiMessage)) {
    return copy.salonNotFound;
  }

  return formatFriendlyNetworkError(error, copy.salonNotFound);
}
