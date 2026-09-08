import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ALL_PRODUCT_GUIDE_INTENTS,
  isAnyProductGuideIntent,
} from './ai-product-guide-completion.util.js';
import { APP_GUIDE_INTENTS } from './ai-product-guide.util.js';
import {
  PROVIDER_PRODUCT_GUIDE_INTENTS,
  PROVIDER_PRODUCT_GUIDE_TOPIC_BY_INTENT,
} from './ai-provider-product-guide.util.js';
import {
  META_PRODUCT_GUIDE_INTENTS,
  PROVIDER_META_GUIDE_INTENTS,
} from './ai-meta-product-guide.util.js';
import {
  DASHBOARD_EMPTY_STATE_GUIDE_INTENTS,
  EMPTY_STATE_GUIDE_INTENTS,
  PROVIDER_EMPTY_STATE_GUIDE_INTENTS,
} from './ai-product-guide-empty-state.fixtures.js';
import {
  APP_GUIDE_VALIDATED_ACTIONS,
  META_GUIDE_VALIDATED_ACTIONS,
  shouldValidateAction,
  validateCommand,
} from './command-completion.validator.js';
import {
  COMMAND_REGISTRY_BY_ID,
  REGISTRY_VALIDATION_ERRORS,
} from './ai-command-registry.js';
import { resolveHandlerForSurface } from './ai-command-registry.util.js';
import {
  APP_GUIDE_INTENT_SET,
  DASHBOARD_DENIED_BY_TIER,
  isProductGuideIntentAllowed,
  PROVIDER_DENIED_BY_TIER,
  PROVIDER_PRODUCT_GUIDE_INTENT_SET,
} from './access-control.matrix.js';
import {
  PROVIDER_GUIDE_VALIDATED_ACTIONS,
  shouldValidateProviderAction,
  validateProviderCommand,
} from './provider-command-completion.validator.js';
import { makeResolvedCommand } from './command-completion.test-fixture.js';

const AI_COMMAND_SERVICE_SOURCE = readFileSync(
  join(__dirname, 'ai-command.service.ts'),
  'utf8',
);
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
const GATEWAY_SERVICE_SOURCE = readFileSync(
  join(__dirname, 'ai-gateway.service.ts'),
  'utf8',
);

