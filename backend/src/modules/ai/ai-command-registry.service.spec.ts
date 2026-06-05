import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { COMMAND_REGISTRY } from './ai-command-registry.js';
import { AiCommandRegistryService } from './ai-command-registry.service.js';

describe('AiCommandRegistryService', () => {
  it('delegates registry lookups and summaries', async () => {
    const module = await Test.createTestingModule({
      providers: [AiCommandRegistryService],
    }).compile();
    const registry = module.get(AiCommandRegistryService);

    expect(registry.listAll().length).toBe(COMMAND_REGISTRY.length);
    expect(registry.getEntry('create_booking_cash')?.sprint).toBe(
      'bookingDepth',
    );
    expect(registry.listBySurface('dashboard').length).toBeGreaterThan(100);
    expect(registry.listByModule('booking').map((entry) => entry.id)).toContain(
      'create_booking_cash',
    );
    expect(registry.intentIdsForSurface('provider')).toContain('mark_paid');
    expect(
      registry.allowedOnSurface('list_package_bookings', 'dashboard'),
    ).toBe(true);
    expect(
      registry.allowedForTier('optimize_schedule', 'staff', 'dashboard'),
    ).toBe(false);
    expect(registry.isMutating('cancel_bookings')).toBe(true);
    expect(registry.executionMode('day_replan')).toBe('orchestration');
    expect(registry.supportsCompoundStep('book_package')).toBe(true);
    expect(registry.compoundRecipe('provider_booking_compound')?.maxSteps).toBe(
      4,
    );
    expect(
      registry.compoundRecipes('customer').map((recipe) => recipe.id),
    ).toContain('customer_booking_compound');
    expect(
      registry.compoundRecipes('public').map((recipe) => recipe.id),
    ).toContain('public_assistant_compound');
    expect(registry.handlerForSurface('mark_paid', 'provider')).toBe(
      'AiProviderBookingService',
    );
    expect(registry.handlerForSurface('mark_paid', 'dashboard')).toBe(
      'AiBookingDepthService',
    );
    expect(registry.summary('provider')).toContain('provider_booking_compound');
    expect(
      registry.resolveCompoundHandlers(
        'provider',
        'List my package visits and mark booking paid',
      )[0]?.decomposeUtil,
    ).toContain('decomposeProviderBookingCompoundPrompt');
    expect(
      registry.view('create_package_booking')?.compoundRecipes.length,
    ).toBeGreaterThan(0);
    expect(registry.view('missing_intent')).toBeNull();
  });

  it('does not warn when registry validation is clean', async () => {
    const warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    const module = await Test.createTestingModule({
      providers: [AiCommandRegistryService],
    }).compile();
    const registry = module.get(AiCommandRegistryService);

    registry.onModuleInit();

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
