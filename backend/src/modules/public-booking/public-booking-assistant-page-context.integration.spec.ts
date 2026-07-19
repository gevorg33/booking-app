import { E2E106_PUBLIC_PAGE_CONTEXT_SCENARIOS } from '../ai/ai-e2e106-public-page-context.fixtures.js';
import { rescueManageBookingWithTokenIntent } from '../ai/ai-manage-booking-with-token.util.js';
import { PUBLIC_INTENTS } from '../ai/ai-command-registry.build.js';
import { buildPublicClassifierSchema } from './public-booking-classifier.schema.js';
import {
  mapPublicBookingGuideRoute,
  parseBookingPathToGuideRoute,
  PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES,
} from '../ai/ai-public-booking-guide.util.js';

describe('public booking assistant page context (e2e-bug.106)', () => {
  it('registers guest with_token intents on public surface + classifier schema', () => {
    for (const action of [
      'cancel_booking_with_token',
      'reschedule_booking_with_token',
      'explain_manage_booking_context',
      'cancel_package_visit_with_token',
      'reschedule_package_visit_with_token',
    ] as const) {
      expect(PUBLIC_INTENTS).toContain(action);
      expect(buildPublicClassifierSchema()).toContain(action);
    }
  });

  it.each(
    E2E106_PUBLIC_PAGE_CONTEXT_SCENARIOS.map((row) => [row.id, row] as const),
  )('rescues manage page context for %s', (_id, row) => {
    const rescued = rescueManageBookingWithTokenIntent(
      row.prompt,
      row.misclassifiedAction,
      row.session,
    );
    if (row.expectedAction === null) {
      expect(rescued).toBeNull();
      return;
    }
    expect(rescued?.action).toBe(row.expectedAction);
  });

  it.each([
    {
      id: 'manage-path',
      pathname: '/book/demo/manage',
      route: PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.overview,
    },
    {
      id: 'manage-step',
      context: { bookingStep: 'manage', pathname: '/book/demo/manage' },
      route: PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.overview,
    },
    {
      id: 'multi-availability-path',
      pathname: '/book/demo/multi/availability',
      route: PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.overview,
    },
    {
      id: 'bare-landing',
      pathname: '/book/demo',
      route: PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.overview,
    },
    {
      id: 'checkout-still-checkout',
      pathname: '/book/demo/checkout',
      route: PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.checkout,
    },
  ])('guide route mapping for $id', (row) => {
    if ('pathname' in row && row.pathname) {
      expect(parseBookingPathToGuideRoute(row.pathname)).toBe(row.route);
      expect(mapPublicBookingGuideRoute({ screen: row.pathname })).toBe(
        row.route,
      );
    }
    if ('context' in row && row.context) {
      expect(mapPublicBookingGuideRoute(row.context)).toBe(row.route);
    }
  });
});
