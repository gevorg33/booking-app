import {
  buildAndroidAssetLinks,
  readConsumerAppLinkConfigFromEnv,
} from '@/lib/consumer-app-link.util';

export const dynamic = 'force-dynamic';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export function GET(): Response {
  const config = readConsumerAppLinkConfigFromEnv(process.env);
  const body = buildAndroidAssetLinks({
    androidPackageName: config?.androidPackageName ?? 'com.optischedule.consumer',
    androidSha256Fingerprints: config?.androidSha256Fingerprints ?? [
      'REPLACE_WITH_RELEASE_OR_DEBUG_SHA256_FINGERPRINT',
    ],
  });
  return jsonResponse(body);
}
