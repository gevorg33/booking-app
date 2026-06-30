import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GuideFlowSurface } from './guide-flow.types.js';
import { matchGuideFlowRoute, mergeGuideFlowPlaybooks } from './guide-flow.merge.util.js';
import {
  CONSUMER_MOBILE_APP_NO_GUIDE_ROUTE_PATTERNS,
  PROVIDER_MOBILE_APP_NO_GUIDE_ROUTE_PATTERNS,
  resolveGuideFlowRoutePrimaryTopic,
} from './guide-flow.routes.manifest.js';

const REPO_ROOT = join(__dirname, '../../../../..');

export const CONSUMER_MOBILE_APP_PATH = join(REPO_ROOT, 'consumer-app/src/App.tsx');
export const PROVIDER_MOBILE_APP_PATH = join(REPO_ROOT, 'provider-app/src/App.tsx');

/** Parse `<Route … path="…">` entries from Ionic App.tsx source. */
export function parseMobileAppRoutePaths(appSource: string): string[] {
  const paths = new Set<string>();
  for (const match of appSource.matchAll(/\bpath=(["'])([^"']+)\1/g)) {
    paths.add(match[2]);
  }
  return [...paths].sort();
}

export function normalizeConsumerAppRoutePath(routePath: string): string {
  if (routePath === '/') return '/';
  return routePath.replace(/^\/s\/:[^/]+/, '/s').replace(/\/:[^/]+/g, '');
}

export function normalizeProviderAppRoutePath(routePath: string): string {
  return routePath.replace(/\/:[^/]+(?:\/:[^/]+)*$/g, '');
}

export function isConsumerMobileGuideRelevantRoute(routePath: string): boolean {
  return routePath === '/' || routePath.startsWith('/s/:slug') || routePath.startsWith('/s/');
}

export function isProviderMobileTabsRoute(routePath: string): boolean {
  return routePath.startsWith('/tabs');
}

export function isConsumerMobileAppNoGuideRoute(routePath: string): boolean {
  return CONSUMER_MOBILE_APP_NO_GUIDE_ROUTE_PATTERNS.some((pattern) => pattern.test(routePath));
}

export function isProviderMobileAppNoGuideRoute(routePath: string): boolean {
  return PROVIDER_MOBILE_APP_NO_GUIDE_ROUTE_PATTERNS.some((pattern) => pattern.test(routePath));
}

/** Map normalized consumer App.tsx path to canonical guide-flow route prefix. */
export function mapConsumerAppRouteToGuideFlowRoute(normalizedPath: string): string {
  if (normalizedPath === '/') return '/consumer/welcome';
  if (normalizedPath.includes('/login') || normalizedPath.includes('/guide')) {
    return normalizedPath;
  }
  if (normalizedPath.includes('/manage') || normalizedPath.includes('/profile')) {
    return '/s/account';
  }
  if (normalizedPath.includes('/results')) return '/s/results';
  if (normalizedPath.includes('/lab-')) return '/s/lab-requests';
  if (normalizedPath.includes('/packages') || normalizedPath.includes('/gift-cards')) {
    return '/s/packages';
  }
  if (normalizedPath.includes('/account')) return '/s/account';
  if (normalizedPath.endsWith('/services')) return '/s/services';
  if (normalizedPath === '/s' || normalizedPath.endsWith('/home')) return '/s';
  if (
    normalizedPath.includes('/book') ||
    normalizedPath.includes('/professionals') ||
    normalizedPath.includes('/providers')
  ) {
    return '/s/book';
  }
  return normalizedPath;
}

function assertRouteHasGuidePlaybook(surface: GuideFlowSurface, route: string): void {
  const topicId = resolveGuideFlowRoutePrimaryTopic(route);
  if (!topicId) {
    throw new Error(`Missing guide primary topic for ${surface} mobile route ${route}`);
  }

  const playbooks = mergeGuideFlowPlaybooks({
    surface,
    route,
    vertical: 'clinic',
    retailPosEnabled: true,
    enabledModules: ['giftCards'],
    planTierId: 'business',
    role: 'owner',
    roleProfile: surface === 'provider' ? 'owner' : 'customer',
  });
  const playbook = playbooks.find((row) => row.topicId === topicId);
  if (!playbook || !matchGuideFlowRoute(route, playbook)) {
    throw new Error(
      `Missing guide-flow playbook for ${surface} mobile route ${route} -> ${topicId}`,
    );
  }
}

export function listConsumerMobileAppGuideRoutes(appSource: string): string[] {
  return parseMobileAppRoutePaths(appSource)
    .filter(isConsumerMobileGuideRelevantRoute)
    .filter((routePath) => !isConsumerMobileAppNoGuideRoute(routePath));
}

export function listProviderMobileAppGuideRoutes(appSource: string): string[] {
  return parseMobileAppRoutePaths(appSource)
    .filter(isProviderMobileTabsRoute)
    .filter((routePath) => !isProviderMobileAppNoGuideRoute(routePath));
}

export function assertMobileGuideAppRouteCoverage(options?: {
  consumerAppSource?: string;
  providerAppSource?: string;
}): void {
  const consumerSource =
    options?.consumerAppSource ?? readFileSync(CONSUMER_MOBILE_APP_PATH, 'utf8');
  const providerSource =
    options?.providerAppSource ?? readFileSync(PROVIDER_MOBILE_APP_PATH, 'utf8');

  for (const routePath of listConsumerMobileAppGuideRoutes(consumerSource)) {
    const guideRoute = mapConsumerAppRouteToGuideFlowRoute(
      normalizeConsumerAppRoutePath(routePath),
    );
    assertRouteHasGuidePlaybook('customer', guideRoute);
  }

  for (const routePath of listProviderMobileAppGuideRoutes(providerSource)) {
    const guideRoute = normalizeProviderAppRoutePath(routePath);
    assertRouteHasGuidePlaybook('provider', guideRoute);
  }
}
