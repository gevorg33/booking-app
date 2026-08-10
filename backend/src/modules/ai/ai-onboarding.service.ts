import { Injectable } from '@nestjs/common';
import type { CommandResult } from './command-completion.types.js';
import { OnboardingService } from '../onboarding/onboarding.service.js';
import {
  rescueOnboardingIntent,
  isExplainOnboardingStatusPrompt,
  isSetBusinessTypePrompt,
  isRecommendCatalogPrompt,
  isApplyOnboardingCatalogPrompt,
  isApplyOnboardingSchedulePrompt,
  isSkipOnboardingSchedulePrompt,
  isApplyOnboardingPlaybookPrompt,
  isCompleteOnboardingPrompt,
} from './ai-onboarding.util.js';
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
import { dispatchOnboardingLogicIntent } from './ai-onboarding-dispatch.util.js';
import type { OnboardingDispatchContext } from './ai-onboarding-dispatch.build.js';

@Injectable()
export class AiOnboardingService {
  private readonly deps: OnboardingLogicDeps;

  constructor(onboardingService: OnboardingService) {
    this.deps = { onboardingService };
  }

  rescueOnboardingIntent(prompt: string, action: string) {
    return rescueOnboardingIntent(prompt, action);
  }

  isExplainOnboardingStatusPrompt(prompt: string) {
    return isExplainOnboardingStatusPrompt(prompt);
  }

  isSetBusinessTypePrompt(prompt: string) {
    return isSetBusinessTypePrompt(prompt);
  }

  isRecommendCatalogPrompt(prompt: string) {
    return isRecommendCatalogPrompt(prompt);
  }

  isApplyOnboardingCatalogPrompt(prompt: string) {
    return isApplyOnboardingCatalogPrompt(prompt);
  }

  isApplyOnboardingSchedulePrompt(prompt: string) {
    return isApplyOnboardingSchedulePrompt(prompt);
  }

  isSkipOnboardingSchedulePrompt(prompt: string) {
    return isSkipOnboardingSchedulePrompt(prompt);
  }

  isApplyOnboardingPlaybookPrompt(prompt: string) {
    return isApplyOnboardingPlaybookPrompt(prompt);
  }

  isCompleteOnboardingPrompt(prompt: string) {
    return isCompleteOnboardingPrompt(prompt);
  }

  handleExplainOnboardingStatus(businessId: string) {
    return handleExplainOnboardingStatusLogic(this.deps, businessId);
  }

  handleSetBusinessType(businessId: string, params: Record<string, any>) {
    return handleSetBusinessTypeLogic(this.deps, businessId, params);
  }

  handleRecommendCatalog(businessId: string) {
    return handleRecommendCatalogLogic(this.deps, businessId);
  }

  handleApplyOnboardingCatalog(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleApplyOnboardingCatalogLogic(this.deps, businessId, params);
  }

  handleApplyOnboardingSchedule(businessId: string, userId: string) {
    return handleApplyOnboardingScheduleLogic(this.deps, businessId, userId);
  }

  handleSkipOnboardingSchedule(businessId: string) {
    return handleSkipOnboardingScheduleLogic(this.deps, businessId);
  }

  handleApplyOnboardingPlaybook(businessId: string, userId: string) {
    return handleApplyOnboardingPlaybookLogic(this.deps, businessId, userId);
  }

  handleCompleteOnboarding(businessId: string) {
    return handleCompleteOnboardingLogic(this.deps, businessId);
  }

  /** Registry-driven dispatch (ai-cmd-ext-0.5). Returns null when action is not an onboarding intent. */
  dispatchIntent(
    ctx: OnboardingDispatchContext,
  ): Promise<CommandResult | null> {
    return dispatchOnboardingLogicIntent(this.deps, ctx);
  }
}
