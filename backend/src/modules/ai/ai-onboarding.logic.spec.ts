import { describe, expect, it, jest } from '@jest/globals';
import {
  handleExplainOnboardingStatusLogic,
  handleSetBusinessTypeLogic,
  handleRecommendCatalogLogic,
  handleApplyOnboardingCatalogLogic,
  handleApplyOnboardingScheduleLogic,
  handleSkipOnboardingScheduleLogic,
  handleApplyOnboardingPlaybookLogic,
  handleCompleteOnboardingLogic,
  type OnboardingLogicDeps,
} from './ai-onboarding.logic.js';

function buildDeps(overrides: Record<string, any> = {}): OnboardingLogicDeps {
  return {
    onboardingService: {
      getStatus: jest.fn(async (_businessId: string) => ({
        completed: false,
        step: 'catalog',
        businessType: 'salon',
        hasCatalog: false,
        hasSchedule: false,
      })),
      getBusinessTypes: jest.fn(() => ['salon', 'spa', 'clinic']),
      getVerticalPlaybookPreview: jest.fn(async (_businessId: string) => ({
        categories: [],
      })),
      setBusinessType: jest.fn(async (_businessId: string, dto: any) => ({
        businessType: dto.businessType,
      })),
      recommendCatalog: jest.fn(async (_businessId: string) => ({
        categories: [{ name: 'Hair', services: [] }],
        summary: 'Starter salon catalog.',
        source: 'template',
        businessType: 'salon',
      })),
      applyCatalog: jest.fn(async (_businessId: string, dto: any) => ({
        applied: dto.categories.length,
      })),
      applyDefaultSchedule: jest.fn(
        async (_businessId: string, _userId: string) => ({
          applied: true,
        }),
      ),
      skipScheduleStep: jest.fn(async (_businessId: string) => ({
        skipped: true,
      })),
      applyVerticalPlaybook: jest.fn(
        async (_businessId: string, _userId: string) => ({
          applied: true,
        }),
      ),
      completeOnboarding: jest.fn(async (_businessId: string) => ({
        completed: true,
      })),
      ...overrides.onboardingService,
    },
  } as any;
}

describe('ai-onboarding.logic (ai-cmd-dashboard-6.2)', () => {
  it('handleExplainOnboardingStatusLogic summarizes status', async () => {
    const deps = buildDeps();
    const result = await handleExplainOnboardingStatusLogic(deps, 'biz-1');
    expect(result.success).toBe(true);
    expect(result.summary).toContain('catalog');
  });

  describe('handleSetBusinessTypeLogic', () => {
    it('asks for clarification when businessType missing', async () => {
      const deps = buildDeps();
      const result = await handleSetBusinessTypeLogic(deps, 'biz-1', {});
      expect(result.success).toBe(false);
      expect(result.details).toMatchObject({ clarify: true });
    });

    it('sets the business type', async () => {
      const deps = buildDeps();
      const result = await handleSetBusinessTypeLogic(deps, 'biz-1', {
        businessType: 'spa',
      });
      expect(result.success).toBe(true);
      expect(deps.onboardingService.setBusinessType).toHaveBeenCalledWith(
        'biz-1',
        { businessType: 'spa', notes: undefined },
      );
    });
  });

  it('handleRecommendCatalogLogic returns the recommendation', async () => {
    const deps = buildDeps();
    const result = await handleRecommendCatalogLogic(deps, 'biz-1');
    expect(result.success).toBe(true);
    expect(result.details).toMatchObject({
      recommendation: { summary: 'Starter salon catalog.' },
    });
  });

  describe('handleApplyOnboardingCatalogLogic', () => {
    it('auto-fetches the recommendation when no categories are given', async () => {
      const deps = buildDeps();
      const result = await handleApplyOnboardingCatalogLogic(deps, 'biz-1', {});
      expect(result.success).toBe(true);
      expect(deps.onboardingService.recommendCatalog).toHaveBeenCalledWith(
        'biz-1',
      );
      expect(deps.onboardingService.applyCatalog).toHaveBeenCalledWith(
        'biz-1',
        { categories: [{ name: 'Hair', services: [] }] },
      );
    });

    it('uses explicit categories when given', async () => {
      const deps = buildDeps();
      const categories = [{ name: 'Custom', services: [] }];
      const result = await handleApplyOnboardingCatalogLogic(deps, 'biz-1', {
        categories,
      });
      expect(result.success).toBe(true);
      expect(deps.onboardingService.recommendCatalog).not.toHaveBeenCalled();
      expect(deps.onboardingService.applyCatalog).toHaveBeenCalledWith(
        'biz-1',
        { categories },
      );
    });
  });

  it('handleApplyOnboardingScheduleLogic applies the default schedule', async () => {
    const deps = buildDeps();
    const result = await handleApplyOnboardingScheduleLogic(
      deps,
      'biz-1',
      'user-1',
    );
    expect(result.success).toBe(true);
    expect(deps.onboardingService.applyDefaultSchedule).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
    );
  });

  it('handleSkipOnboardingScheduleLogic skips the step', async () => {
    const deps = buildDeps();
    const result = await handleSkipOnboardingScheduleLogic(deps, 'biz-1');
    expect(result.success).toBe(true);
  });

  it('handleApplyOnboardingPlaybookLogic applies the playbook', async () => {
    const deps = buildDeps();
    const result = await handleApplyOnboardingPlaybookLogic(
      deps,
      'biz-1',
      'user-1',
    );
    expect(result.success).toBe(true);
    expect(deps.onboardingService.applyVerticalPlaybook).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
    );
  });

  it('handleCompleteOnboardingLogic marks onboarding complete', async () => {
    const deps = buildDeps();
    const result = await handleCompleteOnboardingLogic(deps, 'biz-1');
    expect(result.success).toBe(true);
  });

  it('handles errors gracefully', async () => {
    const deps = buildDeps({
      onboardingService: {
        completeOnboarding: jest.fn(async () => {
          throw new Error('Catalog required before completing onboarding');
        }),
      },
    });
    const result = await handleCompleteOnboardingLogic(deps, 'biz-1');
    expect(result.success).toBe(false);
    expect(result.summary).toContain('Catalog required');
  });
});