describe('ai-product-guide handler coverage (ai-guide-1.8.5)', () => {
  it('registers all guide intents without registry validation errors', () => {
    expect(REGISTRY_VALIDATION_ERRORS).toEqual([]);
    for (const intent of ALL_PRODUCT_GUIDE_INTENTS) {
      const entry = COMMAND_REGISTRY_BY_ID.get(intent);
      if ((EMPTY_STATE_GUIDE_INTENTS as readonly string[]).includes(intent)) {
        expect(entry?.handler).toBe('AiProductGuideEmptyStateService');
      } else {
        expect(entry?.handler).toBe('AiProductGuideService');
      }
      expect(entry?.mutating).toBe(false);
    }
  });

  it('maps app guide intents to AiProductGuideService on dashboard, customer, and public', () => {
    for (const intent of APP_GUIDE_INTENTS) {
      for (const surface of ['dashboard', 'customer', 'public'] as const) {
        expect(resolveHandlerForSurface(intent, surface)).toBe(
          'AiProductGuideService',
        );
        expect(COMMAND_REGISTRY_BY_ID.get(intent)?.surfaces).toContain(surface);
      }
    }
  });

  it('maps provider guide intents to AiProductGuideService on provider only', () => {
    for (const intent of PROVIDER_PRODUCT_GUIDE_INTENTS) {
      expect(resolveHandlerForSurface(intent, 'provider')).toBe(
        'AiProductGuideService',
      );
      expect(COMMAND_REGISTRY_BY_ID.get(intent)?.surfaces).toEqual([
        'provider',
      ]);
      expect(PROVIDER_PRODUCT_GUIDE_TOPIC_BY_INTENT[intent]).toBeTruthy();
    }
  });

  it('does not deny-list any product guide intent', () => {
    for (const tier of ['client', 'staff', 'manager', 'owner'] as const) {
      for (const intent of ALL_PRODUCT_GUIDE_INTENTS) {
        expect(DASHBOARD_DENIED_BY_TIER[tier].has(intent)).toBe(false);
        expect(PROVIDER_DENIED_BY_TIER[tier].has(intent)).toBe(false);
      }
    }
  });

  it('allows guide intents on their surfaces via access-control matrix', () => {
    for (const intent of APP_GUIDE_INTENTS) {
      expect(isProductGuideIntentAllowed('owner', 'dashboard', intent)).toBe(
        true,
      );
      expect(isProductGuideIntentAllowed('client', 'customer', intent)).toBe(
        true,
      );
      expect(isProductGuideIntentAllowed('client', 'public', intent)).toBe(
        true,
      );
      expect(isProductGuideIntentAllowed('staff', 'provider', intent)).toBe(
        false,
      );
    }
    for (const intent of PROVIDER_PRODUCT_GUIDE_INTENTS) {
      expect(isProductGuideIntentAllowed('staff', 'provider', intent)).toBe(
        true,
      );
      expect(isProductGuideIntentAllowed('client', 'dashboard', intent)).toBe(
        false,
      );
    }
    for (const intent of META_PRODUCT_GUIDE_INTENTS) {
      expect(isProductGuideIntentAllowed('owner', 'dashboard', intent)).toBe(
        true,
      );
      expect(isProductGuideIntentAllowed('staff', 'provider', intent)).toBe(
        intent !== 'explain_ai_settings',
      );
    }
    for (const intent of EMPTY_STATE_GUIDE_INTENTS) {
      expect(isProductGuideIntentAllowed('owner', 'dashboard', intent)).toBe(
        true,
      );
      expect(isProductGuideIntentAllowed('client', 'customer', intent)).toBe(
        intent !== 'explain_visibility_block',
      );
      expect(isProductGuideIntentAllowed('client', 'public', intent)).toBe(
        intent !== 'explain_visibility_block',
      );
    }
  });

  it('exports guide intent sets for matrix parity', () => {
    expect(APP_GUIDE_INTENT_SET.size).toBe(APP_GUIDE_INTENTS.length);
    expect(PROVIDER_PRODUCT_GUIDE_INTENT_SET.size).toBe(
      PROVIDER_PRODUCT_GUIDE_INTENTS.length,
    );
    for (const intent of ALL_PRODUCT_GUIDE_INTENTS) {
      expect(isAnyProductGuideIntent(intent)).toBe(true);
    }
  });

  it('wires dashboard guide intents through AiCommandService switch cases', () => {
    for (const intent of APP_GUIDE_INTENTS) {
      expect(AI_COMMAND_SERVICE_SOURCE).toContain(`case '${intent}':`);
    }
    for (const intent of META_PRODUCT_GUIDE_INTENTS) {
      expect(AI_COMMAND_SERVICE_SOURCE).toContain(`case '${intent}':`);
    }
    for (const intent of DASHBOARD_EMPTY_STATE_GUIDE_INTENTS) {
      expect(AI_COMMAND_SERVICE_SOURCE).toContain(`case '${intent}':`);
    }
    expect(AI_COMMAND_SERVICE_SOURCE).toContain('dispatchProductGuideIntent');
    expect(AI_COMMAND_SERVICE_SOURCE).toContain(
      'dispatchMetaProductGuideIntent',
    );
    expect(AI_COMMAND_SERVICE_SOURCE).toContain(
      'dispatchEmptyStateGuideIntent',
    );
  });

  it('wires provider guide intents through ProviderAiCommandService switch cases', () => {
    for (const intent of PROVIDER_PRODUCT_GUIDE_INTENTS) {
      expect(PROVIDER_SERVICE_SOURCE).toContain(`case '${intent}':`);
    }
    for (const intent of PROVIDER_META_GUIDE_INTENTS) {
      expect(PROVIDER_SERVICE_SOURCE).toContain(`case '${intent}':`);
    }
    for (const intent of PROVIDER_EMPTY_STATE_GUIDE_INTENTS) {
      expect(PROVIDER_SERVICE_SOURCE).toContain(`case '${intent}':`);
    }
    expect(PROVIDER_SERVICE_SOURCE).toContain(
      'dispatchProviderProductGuideIntent',
    );
    expect(PROVIDER_SERVICE_SOURCE).toContain(
      'dispatchProviderMetaGuideIntent',
    );
    expect(PROVIDER_SERVICE_SOURCE).toContain(
      'dispatchProviderEmptyStateGuideIntent',
    );
    expect(PROVIDER_SERVICE_SOURCE).toContain('dispatchProviderAppGuideIntent');
    expect(PROVIDER_SERVICE_SOURCE).toContain(
      'isAppGuideIntent(parsed.action)',
    );
  });

  it('wires customer and public empty-state guide dispatch helpers', () => {
    expect(CUSTOMER_SERVICE_SOURCE).toContain('dispatchCustomerAppGuideIntent');
    expect(CUSTOMER_SERVICE_SOURCE).toContain(
      'dispatchCustomerEmptyStateGuideIntent',
    );
    expect(CUSTOMER_SERVICE_SOURCE).toContain('isAppGuideIntent(action)');
    expect(PUBLIC_ASSISTANT_SOURCE).toContain('dispatchPublicAppGuideIntent');
    expect(PUBLIC_ASSISTANT_SOURCE).toContain(
      'dispatchPublicEmptyStateGuideIntent',
    );
    expect(PUBLIC_ASSISTANT_SOURCE).toContain(
      'isAppGuideIntent(parsed.action)',
    );
  });

  it('wires ai-unavailable static guide fallback on all surfaces (ai-guide-1.8.10)', () => {
    for (const source of [
      AI_COMMAND_SERVICE_SOURCE,
      PROVIDER_SERVICE_SOURCE,
      CUSTOMER_SERVICE_SOURCE,
      PUBLIC_ASSISTANT_SOURCE,
      GATEWAY_SERVICE_SOURCE,
    ]) {
      expect(source).toContain('runAiUnavailableStaticGuideFallback');
    }
    expect(AI_COMMAND_SERVICE_SOURCE).toContain(
      'buildAiUnavailableErrorWithGuideLink',
    );
    expect(CUSTOMER_SERVICE_SOURCE).toContain(
      'buildAiUnavailableErrorWithGuideLink',
    );
    expect(GATEWAY_SERVICE_SOURCE).toContain('quota_exceeded');
    expect(GATEWAY_SERVICE_SOURCE).toContain('PlanLimitExceededException');
  });

  it('registers dashboard app guide validator rows', () => {
    for (const intent of APP_GUIDE_INTENTS) {
      expect(APP_GUIDE_VALIDATED_ACTIONS.has(intent)).toBe(true);
      expect(shouldValidateAction(intent)).toBe(true);
      expect(
        validateCommand(makeResolvedCommand({
          action: intent,
          prompt: 'Walk me through schedule templates',
          params: { topicId: 'dashboard.core.schedule' },
          enrichedParams: {},
          entities: { employees: [], services: [] },
          reasoning: 'test',
        })).ok,
      ).toBe(true);
    }
    for (const intent of META_PRODUCT_GUIDE_INTENTS) {
      expect(META_GUIDE_VALIDATED_ACTIONS.has(intent)).toBe(true);
      expect(shouldValidateAction(intent)).toBe(true);
    }
    for (const intent of EMPTY_STATE_GUIDE_INTENTS) {
      expect(shouldValidateAction(intent)).toBe(true);
    }
  });

  it('registers provider guide validator rows', () => {
    for (const intent of PROVIDER_PRODUCT_GUIDE_INTENTS) {
      expect(PROVIDER_GUIDE_VALIDATED_ACTIONS.has(intent)).toBe(true);
      expect(shouldValidateProviderAction(intent)).toBe(true);
    }
    expect(
      validateProviderCommand('explain_staff_invite', {
        _prompt: 'What is this invite link?',
      }).ok,
    ).toBe(true);
  });
});
