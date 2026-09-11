import { describe, expect, it, jest } from '@jest/globals';
import { AiOnboardingService } from './ai-onboarding.service.js';

describe('AiOnboardingService (ai-cmd-dashboard-6.2)', () => {
  function buildService() {
    const onboardingService = {
      getStatus: jest.fn(async (_businessId: string) => ({
        completed: false,
        step: 'catalog',
        hasCatalog: false,
        hasSchedule: false,
      })),
      getBusinessTypes: jest.fn(() => []),
      getVerticalPlaybookPreview: jest.fn(async (_businessId: string) => null),
      setBusinessType: jest.fn(async (_businessId: string, _dto: any) => ({})),
      recommendCatalog: jest.fn(async (_businessId: string) => ({
        categories: [],
        summary: 'x',
        source: 'template',
        businessType: 'salon',
      })),
      applyCatalog: jest.fn(async (_businessId: string, _dto: any) => ({})),
      applyDefaultSchedule: jest.fn(
        async (_businessId: string, _userId: string) => ({}),
      ),
      skipScheduleStep: jest.fn(async (_businessId: string) => ({})),
      applyVerticalPlaybook: jest.fn(
        async (_businessId: string, _userId: string) => ({}),
      ),
      completeOnboarding: jest.fn(async (_businessId: string) => ({})),
    };
    const service = new AiOnboardingService(onboardingService as any);
    return { service, onboardingService };
  }

  it('handleExplainOnboardingStatus delegates to getStatus/getBusinessTypes', async () => {
    const { service, onboardingService } = buildService();
    const result = await service.handleExplainOnboardingStatus('biz-1');
    expect(result.action).toBe('explain_onboarding_status');
    expect(onboardingService.getStatus).toHaveBeenCalledWith('biz-1');
  });

  it('handleSetBusinessType delegates', async () => {
    const { service, onboardingService } = buildService();
    await service.handleSetBusinessType('biz-1', { businessType: 'spa' });
    expect(onboardingService.setBusinessType).toHaveBeenCalledWith('biz-1', {
      businessType: 'spa',
      notes: undefined,
    });
  });

  it('handleRecommendCatalog delegates', async () => {
    const { service, onboardingService } = buildService();
    await service.handleRecommendCatalog('biz-1');
    expect(onboardingService.recommendCatalog).toHaveBeenCalledWith('biz-1');
  });

  it('handleApplyOnboardingCatalog delegates', async () => {
    const { service, onboardingService } = buildService();
    await service.handleApplyOnboardingCatalog('biz-1', {});
    expect(onboardingService.recommendCatalog).toHaveBeenCalledWith('biz-1');
    expect(onboardingService.applyCatalog).toHaveBeenCalled();
  });

  it('handleApplyOnboardingSchedule delegates', async () => {
    const { service, onboardingService } = buildService();
    await service.handleApplyOnboardingSchedule('biz-1', 'user-1');
    expect(onboardingService.applyDefaultSchedule).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
    );
  });

  it('handleSkipOnboardingSchedule delegates', async () => {
    const { service, onboardingService } = buildService();
    await service.handleSkipOnboardingSchedule('biz-1');
    expect(onboardingService.skipScheduleStep).toHaveBeenCalledWith('biz-1');
  });

  it('handleApplyOnboardingPlaybook delegates', async () => {
    const { service, onboardingService } = buildService();
    await service.handleApplyOnboardingPlaybook('biz-1', 'user-1');
    expect(onboardingService.applyVerticalPlaybook).toHaveBeenCalledWith(
      'biz-1',
      'user-1',
    );
  });

  it('handleCompleteOnboarding delegates', async () => {
    const { service, onboardingService } = buildService();
    await service.handleCompleteOnboarding('biz-1');
    expect(onboardingService.completeOnboarding).toHaveBeenCalledWith('biz-1');
  });

  it('exposes rescue + detector passthroughs', () => {
    const { service } = buildService();
    expect(
      service.rescueOnboardingIntent('finish onboarding', 'unknown'),
    ).toEqual({ action: 'complete_onboarding', rescueReason: 'complete' });
    expect(service.isExplainOnboardingStatusPrompt('onboarding status')).toBe(
      true,
    );
    expect(service.isSetBusinessTypePrompt('we are a spa')).toBe(true);
    expect(service.isRecommendCatalogPrompt('recommend a catalog')).toBe(true);
    expect(
      service.isApplyOnboardingCatalogPrompt('apply the recommended catalog'),
    ).toBe(true);
    expect(
      service.isApplyOnboardingSchedulePrompt('apply the default schedule'),
    ).toBe(true);
    expect(
      service.isSkipOnboardingSchedulePrompt('skip the schedule step'),
    ).toBe(true);
    expect(service.isApplyOnboardingPlaybookPrompt('apply the playbook')).toBe(
      true,
    );
    expect(service.isCompleteOnboardingPrompt('finish onboarding')).toBe(true);
  });
});
