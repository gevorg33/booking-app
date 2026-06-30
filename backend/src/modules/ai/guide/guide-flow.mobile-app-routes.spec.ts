import { readFileSync } from 'node:fs';
import {
  CONSUMER_MOBILE_APP_PATH,
  PROVIDER_MOBILE_APP_PATH,
  assertMobileGuideAppRouteCoverage,
  listConsumerMobileAppGuideRoutes,
  listProviderMobileAppGuideRoutes,
  mapConsumerAppRouteToGuideFlowRoute,
  normalizeConsumerAppRoutePath,
  normalizeProviderAppRoutePath,
  parseMobileAppRoutePaths,
} from './guide-flow.mobile-app-routes.util.js';
import {
  CONSUMER_MOBILE_APP_NO_GUIDE_ROUTE_PATTERNS,
  PROVIDER_MOBILE_APP_NO_GUIDE_ROUTE_PATTERNS,
} from './guide-flow.routes.manifest.js';

describe('guide-flow mobile App.tsx route coverage (ai-guide-1.9.13)', () => {
  const consumerSource = readFileSync(CONSUMER_MOBILE_APP_PATH, 'utf8');
  const providerSource = readFileSync(PROVIDER_MOBILE_APP_PATH, 'utf8');

  it('indexes consumer tab and booking routes from App.tsx', () => {
    const routes = listConsumerMobileAppGuideRoutes(consumerSource);
    expect(routes).toContain('/s/:slug/home');
    expect(routes).toContain('/s/:slug/book/:serviceId');
    expect(routes).toContain('/s/:slug/account');
    expect(routes).toContain('/s/:slug/results');
    expect(routes.length).toBeGreaterThanOrEqual(20);
  });

  it('indexes provider /tabs/* routes from App.tsx', () => {
    const routes = listProviderMobileAppGuideRoutes(providerSource);
    expect(routes).toContain('/tabs/today');
    expect(routes).toContain('/tabs/clinic-tasks');
    expect(routes).toContain('/tabs/patients/:customerId');
    expect(routes).not.toContain('/tabs/notifications');
    expect(routes).not.toContain('/tabs/profile/guide');
  });

  it('maps consumer App.tsx paths to canonical guide-flow routes', () => {
    expect(
      mapConsumerAppRouteToGuideFlowRoute(normalizeConsumerAppRoutePath('/s/:slug/home')),
    ).toBe('/s');
    expect(
      mapConsumerAppRouteToGuideFlowRoute(normalizeConsumerAppRoutePath('/s/:slug/services')),
    ).toBe('/s/services');
    expect(
      mapConsumerAppRouteToGuideFlowRoute(
        normalizeConsumerAppRoutePath('/s/:slug/book/:serviceId'),
      ),
    ).toBe('/s/book');
    expect(
      mapConsumerAppRouteToGuideFlowRoute(normalizeConsumerAppRoutePath('/s/:slug/results')),
    ).toBe('/s/results');
  });

  it('normalizes provider patient chart route to patients tab guide route', () => {
    expect(normalizeProviderAppRoutePath('/tabs/patients/:customerId')).toBe('/tabs/patients');
  });

  it('covers every consumer tab/booking route and provider /tabs/* route', () => {
    expect(() => assertMobileGuideAppRouteCoverage()).not.toThrow();
  });

  it('documents explicit no-guide mobile routes', () => {
    const consumerPaths = parseMobileAppRoutePaths(consumerSource);
    const providerPaths = parseMobileAppRoutePaths(providerSource);

    for (const pattern of CONSUMER_MOBILE_APP_NO_GUIDE_ROUTE_PATTERNS) {
      expect(consumerPaths.some((route) => pattern.test(route))).toBe(true);
    }
    for (const pattern of PROVIDER_MOBILE_APP_NO_GUIDE_ROUTE_PATTERNS) {
      expect(providerPaths.some((route) => pattern.test(route))).toBe(true);
    }
  });
});
