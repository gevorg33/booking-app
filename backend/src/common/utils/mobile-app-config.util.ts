/** adopt-5.5 — remote mobile app config (min version + kill switch). */

import {
  readPromotedActivationPathFromEnv,
  type N99ActivationPathVariants,
} from './n99-activation-path-ab.util.js';

export type MobileAppSurface = 'consumer_app' | 'provider_app';
export type MobileAppPlatform = 'ios' | 'android' | 'web';

export interface MobileAppConfigQuery {
  surface: MobileAppSurface;
  platform: MobileAppPlatform;
  version?: string;
}

export interface MobileAppConfigResponse {
  minSupportedVersion: string;
  latestVersion: string;
  updateRequired: boolean;
  killSwitch: boolean;
  message: string | null;
  storeUrl: string | null;
  activationPathAb?: Partial<N99ActivationPathVariants>;
}

function envKey(
  surface: MobileAppSurface,
  platform: MobileAppPlatform,
  suffix: string,
): string {
  const surfaceKey = surface === 'consumer_app' ? 'CONSUMER' : 'PROVIDER';
  const platformKey = platform.toUpperCase();
  return `MOBILE_${surfaceKey}_${platformKey}_${suffix}`;
}

function readEnv(name: string, fallback: string, env: NodeJS.ProcessEnv = process.env): string {
  return env[name]?.trim() || fallback;
}

function readBool(name: string, fallback = false, env: NodeJS.ProcessEnv = process.env): boolean {
  const raw = env[name]?.trim().toLowerCase();
  if (!raw) return fallback;
  return raw === '1' || raw === 'true' || raw === 'yes';
}

export function resolveMobileAppConfig(
  query: MobileAppConfigQuery,
  env: NodeJS.ProcessEnv = process.env,
): MobileAppConfigResponse {
  const minSupportedVersion = readEnv(
    envKey(query.surface, query.platform, 'MIN_VERSION'),
    '1.0.0',
    env,
  );
  const latestVersion = readEnv(
    envKey(query.surface, query.platform, 'LATEST_VERSION'),
    minSupportedVersion,
    env,
  );
  const killSwitch = readBool(envKey(query.surface, query.platform, 'KILL_SWITCH'), false, env);
  const updateRequired = readBool(
    envKey(query.surface, query.platform, 'UPDATE_REQUIRED'),
    false,
    env,
  );
  const message =
    env[envKey(query.surface, query.platform, 'MESSAGE')]?.trim() || null;
  const storeUrl =
    env[envKey(query.surface, query.platform, 'STORE_URL')]?.trim() || null;
  const envPromoted = readPromotedActivationPathFromEnv(env);
  const activationPathAb =
    Object.keys(envPromoted).length > 0 ? envPromoted : undefined;

  return {
    minSupportedVersion,
    latestVersion,
    updateRequired,
    killSwitch,
    message,
    storeUrl,
    activationPathAb,
  };
}
