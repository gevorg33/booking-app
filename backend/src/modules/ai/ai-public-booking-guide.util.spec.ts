import { AiProductGuideService } from './ai-product-guide.service.js';
import { createMockGuideTelemetryService } from './guide/guide-telemetry.mock.js';
import {
  PUBLIC_BOOKING_CHECKOUT_STEP_SCENARIOS,
  PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES,
  PUBLIC_BOOKING_GUIDE_CLASSIFIER_SCENARIOS,
  PUBLIC_BOOKING_GUIDE_RESCUE_SCENARIOS,
  PUBLIC_BOOKING_GUIDE_ROUTE_SCENARIOS,
  derivePublicBookingStepFromPath,
  enrichPublicBookingGuideTopicFromPrompt,
  mapPublicBookingGuideRoute,
  mergePublicBookingGuideContext,
  parseBookingPathToGuideRoute,
  rescuePublicBookingHelpIntent,
  resolvePublicBookingGuideIntent,
  resolvePublicBookingGuideNavigate,
  rewriteBookingHelpGuideResult,
} from './ai-public-booking-guide.util.js';
import { resolveProductGuideSessionContext } from './ai-product-guide-session.util.js';
import { runSurfaceProductGuideIntent } from './ai-product-guide-surface.logic.js';

describe('ai-public-booking-guide.util (ai-guide-1.5.1 / 1.5.3)', () => {
  it.each(PUBLIC_BOOKING_GUIDE_ROUTE_SCENARIOS)(
    'mapPublicBookingGuideRoute for $id',
    ({ context, route }) => {
      expect(mapPublicBookingGuideRoute(context)).toBe(route);
      expect(
        resolveProductGuideSessionContext({ context }, 'public').route,
      ).toBe(route);
    },
  );

  it.each(PUBLIC_BOOKING_GUIDE_RESCUE_SCENARIOS)(
    'rescuePublicBookingHelpIntent for $id',
    ({ samplePrompt, fromActions }) => {
      const source = fromActions?.[0] ?? 'unknown';
      expect(rescuePublicBookingHelpIntent(samplePrompt, source)).toBe(
        'booking_help',
      );
    },
  );

  it.each(PUBLIC_BOOKING_GUIDE_CLASSIFIER_SCENARIOS)(
    'classifier scenario $id rescues from unknown',
    ({ prompt }) => {
      expect(rescuePublicBookingHelpIntent(prompt, 'unknown')).toBe(
        'booking_help',
      );
    },
  );

  it('preserves already-classified booking_help', () => {
    expect(rescuePublicBookingHelpIntent('anything', 'booking_help')).toBe(
      'booking_help',
    );
  });

  it('does not rescue unrelated availability prompts without booking funnel phrasing', () => {
    expect(
      rescuePublicBookingHelpIntent(
        'Who is free tomorrow at 3pm?',
        'check_availability',
      ),
    ).toBe('check_availability');
  });

  it('parseBookingPathToGuideRoute maps consumer and public paths', () => {
    expect(parseBookingPathToGuideRoute('/book/salon/professionals')).toBe(
      PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.professionals,
    );
    expect(parseBookingPathToGuideRoute('/book/salon/any')).toBe(
      PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.professionals,
    );
    expect(parseBookingPathToGuideRoute('/book/salon/services')).toBe(
      PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.services,
    );
    expect(parseBookingPathToGuideRoute('/book/salon/checkout')).toBe(
      PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.checkout,
    );
  });

  it('resolvePublicBookingGuideIntent prefers screen explain on checkout route', () => {
    expect(
      resolvePublicBookingGuideIntent(
        'How does payment work on checkout?',
        PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.checkout,
      ),
    ).toBe('explain_current_screen');
    expect(
      resolvePublicBookingGuideIntent(
        'Walk me through booking step by step',
        PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.checkout,
      ),
    ).toBe('guide_user_flow');
  });

  it('rewriteBookingHelpGuideResult keeps booking_help action and navigate', () => {
    const rewritten = rewriteBookingHelpGuideResult(
      {
        success: true,
        action: 'guide_user_flow',
        summary: 'Steps',
        guide: {
          topicId: 'public-booking-services',
          title: 'Pick a service',
          summary: 'Choose a treatment',
          steps: [{ title: 'Step 1', body: 'Open Services' }],
        },
      },
      PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.services,
    );
    expect(rewritten.action).toBe('booking_help');
    expect(rewritten.guide?.navigate).toEqual({ path: 'services' });
    expect(rewritten.details?.guideRoute).toBe(
      PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.services,
    );
    expect(rewritten.details?.voiceSummary).toBeTruthy();
  });

  it('resolvePublicBookingGuideNavigate maps funnel routes', () => {
    expect(
      resolvePublicBookingGuideNavigate(
        PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.checkout,
      ),
    ).toEqual({ path: 'checkout' });
    expect(
      resolvePublicBookingGuideNavigate(
        PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.overview,
      ),
    ).toEqual({ path: 'professionals' });
  });

  it.each(PUBLIC_BOOKING_CHECKOUT_STEP_SCENARIOS)(
    'derivePublicBookingStepFromPath for $id',
    ({ pathname, step }) => {
      expect(derivePublicBookingStepFromPath(pathname)).toBe(step);
    },
  );

  it('mergePublicBookingGuideContext derives bookingStep from pathname', () => {
    expect(
      mergePublicBookingGuideContext({
        pathname: '/book/demo-salon/checkout',
      }).bookingStep,
    ).toBe('checkout');
    expect(
      mapPublicBookingGuideRoute(
        mergePublicBookingGuideContext({
          pathname: '/book/demo-salon/services',
        }),
      ),
    ).toBe(PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.services);
  });

  it('enrichPublicBookingGuideTopicFromPrompt prefers route primary topic', () => {
    expect(
      enrichPublicBookingGuideTopicFromPrompt(
        'What happens on this page?',
        PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.checkout,
      ),
    ).toBe('public-checkout');
  });
});

