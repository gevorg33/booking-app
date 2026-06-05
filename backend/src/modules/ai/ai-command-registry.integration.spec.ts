import { Test } from '@nestjs/testing';
import {
  COMMAND_REGISTRY,
  COMMAND_REGISTRY_BY_ID,
  COMPOUND_COMMAND_RECIPES,
  REGISTRY_VALIDATION_ERRORS,
} from './ai-command-registry.js';
import {
  CUSTOMER_INTENTS,
  DASHBOARD_INTENTS,
  PROVIDER_INTENTS,
  PUBLIC_INTENTS,
} from './ai-command-registry.build.js';
import { AiCommandRegistryService } from './ai-command-registry.service.js';
import { SELF_SERVICE_BOOKING_INTENTS } from './ai-self-service-booking.util.js';
import { PROVIDER_BOOKING_INTENTS } from './ai-provider-booking.util.js';

describe('ai-command-registry integration', () => {
  it('bootstraps AiCommandRegistryService in a Nest testing module', async () => {
    const module = await Test.createTestingModule({
      providers: [AiCommandRegistryService],
    }).compile();

    const registry = module.get(AiCommandRegistryService);
    registry.onModuleInit();
    expect(registry.listAll().length).toBe(COMMAND_REGISTRY.length);
    expect(registry.getEntry('mark_paid')?.surfaceHandlers?.provider).toBe(
      'AiProviderBookingService',
    );
  });

  it('aligns registry with capability matrix and sprint bindings', () => {
    expect(REGISTRY_VALIDATION_ERRORS).toEqual([]);
    expect(COMMAND_REGISTRY.length).toBeGreaterThan(200);
    expect(COMPOUND_COMMAND_RECIPES.length).toBeGreaterThanOrEqual(10);

    for (const id of DASHBOARD_INTENTS) {
      expect(COMMAND_REGISTRY_BY_ID.has(id)).toBe(true);
    }
    for (const id of PROVIDER_INTENTS) {
      expect(COMMAND_REGISTRY_BY_ID.has(id)).toBe(true);
    }
    for (const id of PUBLIC_INTENTS) {
      expect(COMMAND_REGISTRY_BY_ID.has(id)).toBe(true);
    }
    for (const id of CUSTOMER_INTENTS) {
      expect(COMMAND_REGISTRY_BY_ID.has(id)).toBe(true);
    }

    for (const id of PROVIDER_BOOKING_INTENTS) {
      const entry = COMMAND_REGISTRY_BY_ID.get(id);
      expect(entry?.surfaces).toContain('provider');
      if (id === 'mark_paid') {
        expect(entry?.surfaceHandlers?.provider).toBe(
          'AiProviderBookingService',
        );
        expect(entry?.surfaceHandlers?.dashboard).toBe('AiBookingDepthService');
      } else {
        expect(entry?.handler).toBe('AiProviderBookingService');
      }
    }

    for (const id of SELF_SERVICE_BOOKING_INTENTS) {
      const entry = COMMAND_REGISTRY_BY_ID.get(id);
      expect(entry?.surfaces).toContain('customer');
      expect(entry?.apiModule).toBe('public-booking');
    }

    expect(
      COMPOUND_COMMAND_RECIPES.filter((recipe) =>
        recipe.surfaces.includes('customer'),
      ).length,
    ).toBeGreaterThanOrEqual(2);
  });
});
