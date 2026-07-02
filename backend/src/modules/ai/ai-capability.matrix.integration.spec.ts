import { Test } from '@nestjs/testing';
import {
  buildCapabilitiesView,
  CUSTOMER_PUBLIC_DELEGATED_INTENTS,
  getAllowedIntents,
  getCustomerNativeIntents,
  getPublicDelegatedCustomerIntents,
  isIntentAllowed,
  isMutatingIntent,
  validateCustomerPublicDelegatedIntents,
} from './ai-capability.matrix.js';
import {
  CUSTOMER_INTENTS,
  CUSTOMER_MUTATING_INTENTS,
  DASHBOARD_INTENTS,
  DASHBOARD_MUTATING_INTENTS,
  PROVIDER_INTENTS,
  PROVIDER_MUTATING_INTENTS,
  PUBLIC_ASSISTANT_INTENTS,
  PUBLIC_INTENTS,
} from './ai-command-registry.build.js';
import {
  COMMAND_REGISTRY,
  COMMAND_REGISTRY_BY_ID,
  COMPOUND_COMMAND_RECIPES,
  REGISTRY_VALIDATION_ERRORS,
} from './ai-command-registry.js';
import { AiCommandRegistryService } from './ai-command-registry.service.js';
import {
  getCompoundRecipesForSurface,
  getIntentIdsBySurface,
  isIntentAllowedOnSurface,
  resolveCompoundRecipesForPrompt,
} from './ai-command-registry.util.js';
import { SELF_SERVICE_BOOKING_INTENTS } from './ai-self-service-booking.util.js';
import {
  auditCustomerIntentCoverage,
  CUSTOMER_INTENT_COVERAGE_REQUIRED,
  listCustomerIntentCoverageGaps,
} from './ai-customer-intent-coverage.util.js';
import { AI_COMMAND_EVAL_DETERMINISTIC_CASES } from './eval/ai-command-eval.cases.js';