describe('ai-public-booking-guide integration (ai-guide-1.5.1 / 1.5.3)', () => {
  const llm = {
    isAvailableForBusiness: jest.fn(async () => false),
    completeJson: jest.fn(async () => null),
  };
  const openAi = {
    isAvailableForBusiness: jest.fn(async () => false),
    embedText: jest.fn(async () => null),
  };
  const guide = new AiProductGuideService(
    llm as any,
    openAi as any,
    createMockGuideTelemetryService(),
  );

  it.each([
    {
      id: 'professionals-route',
      route: PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.professionals,
      topicId: 'public-booking-professionals',
      navigate: { path: 'professionals' },
    },
    {
      id: 'services-route',
      route: PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.services,
      topicId: 'public-booking-services',
      navigate: { path: 'services' },
    },
    {
      id: 'checkout-route',
      route: PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.checkout,
      topicId: 'public-checkout',
      navigate: { path: 'checkout' },
    },
  ])(
    'returns step-aware guide for $id',
    async ({ route, topicId, navigate }) => {
      const prompt = 'Walk me through booking step by step';
      const topic = enrichPublicBookingGuideTopicFromPrompt(prompt, route);
      const result = rewriteBookingHelpGuideResult(
        await runSurfaceProductGuideIntent({
          productGuide: guide,
          businessId: 'biz-1',
          prompt,
          intent: resolvePublicBookingGuideIntent(prompt, route),
          surface: 'public',
          locale: 'en',
          params: topic ? { topicId: topic } : undefined,
          sessionContext: resolveProductGuideSessionContext(
            {
              context: mergePublicBookingGuideContext({
                route,
                bookingStep:
                  route === PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.checkout
                    ? 'checkout'
                    : route === PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.services
                      ? 'services'
                      : 'professionals',
              }),
            },
            'public',
          ),
        }),
        route,
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('booking_help');
      expect(result.guide?.topicId).toBe(topicId);
      expect(result.guide?.steps.length).toBeGreaterThan(0);
      expect(result.guide?.navigate).toEqual(navigate);
    },
  );
});
