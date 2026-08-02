/**
 * e2e-bug.331 — the public web booking assistant is dispatched through the
 * shared 'customer' AI gateway pipeline (PublicBookingController.assistant()
 * → AiGatewayService → CustomerAiCommandService), so guide-session resolution
 * always sees surface='customer' even on the public booking funnel. Its bare
 * `/book/services|professionals|checkout` screens then get mis-resolved by
 * the customer-app route mapper (which collapses anything containing
 * `/book(/|$|?)` into one generic `/s/book` bucket), leaking native-app
 * consumer-booking-flow content ("Pick a professional") into the public web
 * checkout/services pages instead of their real public-funnel step content.
 *
 * Two fixes were required:
 * 1. `resolveProductGuideSessionContext` (ai-product-guide-session.util.ts)
 *    now detects a bare `/book/...` screen under a nominal 'customer'
 *    surface and re-resolves both `surface` ('public') and `route` (via the
 *    public-funnel route parser, not the customer-app mapper) from the raw
 *    screen — even when a caller (e.g. dispatchCustomerAppGuideIntent)
 *    already pre-populated `context.route` with the customer mapper's
 *    generic '/s/book' value.
 * 2. `resolvePostFailureGuideSnippet` (ai-product-guide-failure-fallback.util.ts)
 *    now prefers a specific public-funnel step route (services/professionals/
 *    checkout) over a generic prompt-similarity match against the whole-
 *    funnel overview topic, so a vague "help me with this page" prompt on
 *    /book/checkout doesn't get bumped back to the funnel's step-1 overview.
 */

export type E2e331SessionContextCase = {
  id: string;
  context: Record<string, unknown>;
  surfaceHint: 'customer' | 'dashboard' | 'provider' | 'public';
  expectedSurface: string;
  expectedRoute: string | undefined;
};

export const E2E331_SESSION_CONTEXT_CASES: readonly E2e331SessionContextCase[] =
  [
    {
      id: 'checkout-screen-corrects-surface-and-route',
      context: { screen: '/book/checkout' },
      surfaceHint: 'customer',
      expectedSurface: 'public',
      expectedRoute: '/book/checkout',
    },
    {
      id: 'services-screen-corrects-surface-and-route',
      context: { screen: '/book/services' },
      surfaceHint: 'customer',
      expectedSurface: 'public',
      expectedRoute: '/book/services',
    },
    {
      id: 'professionals-screen-corrects-surface-and-route',
      context: { screen: '/book/professionals' },
      surfaceHint: 'customer',
      expectedSurface: 'public',
      expectedRoute: '/book/professionals',
    },
    {
      id: 'bare-book-overview-screen-corrects-surface',
      context: { screen: '/book' },
      surfaceHint: 'customer',
      expectedSurface: 'public',
      expectedRoute: '/book',
    },
    {
      id: 'pre-populated-customer-route-still-corrected',
      // Reproduces dispatchCustomerAppGuideIntent, which pre-computes
      // `route` via mapCustomerMobileGuideRoute (collapsing to '/s/book')
      // before calling resolveProductGuideSessionContext.
      context: { screen: '/book/checkout', route: '/s/book' },
      surfaceHint: 'customer',
      expectedSurface: 'public',
      expectedRoute: '/book/checkout',
    },
    {
      id: 'real-customer-app-booking-route-unaffected',
      context: { screen: '/s/book' },
      surfaceHint: 'customer',
      expectedSurface: 'customer',
      expectedRoute: '/s/book',
    },
    {
      id: 'bookings-list-screen-does-not-false-positive',
      context: { screen: '/bookings' },
      surfaceHint: 'customer',
      expectedSurface: 'customer',
      expectedRoute: '/s',
    },
    {
      id: 'dashboard-surface-unaffected-by-book-screen',
      context: { screen: '/book/checkout', route: '/dashboard/schedule' },
      surfaceHint: 'dashboard',
      expectedSurface: 'dashboard',
      expectedRoute: '/dashboard/schedule',
    },
    {
      id: 'provider-surface-unaffected-by-book-screen',
      context: { screen: '/book/checkout', mobileRoute: 'today' },
      surfaceHint: 'provider',
      expectedSurface: 'provider',
      expectedRoute: '/tabs/today',
    },
  ];

export type E2e331FallbackPrecedenceCase = {
  id: string;
  route: string;
  prompt: string;
  expectedTaskLabelContains: string;
};

/** resolvePostFailureGuideSnippet: specific step route beats generic scored funnel topic. */
export const E2E331_FALLBACK_PRECEDENCE_CASES: readonly E2e331FallbackPrecedenceCase[] =
  [
    {
      id: 'checkout-route-wins-over-generic-help-prompt',
      route: '/book/checkout',
      prompt: 'Help me with this page',
      expectedTaskLabelContains: 'checkout',
    },
    {
      id: 'services-route-wins-over-generic-help-prompt',
      route: '/book/services',
      prompt: 'Help me with this page',
      expectedTaskLabelContains: 'service',
    },
    {
      id: 'professionals-route-wins-over-generic-help-prompt',
      route: '/book/professionals',
      prompt: 'Help me with this page',
      expectedTaskLabelContains: 'professional',
    },
  ];
