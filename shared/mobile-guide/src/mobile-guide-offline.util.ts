import type {
  MobileGuideBundle,
  MobileGuideLocale,
  MobileGuideOfflineManifest,
} from './mobile-guide.types.ts';
import { assertMobileGuideCatalogIntegrity, assertMobileGuideI18nCoverage } from './mobile-guide.resolve.util.ts';

const OFFLINE_GUIDE_LOCALES: readonly MobileGuideLocale[] = ['en', 'hy', 'ru'];

export { OFFLINE_GUIDE_LOCALES };

export function resolveEmbeddedMobileGuideAppVersion(
  envVersion?: string | null,
  fallback = '0.1.0',
): string {
  const trimmed = envVersion?.trim();
  return trimmed || fallback;
}

export function isMobileGuideOfflineBundleFresh(
  manifest: MobileGuideOfflineManifest,
  appVersion: string,
): boolean {
  return manifest.appVersion === appVersion.trim();
}

export function assertMobileGuideOfflineManifestShape(
  manifest: MobileGuideOfflineManifest,
): void {
  if (manifest.surface !== 'customer' && manifest.surface !== 'provider') {
    throw new Error(`invalid mobile guide surface: ${manifest.surface}`);
  }
  if (!manifest.appVersion.trim()) {
    throw new Error('mobile guide offline manifest missing appVersion');
  }
  if (!manifest.corpusRevision.trim()) {
    throw new Error('mobile guide offline manifest missing corpusRevision');
  }
  if (!manifest.syncedAt.trim()) {
    throw new Error('mobile guide offline manifest missing syncedAt');
  }
  if (manifest.playbookCount < 1) {
    throw new Error('mobile guide offline manifest playbookCount must be >= 1');
  }
  if (manifest.overlayCount < 1) {
    throw new Error('mobile guide offline manifest overlayCount must be >= 1');
  }
  for (const locale of OFFLINE_GUIDE_LOCALES) {
    if (!manifest.locales.includes(locale)) {
      throw new Error(`mobile guide offline manifest missing locale ${locale}`);
    }
  }
}

export function assertMobileGuideOfflineBundle(input: {
  manifest: MobileGuideOfflineManifest;
  bundle: MobileGuideBundle;
  appVersion?: string;
}): void {
  const { manifest, bundle, appVersion } = input;
  assertMobileGuideOfflineManifestShape(manifest);

  if (manifest.surface !== bundle.surface) {
    throw new Error(
      `mobile guide offline surface mismatch: manifest=${manifest.surface} bundle=${bundle.surface}`,
    );
  }
  if (manifest.playbookCount !== bundle.playbooks.length) {
    throw new Error(
      `mobile guide offline playbookCount drift: manifest=${manifest.playbookCount} bundle=${bundle.playbooks.length}`,
    );
  }
  if (manifest.overlayCount !== bundle.overlays.length) {
    throw new Error(
      `mobile guide offline overlayCount drift: manifest=${manifest.overlayCount} bundle=${bundle.overlays.length}`,
    );
  }

  if (appVersion && !isMobileGuideOfflineBundleFresh(manifest, appVersion)) {
    throw new Error(
      `mobile guide offline bundle stale for app ${appVersion} (manifest ${manifest.appVersion}) — run sync:mobile-guide-flows`,
    );
  }

  assertMobileGuideCatalogIntegrity(bundle);
  for (const locale of OFFLINE_GUIDE_LOCALES) {
    assertMobileGuideI18nCoverage(bundle, locale);
  }
}
