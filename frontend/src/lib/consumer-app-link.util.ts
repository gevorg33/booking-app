export const CONSUMER_UNIVERSAL_LINK_PATHS = ['/book/*', '/s/*'] as const;

export interface ConsumerAppLinkConfig {
  appleTeamId: string;
  iosBundleId: string;
  androidPackageName: string;
  androidSha256Fingerprints: string[];
}

export interface AppleAppSiteAssociation {
  applinks: {
    apps: string[];
    details: Array<{
      appID: string;
      paths: string[];
    }>;
  };
}

export interface AndroidAssetLinkTarget {
  relation: string[];
  target: {
    namespace: 'android_app';
    package_name: string;
    sha256_cert_fingerprints: string[];
  };
}

const PLACEHOLDER_TEAM_IDS = new Set(['TEAMID', 'YOUR_TEAM_ID', '']);
const PLACEHOLDER_FINGERPRINTS = new Set([
  '',
  'REPLACE_WITH_RELEASE_OR_DEBUG_SHA256_FINGERPRINT',
]);

export function buildAppleAppSiteAssociation(
  config: Pick<ConsumerAppLinkConfig, 'appleTeamId' | 'iosBundleId'>,
  paths: readonly string[] = CONSUMER_UNIVERSAL_LINK_PATHS,
): AppleAppSiteAssociation {
  const bundleId = config.iosBundleId.trim() || 'com.optischedule.consumer';
  return {
    applinks: {
      apps: [],
      details: [
        {
          appID: `${config.appleTeamId.trim()}.${bundleId}`,
          paths: [...paths],
        },
      ],
    },
  };
}

export function buildAndroidAssetLinks(
  config: Pick<ConsumerAppLinkConfig, 'androidPackageName' | 'androidSha256Fingerprints'>,
): AndroidAssetLinkTarget[] {
  return [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: config.androidPackageName.trim() || 'com.optischedule.consumer',
        sha256_cert_fingerprints: config.androidSha256Fingerprints.map((entry) => entry.trim()).filter(Boolean),
      },
    },
  ];
}

export function readConsumerAppLinkConfigFromEnv(
  env: Record<string, string | undefined> = process.env,
): ConsumerAppLinkConfig | null {
  const appleTeamId =
    env.CONSUMER_APPLE_TEAM_ID?.trim() || env.APPLE_TEAM_ID?.trim() || '';
  if (!appleTeamId) return null;

  const fingerprints = (env.CONSUMER_ANDROID_SHA256_FINGERPRINTS ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  return {
    appleTeamId,
    iosBundleId: env.CONSUMER_IOS_BUNDLE_ID?.trim() || 'com.optischedule.consumer',
    androidPackageName:
      env.CONSUMER_ANDROID_PACKAGE?.trim() || 'com.optischedule.consumer',
    androidSha256Fingerprints: fingerprints,
  };
}

export function validateConsumerAppLinkConfig(config: ConsumerAppLinkConfig): string[] {
  const errors: string[] = [];
  if (PLACEHOLDER_TEAM_IDS.has(config.appleTeamId.trim())) {
    errors.push('appleTeamId is a placeholder');
  }
  if (!config.iosBundleId.trim()) {
    errors.push('iosBundleId is required');
  }
  if (!config.androidPackageName.trim()) {
    errors.push('androidPackageName is required');
  }
  if (config.androidSha256Fingerprints.length === 0) {
    errors.push('androidSha256Fingerprints is empty');
  }
  for (const fingerprint of config.androidSha256Fingerprints) {
    if (PLACEHOLDER_FINGERPRINTS.has(fingerprint.trim())) {
      errors.push('androidSha256Fingerprints contains a placeholder');
      break;
    }
  }
  return errors;
}

export function matchesUniversalLinkPath(
  pathname: string,
  patterns: readonly string[] = CONSUMER_UNIVERSAL_LINK_PATHS,
): boolean {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return patterns.some((pattern) => {
    if (pattern.endsWith('/*')) {
      return normalized.startsWith(pattern.slice(0, -1));
    }
    return normalized === pattern;
  });
}

/** Verified https URLs open the app when installed; otherwise the same URL loads public booking web. */
export function resolveUniversalLinkWebFallbackUrl(
  rawUrl: string,
  webOrigin?: string,
): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    if (trimmed.includes('://')) {
      const url = new URL(trimmed);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return matchesUniversalLinkPath(url.pathname) ? url.toString() : null;
      }
      if (url.protocol === 'optischedule:' && url.host === 'book') {
        const origin = webOrigin?.replace(/\/$/, '') || 'https://local.invalid';
        const slug = url.pathname.replace(/^\//, '').split('/')[0]?.trim();
        if (!slug) return null;
        const fallback = new URL(`${origin}/book/${slug}`);
        url.searchParams.forEach((value, key) => fallback.searchParams.set(key, value));
        return fallback.toString();
      }
      return null;
    }
    if (trimmed.startsWith('/')) {
      return matchesUniversalLinkPath(trimmed)
        ? new URL(trimmed, webOrigin?.replace(/\/$/, '') || 'https://local.invalid').toString()
        : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function buildOpenInAppUrlSequence(
  webOrigin: string,
  universalUrl: string,
  customSchemeUrl: string,
): { primary: string; fallback: string; webFallback: string } {
  return {
    primary: universalUrl,
    fallback: customSchemeUrl,
    webFallback: resolveUniversalLinkWebFallbackUrl(universalUrl, webOrigin) ?? universalUrl,
  };
}
