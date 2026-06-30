import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  APP_GUIDE_INTENTS,
  isAppGuideIntent,
  resolveProductGuideSessionContext,
} from './ai-product-guide.util.js';
import {
  CUSTOMER_APP_GUIDE_CLASSIFIER_SCENARIOS,
} from './ai-customer-product-guide.fixtures.js';
import {
  PROVIDER_PRODUCT_GUIDE_CLASSIFIER_SCENARIOS,
  PROVIDER_PRODUCT_GUIDE_RESCUE_SCENARIOS,
} from './ai-provider-product-guide.fixtures.js';
import {
  PROVIDER_PRODUCT_GUIDE_INTENTS,
} from './ai-provider-product-guide.util.js';
import { buildCustomerClassifierSchema } from './customer-ai-command.util.js';
import { CUSTOMER_APP_GUIDE_CLASSIFIER_RULES } from './ai-product-guide.fixtures.js';
import { buildPublicClassifierSchema } from '../public-booking/public-booking-classifier.schema.js';
import { PROVIDER_MOBILE_CLASSIFIER_RULES } from './ai-provider-mobile.fixtures.js';
import { resolveHandlerForSurface } from './ai-command-registry.util.js';
import { PRODUCT_GUIDE_CLASSIFIER_SCENARIOS } from './ai-product-guide.fixtures.js';

const PROVIDER_SERVICE_SOURCE = readFileSync(
  join(__dirname, '../provider-mobile/provider-ai-command.service.ts'),
  'utf8',
);
const CUSTOMER_SERVICE_SOURCE = readFileSync(
  join(__dirname, 'customer-ai-command.service.ts'),
  'utf8',
);
const PUBLIC_ASSISTANT_SOURCE = readFileSync(
  join(__dirname, '../public-booking/public-booking-assistant.service.ts'),
  'utf8',
);

