import { AiProductGuideService } from './ai-product-guide.service.js';
import { createMockGuideTelemetryService } from './guide/guide-telemetry.mock.js';
import {
  CUSTOMER_APP_GUIDE_CLASSIFIER_SCENARIOS,
  CUSTOMER_APP_GUIDE_RESCUE_SCENARIOS,
  CUSTOMER_APP_GUIDE_ROUTE_SCENARIOS,
  CONSUMER_ACTIVATION_ROUTE_SCENARIOS,
  CONSUMER_ACTIVATION_STEP_SCENARIOS,
} from './ai-customer-product-guide.fixtures.js';
import {
  CONSUMER_ACTIVATION_GUIDE_ROUTES,
  CUSTOMER_APP_GUIDE_ROUTES,
  deriveConsumerActivationStepFromPath,
  enrichCustomerGuideTopicFromPrompt,
  mapCustomerActivationGuideRoute,
  mapCustomerMobileGuideRoute,
  mergeCustomerActivationGuideContext,
  parseCustomerPathToGuideRoute,
  rescueCustomerAppGuideIntent,
  resolveConsumerActivationTopicFromStep,
  resolveCustomerGuideIntent,
  resolveCustomerGuideNavigate,
} from './ai-customer-product-guide.util.js';
import { resolveProductGuideSessionContext } from './ai-product-guide-session.util.js';
import { runSurfaceProductGuideIntent } from './ai-product-guide-surface.logic.js';

describe('ai-customer-product-guide.util (ai-guide-1.5.2)', () => {
  it.each(CUSTOMER_APP_GUIDE_ROUTE_SCENARIOS)(
    'mapCustomerMobileGuideRoute for $id',
    ({ context, route }) => {
      expect(mapCustomerMobileGuideRoute(context)).toBe(route);
      expect(
        resolveProductGuideSessionContext({ context }, 'customer').route,
      ).toBe(route);
    },
  );

  it.each(CUSTOMER_APP_GUIDE_RESCUE_SCENARIOS)(
    'rescueCustomerAppGuideIntent for $id',
    ({ samplePrompt, intent, fromActions }) => {
      const source = fromActions?.[0] ?? 'unknown';
      expect(rescueCustomerAppGuideIntent(samplePrompt, source)).toBe(intent);
    },
  );

  it.each(CUSTOMER_APP_GUIDE_CLASSIFIER_SCENARIOS)(
    'classifier scenario $id rescues from unknown',
    ({ prompt, intent }) => {
      expect(rescueCustomerAppGuideIntent(prompt, 'unknown')).toBe(intent);
    },
  );

  it('preserves already-classified guide intents', () => {
    expect(
      rescueCustomerAppGuideIntent('anything', 'explain_app_feature'),
    ).toBe('explain_app_feature');
    expect(rescueCustomerAppGuideIntent('anything', 'guide_user_flow')).toBe(
      'guide_user_flow',
    );
  });

  it('parseCustomerPathToGuideRoute maps consumer paths', () => {
    expect(parseCustomerPathToGuideRoute('/s/salon/account')).toBe(
      CUSTOMER_APP_GUIDE_ROUTES.account,
    );
    expect(parseCustomerPathToGuideRoute('/s/salon/packages')).toBe(
      CUSTOMER_APP_GUIDE_ROUTES.packages,
    );
    expect(parseCustomerPathToGuideRoute('/s/salon/home')).toBe(
      CUSTOMER_APP_GUIDE_ROUTES.tabs,
    );
  });

  it('enrichCustomerGuideTopicFromPrompt maps packages and profile prompts', () => {
    expect(
      enrichCustomerGuideTopicFromPrompt('How do gift cards work?', '/s'),
    ).toBe('consumer-packages-gift-cards');
    expect(
      enrichCustomerGuideTopicFromPrompt('How do I update my profile?', '/s'),
    ).toBe('consumer-account');
    expect(
      enrichCustomerGuideTopicFromPrompt(
        'What is on the Home tab?',
        '/s/account',
      ),
    ).toBe('consumer-account');
  });

  it('resolveCustomerGuideIntent prefers screen explain cues', () => {
    expect(
      resolveCustomerGuideIntent(
        'What am I looking at on this screen?',
        'guide_user_flow',
        CUSTOMER_APP_GUIDE_ROUTES.packages,
      ),
    ).toBe('explain_current_screen');
  });

  it('resolveCustomerGuideNavigate maps consumer routes', () => {
    expect(
      resolveCustomerGuideNavigate(CUSTOMER_APP_GUIDE_ROUTES.account),
    ).toEqual({
      path: 'account',
    });
    expect(
      resolveCustomerGuideNavigate(CUSTOMER_APP_GUIDE_ROUTES.packages),
    ).toEqual({
      path: 'packages',
    });
    expect(
      resolveCustomerGuideNavigate(CUSTOMER_APP_GUIDE_ROUTES.tabs),
    ).toEqual({
      path: 'home',
    });
  });
});

