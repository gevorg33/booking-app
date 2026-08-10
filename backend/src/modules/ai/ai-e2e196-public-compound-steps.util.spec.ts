import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  E2E196_PREVIOUSLY_DEAD_COMPOUND_ACTIONS,
  E2E196_PUBLIC_COMPOUND_LIVE_CASES,
  E2E196_PUBLIC_ONLY_COMPOUND_ACTIONS,
} from './ai-e2e196-public-compound-steps.fixtures.js';
import { PUBLIC_ASSISTANT_COMPOUND_PROMPTS } from './ai-public-assistant-compound.fixtures.js';
import {
  decomposePublicAssistantCompoundPrompt,
  isPublicAssistantCompoundPrompt,
} from './ai-public-assistant-compound.util.js';
import { decomposeDeterministicForSurface } from './intent-decomposition.util.js';
import { PublicBookingAssistantService } from '../public-booking/public-booking-assistant.service.js';

describe('e2e-bug.196 public compound PUBLIC_ONLY steps', () => {
  it('covers all 14 PUBLIC_ONLY actions in the fixture list', () => {
    expect(E2E196_PUBLIC_ONLY_COMPOUND_ACTIONS).toHaveLength(14);
    expect(E2E196_PREVIOUSLY_DEAD_COMPOUND_ACTIONS).toHaveLength(7);
  });

  it('dispatchCompoundStepAction source wires every PUBLIC_ONLY action', () => {
    const source = readFileSync(
      join(__dirname, '../public-booking/public-booking-assistant.service.ts'),
      'utf8',
    );
    const switchStart = source.indexOf(
      'private async dispatchCompoundStepAction',
    );
    expect(switchStart).toBeGreaterThan(-1);
    const switchBody = source.slice(
      switchStart,
      source.indexOf('\n  private async handleCheckAvailability', switchStart),
    );
    for (const action of E2E196_PUBLIC_ONLY_COMPOUND_ACTIONS) {
      expect(switchBody).toContain(`case '${action}':`);
    }
    for (const action of E2E196_PREVIOUSLY_DEAD_COMPOUND_ACTIONS) {
      expect(switchBody).toContain(`case '${action}':`);
    }
  });

  it.each(
    E2E196_PUBLIC_ONLY_COMPOUND_ACTIONS.map((action) => [action] as const),
  )(
    'dispatchCompoundStepAction does not return unsupported for %s',
    async (action) => {
      const stubs: Record<string, jest.Mock> = {
        handleListProviders: jest
          .fn()
          .mockResolvedValue({ success: true, action: 'list_providers' }),
        handleListServices: jest
          .fn()
          .mockResolvedValue({ success: true, action: 'list_services' }),
        handleFindServicesUnderBudget: jest.fn().mockResolvedValue({
          success: true,
          action: 'find_services_under_budget',
        }),
        handleFindEveningWeekendSlots: jest.fn().mockResolvedValue({
          success: true,
          action: 'find_evening_weekend_slots',
        }),
        handleCheckAvailability: jest
          .fn()
          .mockResolvedValue({ success: true, action: 'check_availability' }),
        handleExplainProviderAvailability: jest.fn().mockResolvedValue({
          success: true,
          action: 'explain_provider_availability',
        }),
        handleRecommendSpecialists: jest.fn().mockResolvedValue({
          success: true,
          action: 'recommend_specialists',
        }),
        handleBusinessInfo: jest
          .fn()
          .mockReturnValue({ success: true, action: 'business_info' }),
        handleBookAppointment: jest
          .fn()
          .mockResolvedValue({ success: true, action: 'book_appointment' }),
        handleBookingHelp: jest
          .fn()
          .mockResolvedValue({ success: true, action: 'booking_help' }),
        handlePreviewMultiServiceCart: jest.fn().mockResolvedValue({
          success: true,
          action: 'preview_multi_service_cart',
        }),
        handleListPublicPromotions: jest.fn().mockResolvedValue({
          success: true,
          action: 'list_public_promotions',
        }),
        handleListProviderReviews: jest.fn().mockResolvedValue({
          success: true,
          action: 'list_provider_reviews',
        }),
        handleSuggestPackageBlock: jest.fn().mockResolvedValue({
          success: true,
          action: 'suggest_package_block',
        }),
        handleBookMultiService: jest.fn(),
        handleCheckMultiServiceAvailability: jest.fn(),
        handleAddServicesToCart: jest.fn(),
        handleDiscoverPackages: jest.fn(),
        handleBookPackage: jest.fn(),
      };

      const result = await (
        PublicBookingAssistantService.prototype as any
      ).dispatchCompoundStepAction.call(
        stubs,
        action,
        { maxPrice: 50 },
        `test ${action}`,
        'demo-slug',
        { id: 'biz-1', name: 'Salon' },
        [],
        [],
        'en',
        'UTC',
        {},
      );

      expect(String(result.summary ?? '')).not.toMatch(/not supported yet/i);
      expect(result.action).toBe(action);
      expect(result.success).toBe(true);
    },
  );

  it.each(
    E2E196_PUBLIC_COMPOUND_LIVE_CASES.map((row) => [row.id, row] as const),
  )(
    'decomposes live compound $id into expected PUBLIC_ONLY steps',
    (_id, row) => {
      expect(isPublicAssistantCompoundPrompt(row.prompt)).toBe(true);
      const steps = decomposePublicAssistantCompoundPrompt(row.prompt);
      expect(steps.map((step) => step.action)).toEqual([...row.expectActions]);
    },
  );

  it('registers e2e196 compound fixtures with matching ordered actions', () => {
    const e2e196 = PUBLIC_ASSISTANT_COMPOUND_PROMPTS.filter((row) =>
      row.id.startsWith('e2e196-'),
    );
    expect(e2e196).toHaveLength(7);
    for (const row of e2e196) {
      expect(
        decomposePublicAssistantCompoundPrompt(row.prompt).map((s) => s.action),
      ).toEqual([...row.orderedActions]);
    }
  });
});

describe('e2e-bug.196 customer-surface public assistant compounds', () => {
  it.each(
    E2E196_PUBLIC_COMPOUND_LIVE_CASES.map((row) => [row.id, row] as const),
  )('customer decomposeDeterministicForSurface handles $id', (_id, row) => {
    const decomposition = decomposeDeterministicForSurface(
      'customer',
      row.prompt,
    );
    expect(decomposition?.recipeId).toBe('public_assistant_compound');
    expect(decomposition?.steps.map((s) => s.action)).toEqual([
      ...row.expectActions,
    ]);
  });
});
