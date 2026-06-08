import {
  buildAppleAppSiteAssociation,
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
  const body = buildAppleAppSiteAssociation({
    appleTeamId: config?.appleTeamId ?? 'TEAMID',
    iosBundleId: config?.iosBundleId ?? 'com.optischedule.consumer',
  });
  return jsonResponse(body);
}
