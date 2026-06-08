/** adopt-6.1 — server-side referral_converted events for K-factor. */

import {
  hashAnonIdSeed,
  type AppEventRecordPayload,
} from './app-adoption-analytics.util.js';

export function buildServerReferralConvertedEvent(input: {
  businessId: string;
  tenantSlug: string;
  bookingId: string;
  referrerCustomerId: string;
  refereeCustomerId: string;
  referralCode?: string | null;
}): AppEventRecordPayload {
  return {
    businessId: input.businessId,
    anonId: hashAnonIdSeed(`referral-converted:${input.refereeCustomerId}`),
    event: 'referral_converted',
    platform: 'web',
    appSurface: 'public_web',
    appVersion: null,
    locale: 'en',
    tenantSlug: input.tenantSlug,
    sessionId: null,
    startType: null,
    userType: null,
    props: {
      bookingId: input.bookingId,
      referrerCustomerId: input.referrerCustomerId,
      ...(input.referralCode?.trim()
        ? { referralCode: input.referralCode.trim().toUpperCase() }
        : {}),
      source: 'server',
    },
  };
}