describe('ai-customer-activation-guide.util (ai-guide-1.5.4)', () => {
  it.each(CONSUMER_ACTIVATION_STEP_SCENARIOS)(
    'deriveConsumerActivationStepFromPath for $id',
    ({ pathname, step, slotSelected }) => {
      expect(
        deriveConsumerActivationStepFromPath(pathname, { slotSelected }),
      ).toBe(step);
    },
  );

  it.each(CONSUMER_ACTIVATION_ROUTE_SCENARIOS)(
    'mapCustomerActivationGuideRoute for $id',
    ({ context, route, topicId }) => {
      const merged = mergeCustomerActivationGuideContext(context);
      expect(mapCustomerActivationGuideRoute(merged)).toBe(route);
      expect(
        enrichCustomerGuideTopicFromPrompt(
          'What should I do next?',
          route,
          undefined,
          merged.activationStep as never,
        ),
      ).toBe(topicId);
      expect(
        resolveConsumerActivationTopicFromStep(merged.activationStep as never),
      ).toBe(topicId);
    },
  );

  it('mergeCustomerActivationGuideContext derives activationStep from pathname', () => {
    expect(
      mergeCustomerActivationGuideContext({
        pathname: '/s/demo/services',
      }).activationStep,
    ).toBe('service');
    expect(
      mergeCustomerActivationGuideContext({
        pathname: '/s/demo/book/svc-1',
        timeSlot: '2026-06-10T09:00:00.000Z',
      }),
    ).toMatchObject({
      activationStep: 'confirm',
      slotSelected: true,
    });
  });

  it('enrichCustomerGuideTopicFromPrompt maps first-booking prompts', () => {
    expect(
      enrichCustomerGuideTopicFromPrompt(
        'How do I book my first appointment?',
        '/s',
      ),
    ).toBe('consumer-getting-started');
    expect(
      enrichCustomerGuideTopicFromPrompt(
        'What happens after I pick a time?',
        CONSUMER_ACTIVATION_GUIDE_ROUTES.slot,
        undefined,
        'slot',
      ),
    ).toBe('consumer-activation-slot');
  });

  it('resolveCustomerGuideNavigate maps activation routes', () => {
    expect(
      resolveCustomerGuideNavigate(CONSUMER_ACTIVATION_GUIDE_ROUTES.salon),
    ).toEqual({
      path: 'home',
    });
    expect(
      resolveCustomerGuideNavigate(CONSUMER_ACTIVATION_GUIDE_ROUTES.service),
    ).toEqual({
      path: 'services',
    });
    expect(
      resolveCustomerGuideNavigate(CONSUMER_ACTIVATION_GUIDE_ROUTES.confirm),
    ).toEqual({
      path: 'checkout',
    });
  });
});

describe('ai-customer-product-guide integration (ai-guide-1.5.2)', () => {
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
      id: 'tabs-route',
      route: CUSTOMER_APP_GUIDE_ROUTES.tabs,
      topicId: 'consumer-tabs',
      navigate: { path: 'home' },
      prompt: 'What is on the Home tab vs Services?',
      intent: 'explain_app_feature' as const,
    },
    {
      id: 'account-route',
      route: CUSTOMER_APP_GUIDE_ROUTES.account,
      topicId: 'consumer-account',
      navigate: { path: 'account' },
      prompt: 'How do I update my profile?',
      intent: 'guide_user_flow' as const,
    },
    {
      id: 'packages-route',
      route: CUSTOMER_APP_GUIDE_ROUTES.packages,
      topicId: 'consumer-packages-gift-cards',
      navigate: { path: 'packages' },
      prompt: 'How do gift cards work in the app?',
      intent: 'explain_app_feature' as const,
      sessionEntitlements: {
        _planTierId: 'business',
        enabledModules: ['giftCards'],
      },
    },
    {
      id: 'activation-service',
      route: CONSUMER_ACTIVATION_GUIDE_ROUTES.service,
      topicId: 'consumer-activation-service',
      navigate: { path: 'services' },
      prompt: 'What should I do on the services screen?',
      intent: 'explain_current_screen' as const,
      activationStep: 'service' as const,
    },
    {
      id: 'activation-confirm',
      route: CONSUMER_ACTIVATION_GUIDE_ROUTES.confirm,
      topicId: 'consumer-activation-confirm',
      navigate: { path: 'checkout' },
      prompt: "What's next after I pick a time?",
      intent: 'guide_user_flow' as const,
      activationStep: 'confirm' as const,
    },
  ])(
    'returns step-aware guide for $id',
    async ({
      route,
      topicId,
      navigate,
      prompt,
      intent,
      activationStep,
      sessionEntitlements,
    }) => {
      const mergedContext = mergeCustomerActivationGuideContext({
        route,
        ...(activationStep ? { activationStep } : {}),
        ...(sessionEntitlements ?? {}),
      });
      const resolvedIntent = resolveCustomerGuideIntent(prompt, intent, route);
      const topic = enrichCustomerGuideTopicFromPrompt(
        prompt,
        route,
        undefined,
        activationStep,
      );
      const result = await runSurfaceProductGuideIntent({
        productGuide: guide,
        businessId: 'biz-1',
        prompt,
        intent: resolvedIntent,
        surface: 'customer',
        locale: 'en',
        params: topic ? { topicId: topic } : undefined,
        session: { context: mergedContext },
        sessionContext: resolveProductGuideSessionContext(
          { context: mergedContext },
          'customer',
        ),
      });

      expect(result.success).toBe(true);
      expect(result.guide?.topicId).toBe(topicId);
      expect(result.guide?.steps.length).toBeGreaterThan(0);
      expect(
        result.guide?.navigate ?? resolveCustomerGuideNavigate(route),
      ).toEqual(navigate);
    },
  );
});
