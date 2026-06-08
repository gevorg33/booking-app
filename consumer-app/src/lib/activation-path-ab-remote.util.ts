import { resolveAppAnalyticsPlatform } from './app-analytics-context.util.js';
import {
  cacheActivationPathPromoted,
  parseActivationPathPromotedFromConfig,
  readCachedActivationPathPromoted,
  type ActivationPathVariants,
} from './activation-path-ab.util.js';
import { fetchMobileAppConfig } from '../services/public-api.js';

let remoteLoadPromise: Promise<Partial<ActivationPathVariants>> | null = null;

export async function loadActivationPathPromotedFromRemote(): Promise<
  Partial<ActivationPathVariants>
> {
  const cached = readCachedActivationPathPromoted();
  if (cached) return cached;

  if (!remoteLoadPromise) {
    remoteLoadPromise = (async () => {
      try {
        const config = await fetchMobileAppConfig({
          surface: 'consumer_app',
          platform: resolveAppAnalyticsPlatform(),
        });
        const promoted = parseActivationPathPromotedFromConfig(config);
        cacheActivationPathPromoted(promoted);
        return promoted;
      } catch {
        return {};
      }
    })();
  }

  return remoteLoadPromise;
}

export function resetActivationPathRemoteCacheForTests(): void {
  remoteLoadPromise = null;
}