describe('ai-capability.matrix integration (ai-cmd-0.2)', () => {
  it('bootstraps registry service and validates zero drift against generated intent lists', async () => {
    const module = await Test.createTestingModule({
      providers: [AiCommandRegistryService],
    }).compile();
    const registry = module.get(AiCommandRegistryService);
    registry.onModuleInit();

    expect(REGISTRY_VALIDATION_ERRORS).toEqual([]);
    expect(registry.listAll().length).toBe(COMMAND_REGISTRY.length);
  });

  it('derives surface intent lists from registry bindings with correct counts', () => {
    expect(DASHBOARD_INTENTS).toContain('unknown');
    expect(PROVIDER_INTENTS).toContain('unknown');
    expect(CUSTOMER_INTENTS).toContain('unknown');
    expect(PUBLIC_INTENTS).toContain('unknown');

    expect(new Set(DASHBOARD_INTENTS).size).toBe(DASHBOARD_INTENTS.length);
    expect(new Set(CUSTOMER_INTENTS).size).toBe(CUSTOMER_INTENTS.length);

    for (const id of DASHBOARD_INTENTS) {
      expect(COMMAND_REGISTRY_BY_ID.get(id)?.surfaces).toContain('dashboard');
    }
    for (const id of PROVIDER_INTENTS) {
      expect(COMMAND_REGISTRY_BY_ID.get(id)?.surfaces).toContain('provider');
    }
    for (const id of CUSTOMER_INTENTS) {
      expect(COMMAND_REGISTRY_BY_ID.get(id)?.surfaces).toContain('customer');
    }
    for (const id of PUBLIC_INTENTS) {
      expect(COMMAND_REGISTRY_BY_ID.get(id)?.surfaces).toContain('public');
    }
  });

  it('keeps customer and public surfaces distinct while unioning legacy public assistant list', () => {
    expect(CUSTOMER_INTENTS).toContain('book_package');
    expect(PUBLIC_INTENTS).not.toContain('book_package');
    expect(PUBLIC_INTENTS).toContain('book_appointment');

    const union = new Set([
      ...PUBLIC_INTENTS.filter((id) => id !== 'unknown'),
      ...CUSTOMER_INTENTS.filter((id) => id !== 'unknown'),
      'unknown',
    ]);
    expect([...union].sort()).toEqual([...PUBLIC_ASSISTANT_INTENTS].sort());
  });

  it('aligns capability matrix allow-lists with registry surface ids', () => {
    const registryCustomerIds = new Set(getIntentIdsBySurface('customer'));
    const registryPublicIds = new Set(getIntentIdsBySurface('public'));
    const allowedCustomer = new Set(getAllowedIntents('customer', 'client'));
    for (const id of allowedCustomer) {
      expect(registryCustomerIds.has(id) || registryPublicIds.has(id)).toBe(
        true,
      );
    }

    for (const id of getAllowedIntents('public', 'client')) {
      expect(registryPublicIds.has(id)).toBe(true);
    }

    expect(getIntentIdsBySurface('dashboard').length).toBe(
      DASHBOARD_INTENTS.length,
    );
    expect(getIntentIdsBySurface('provider').length).toBe(
      PROVIDER_INTENTS.length,
    );
  });

  it('scopes shared operational intents to dashboard and provider with handler overrides', () => {
    const markPaid = COMMAND_REGISTRY_BY_ID.get('mark_paid');
    expect(markPaid?.surfaces).toEqual(
      expect.arrayContaining(['dashboard', 'provider']),
    );
    expect(markPaid?.surfaceHandlers?.dashboard).toBe('AiBookingDepthService');
    expect(markPaid?.surfaceHandlers?.provider).toBe(
      'AiProviderBookingService',
    );

    expect(isIntentAllowed('dashboard', 'owner', 'mark_paid')).toBe(true);
    expect(isIntentAllowed('provider', 'owner', 'mark_paid')).toBe(true);
    expect(isIntentAllowed('customer', 'client', 'mark_paid')).toBe(false);
  });

  it('derives mutating intent sets from registry bindings per surface', () => {
    for (const id of DASHBOARD_MUTATING_INTENTS) {
      expect(isMutatingIntent('dashboard', id)).toBe(true);
      expect(COMMAND_REGISTRY_BY_ID.get(id)?.mutating).toBe(true);
    }
    for (const id of PROVIDER_MUTATING_INTENTS) {
      expect(isMutatingIntent('provider', id)).toBe(true);
    }
    for (const id of CUSTOMER_MUTATING_INTENTS) {
      expect(isMutatingIntent('customer', id)).toBe(true);
    }
    expect(isMutatingIntent('customer', 'list_my_appointments')).toBe(false);
  });

  it('registers compound recipes for multi-command prompts on each surface', () => {
    const customerRecipes = getCompoundRecipesForSurface('customer');
    expect(customerRecipes.map((recipe) => recipe.id)).toEqual(
      expect.arrayContaining([
        'customer_booking_compound',
        'customer_self_service_compound',
      ]),
    );

    const publicRecipes = getCompoundRecipesForSurface('public');
    expect(publicRecipes.map((recipe) => recipe.id)).toContain(
      'public_assistant_compound',
    );

    const providerRecipes = getCompoundRecipesForSurface('provider');
    expect(providerRecipes.map((recipe) => recipe.id)).toEqual(
      expect.arrayContaining([
        'provider_booking_compound',
        'provider_push_compound',
      ]),
    );

    expect(
      COMPOUND_COMMAND_RECIPES.find(
        (recipe) => recipe.id === 'dashboard_operational_compound',
      )?.llmDecompose,
    ).toBe(true);
  });

  it('resolves compound handlers for customer multi-step self-service prompts', () => {
    for (const prompt of [
      'Book spa day package and pay cash at visit',
      'Discover packages and book package with cash at visit',
      'List my appointments and list my gift cards',
    ]) {
      const recipes = resolveCompoundRecipesForPrompt('customer', prompt);
      expect(recipes.length).toBeGreaterThan(0);
      expect(
        recipes.some((recipe) => recipe.surfaces.includes('customer')),
      ).toBe(true);
    }

    for (const id of SELF_SERVICE_BOOKING_INTENTS) {
      expect(isIntentAllowedOnSurface(id, 'customer')).toBe(true);
      const recipe = COMPOUND_COMMAND_RECIPES.find(
        (entry) => entry.id === 'customer_booking_compound',
      );
      expect(recipe?.allowedStepIntentIds).toContain(id);
    }
  });

  it('builds customer capabilities view for logged-in clients only', () => {
    const view = buildCapabilitiesView('customer', undefined, 'solo');
    expect(view.accessTier).toBe('client');
    expect(view.allowedIntents).toContain('book_package');
    expect(view.planDeniedIntents).toEqual([]);
    expect(view.publicDelegatedIntents).toEqual([
      ...CUSTOMER_PUBLIC_DELEGATED_INTENTS,
    ]);
    expect(view.customerNativeIntents).toEqual(
      getCustomerNativeIntents('client'),
    );

    expect(isIntentAllowed('customer', 'staff', 'book_package')).toBe(false);
    expect(getAllowedIntents('customer', 'manager')).toEqual(['unknown']);
  });

  it('aligns PUBLIC_ONLY_ASSISTANT_ACTIONS with registry + customer gateway (ai-cmd-customer-0.1)', () => {
    expect(validateCustomerPublicDelegatedIntents()).toEqual([]);

    for (const action of CUSTOMER_PUBLIC_DELEGATED_INTENTS) {
      expect(PUBLIC_INTENTS).toContain(action);
      expect(isIntentAllowed('customer', 'client', action)).toBe(true);
      expect(isIntentAllowed('public', 'client', action)).toBe(true);
      expect(getPublicDelegatedCustomerIntents('client')).toContain(action);
      expect(getCustomerNativeIntents('client')).not.toContain(action);
    }

    expect(getCustomerNativeIntents('client')).toContain('book_package');
    expect(getCustomerNativeIntents('client')).not.toContain(
      'book_appointment',
    );
  });

  it('audits shipped customer intents for fixture + eval coverage (ai-cmd-customer-2.6)', () => {
    const gaps = listCustomerIntentCoverageGaps(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
    );
    expect(gaps).toEqual([]);
    expect(CUSTOMER_INTENT_COVERAGE_REQUIRED.length).toBeGreaterThan(15);
    expect(
      auditCustomerIntentCoverage(AI_COMMAND_EVAL_DETERMINISTIC_CASES).length,
    ).toBeGreaterThan(40);
  });
});
