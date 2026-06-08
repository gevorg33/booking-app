import type { ConsumerMobilePlatform } from './consumer-app-platform';
import type { DeferredInstallLink, InstallSource } from './deferred-install-link.util';
import {
  appendAttributionParams,
  buildAttributedBookUrl,
  buildCustomSchemeBookUrl,
} from './deferred-install-link.util';
import { buildOpenInAppUrlSequence } from './consumer-app-link.util';

export function buildConsumerAppBannerDismissKey(slug: string): string {
  return `consumer_banner_dismiss_${slug}`;
}

export function buildDeferredLinkForBanner(input: {
  slug: string;
  serviceId?: string;
  date?: string;
  slot?: string;
  employeeId?: string;
  installSource?: InstallSource;
  capturedAt?: string;
}): DeferredInstallLink {
  return {
    slug: input.slug,
    serviceId: input.serviceId?.trim() || undefined,
    date: input.date?.trim().slice(0, 10) || undefined,
    slot: input.slot?.trim() || undefined,
    employeeId: input.employeeId?.trim() || undefined,
    installSource: input.installSource ?? 'web_banner',
    campaign: 'public_booking_banner',
    capturedAt: input.capturedAt ?? new Date().toISOString(),
  };
}

export function resolvePublicBookingDeferredInstallFields(
  params: Record<string, string | null | undefined>,
): Pick<DeferredInstallLink, 'serviceId' | 'date' | 'slot' | 'employeeId'> {
  return {
    serviceId: resolvePublicBookingBannerServiceId(params),
    date: params.date?.trim().slice(0, 10) || undefined,
    slot: params.slot?.trim() || undefined,
    employeeId: params.employeeId?.trim() || undefined,
  };
}

export function resolvePublicBookingBannerServiceId(
  params: Record<string, string | null | undefined>,
): string | undefined {
  const serviceId = params.serviceId?.trim();
  if (serviceId) return serviceId;

  const services = params.services?.trim();
  if (!services) return undefined;

  const first = services
    .split(',')
    .map((entry) => entry.trim())
    .find(Boolean);
  return first || undefined;
}

export function resolveConsumerAppBannerStoreButtons(
  platform: ConsumerMobilePlatform,
  iosStoreUrl: string,
  androidStoreUrl: string,
): { showIosDownload: boolean; showAndroidDownload: boolean } {
  const hasIos = Boolean(iosStoreUrl.trim());
  const hasAndroid = Boolean(androidStoreUrl.trim());

  if (platform === 'ios') {
    return { showIosDownload: hasIos, showAndroidDownload: false };
  }
  if (platform === 'android') {
    return { showIosDownload: false, showAndroidDownload: hasAndroid };
  }
  return {
    showIosDownload: hasIos,
    showAndroidDownload: hasAndroid,
  };
}

export function buildConsumerAppBannerOpenInAppUrls(
  webOrigin: string,
  link: Pick<DeferredInstallLink, 'slug' | 'serviceId' | 'installSource' | 'campaign'>,
): { universalUrl: string; customSchemeUrl: string; webFallbackUrl: string } {
  const universalUrl = buildAttributedBookUrl(webOrigin, link);
  const customSchemeUrl = buildCustomSchemeBookUrl(link);
  const sequence = buildOpenInAppUrlSequence(webOrigin, universalUrl, customSchemeUrl);
  return {
    universalUrl: sequence.primary,
    customSchemeUrl: sequence.fallback,
    webFallbackUrl: sequence.webFallback,
  };
}

export function buildConsumerAppBannerStoreUrl(
  storeUrl: string,
  link: DeferredInstallLink,
): string {
  return appendAttributionParams(storeUrl, link);
}