describe('ai-product-guide surface dispatch (ai-guide-1.8.6)', () => {
  describe('provider — surface-specific FAQ intents + heuristic app guide', () => {
    it('documents provider FAQ intents in mobile classifier rules', () => {
      for (const intent of PROVIDER_PRODUCT_GUIDE_INTENTS) {
        expect(PROVIDER_MOBILE_CLASSIFIER_RULES).toContain(`${intent}: READ`);
      }
    });

    it('routes provider FAQ intents through AiProductGuideService dispatch', () => {
      for (const intent of PROVIDER_PRODUCT_GUIDE_INTENTS) {
        expect(resolveHandlerForSurface(intent, 'provider')).toBe(
          'AiProductGuideService',
        );
        expect(PROVIDER_SERVICE_SOURCE).toContain(`case '${intent}':`);
      }
      expect(PROVIDER_SERVICE_SOURCE).toContain('dispatchProviderProductGuideIntent');
      expect(PROVIDER_SERVICE_SOURCE).toContain('runProviderProductGuideIntent');
    });

    it('routes rescued and classified app guide intents through provider dispatch', () => {
      expect(PROVIDER_SERVICE_SOURCE).toContain('dispatchProviderAppGuideIntent');
      expect(PROVIDER_SERVICE_SOURCE).toContain('runSurfaceProductGuideIntent');
      expect(PROVIDER_SERVICE_SOURCE).toContain('isAppGuideIntent(rescuedProviderGuide.action)');
      expect(PROVIDER_SERVICE_SOURCE).toContain('isAppGuideIntent(parsed.action)');
      expect(PROVIDER_SERVICE_SOURCE).toContain('rescueProductGuideIntent');
      expect(PROVIDER_SERVICE_SOURCE).toContain('enrichGuideTopicFromPrompt');
      expect(PROVIDER_SERVICE_SOURCE).toContain('resolveProductGuideSessionContext');
    });

    it('covers provider guide classifier and rescue scenarios', () => {
      expect(PROVIDER_PRODUCT_GUIDE_CLASSIFIER_SCENARIOS.length).toBeGreaterThanOrEqual(6);
      expect(PROVIDER_PRODUCT_GUIDE_RESCUE_SCENARIOS.length).toBeGreaterThanOrEqual(6);
      for (const intent of PROVIDER_PRODUCT_GUIDE_INTENTS) {
        expect(
          PROVIDER_PRODUCT_GUIDE_CLASSIFIER_SCENARIOS.some(
            (row) => row.intent === intent,
          ),
        ).toBe(true);
        expect(
          PROVIDER_PRODUCT_GUIDE_RESCUE_SCENARIOS.some(
            (row) => row.intent === intent,
          ),
        ).toBe(true);
      }
    });
  });

  describe('customer — APP_GUIDE intents → AiProductGuideService', () => {
    it('includes app guide intents in customer classifier schema', () => {
      const schema = buildCustomerClassifierSchema();
      for (const intent of APP_GUIDE_INTENTS) {
        expect(schema).toContain(intent);
      }
      expect(schema).toContain(CUSTOMER_APP_GUIDE_CLASSIFIER_RULES);
    });

    it('routes customer app guide intents through dispatch helper', () => {
      for (const intent of APP_GUIDE_INTENTS) {
        expect(resolveHandlerForSurface(intent, 'customer')).toBe(
          'AiProductGuideService',
        );
      }
      expect(CUSTOMER_SERVICE_SOURCE).toContain('dispatchCustomerAppGuideIntent');
      expect(CUSTOMER_SERVICE_SOURCE).toContain('isAppGuideIntent(action)');
      expect(CUSTOMER_SERVICE_SOURCE).toContain('runSurfaceProductGuideIntent');
      expect(CUSTOMER_SERVICE_SOURCE).toContain('rescueProductGuideIntent');
      expect(CUSTOMER_SERVICE_SOURCE).toContain('enrichGuideTopicFromPrompt');
      expect(CUSTOMER_SERVICE_SOURCE).toContain('mergeCustomerActivationGuideContext');
      expect(CUSTOMER_SERVICE_SOURCE).toContain('resolveCustomerGuideIntent');
    });

    it('covers customer guide classifier scenarios for each app guide intent', () => {
      for (const intent of APP_GUIDE_INTENTS) {
        expect(
          CUSTOMER_APP_GUIDE_CLASSIFIER_SCENARIOS.some(
            (row) => row.intent === intent,
          ),
        ).toBe(true);
      }
    });

    it('resolves customer guide session context with client tier', () => {
      expect(
        resolveProductGuideSessionContext(
          {
            context: {
              route: '/consumer/home',
              locale: 'hy',
              activationStep: 'salon',
            },
          },
          'customer',
        ).surface,
      ).toBe('customer');
    });
  });

  describe('public — booking_help surrogate + APP_GUIDE intents', () => {
    it('includes app guide intents in public classifier schema', () => {
      const schema = buildPublicClassifierSchema();
      for (const intent of APP_GUIDE_INTENTS) {
        expect(schema).toContain(intent);
      }
      expect(schema).toContain('booking_help');
    });

    it('routes public app guide and booking_help through dispatch helper', () => {
      for (const intent of APP_GUIDE_INTENTS) {
        expect(resolveHandlerForSurface(intent, 'public')).toBe(
          'AiProductGuideService',
        );
      }
      expect(resolveHandlerForSurface('booking_help', 'public')).toBe(
        'PublicBookingAssistantService',
      );
      expect(PUBLIC_ASSISTANT_SOURCE).toContain('dispatchPublicAppGuideIntent');
      expect(PUBLIC_ASSISTANT_SOURCE).toContain("case 'booking_help':");
      expect(PUBLIC_ASSISTANT_SOURCE).toContain('isAppGuideIntent(parsed.action)');
      expect(PUBLIC_ASSISTANT_SOURCE).toContain('handleBookingHelp');
      expect(PUBLIC_ASSISTANT_SOURCE).toContain('rewriteBookingHelpGuideResult');
      expect(PUBLIC_ASSISTANT_SOURCE).toContain('resolvePublicBookingGuideIntent');
      expect(PUBLIC_ASSISTANT_SOURCE).toContain('mergePublicBookingGuideContext');
      expect(PUBLIC_ASSISTANT_SOURCE).toContain('rescueProductGuideIntent');
      expect(PUBLIC_ASSISTANT_SOURCE).toContain('enrichGuideTopicFromPrompt');
    });

    it('covers dashboard guide classifier scenarios reused for public misroute guard', () => {
      expect(PRODUCT_GUIDE_CLASSIFIER_SCENARIOS.length).toBeGreaterThanOrEqual(10);
    });

    it('resolves public guide session context with booking step', () => {
      expect(
        resolveProductGuideSessionContext(
          {
            context: {
              route: '/book/glow-nails/services',
              bookingStep: 'services',
              locale: 'en',
            },
          },
          'public',
        ).surface,
      ).toBe('public');
    });
  });

  it('exports shared app guide intent guard for surface dispatch', () => {
    expect(isAppGuideIntent('guide_user_flow')).toBe(true);
    expect(isAppGuideIntent('explain_staff_invite')).toBe(false);
  });
});
