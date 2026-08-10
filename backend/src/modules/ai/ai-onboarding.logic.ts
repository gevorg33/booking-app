import type { OnboardingService } from '../onboarding/onboarding.service.js';
import type { CommandResult } from './command-completion.types.js';

export interface OnboardingLogicDeps {
  onboardingService: OnboardingService;
}

function failure(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: false, action, summary, details };
}

function success(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: true, action, summary, details };
}

export async function handleExplainOnboardingStatusLogic(
  deps: OnboardingLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const [status, businessTypes] = await Promise.all([
    deps.onboardingService.getStatus(businessId),
    Promise.resolve(deps.onboardingService.getBusinessTypes()),
  ]);

  let playbook: unknown = null;
  if (status.businessType) {
    try {
      playbook =
        await deps.onboardingService.getVerticalPlaybookPreview(businessId);
    } catch {
      playbook = null;
    }
  }

  return success(
    'explain_onboarding_status',
    status.completed
      ? 'Onboarding is complete.'
      : `Onboarding step: ${status.step}. ${status.hasCatalog ? 'Catalog set up.' : 'Catalog not set up yet.'} ${status.hasSchedule ? 'Schedule set up.' : 'Schedule not set up yet.'}`,
    { status, businessTypes, playbook },
  );
}

export async function handleSetBusinessTypeLogic(
  deps: OnboardingLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const businessType =
    typeof params.businessType === 'string' ? params.businessType.trim() : '';
  if (!businessType) {
    return failure(
      'set_business_type',
      'Which business type — e.g. salon, spa, clinic, tour operator?',
      { clarify: true, missing: ['businessType'] },
    );
  }

  try {
    const result = await deps.onboardingService.setBusinessType(businessId, {
      businessType,
      notes: typeof params.notes === 'string' ? params.notes : undefined,
    });
    return success(
      'set_business_type',
      `Business type set to ${businessType}.`,
      { result },
    );
  } catch (err: any) {
    return failure(
      'set_business_type',
      err?.message ?? 'Could not set the business type.',
    );
  }
}

export async function handleRecommendCatalogLogic(
  deps: OnboardingLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  try {
    const recommendation =
      await deps.onboardingService.recommendCatalog(businessId);
    return success(
      'recommend_catalog',
      `${recommendation.summary} (${recommendation.categories.length} categor${recommendation.categories.length === 1 ? 'y' : 'ies'}).`,
      { recommendation },
    );
  } catch (err: any) {
    return failure(
      'recommend_catalog',
      err?.message ?? 'Could not generate a catalog recommendation.',
    );
  }
}

export async function handleApplyOnboardingCatalogLogic(
  deps: OnboardingLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  try {
    const categories = Array.isArray(params.categories)
      ? params.categories
      : (await deps.onboardingService.recommendCatalog(businessId)).categories;

    const result = await deps.onboardingService.applyCatalog(businessId, {
      categories,
    });
    return success(
      'apply_onboarding_catalog',
      `Applied catalog with ${categories.length} categor${categories.length === 1 ? 'y' : 'ies'}.`,
      { result },
    );
  } catch (err: any) {
    return failure(
      'apply_onboarding_catalog',
      err?.message ?? 'Could not apply the catalog.',
    );
  }
}

export async function handleApplyOnboardingScheduleLogic(
  deps: OnboardingLogicDeps,
  businessId: string,
  userId: string,
): Promise<CommandResult> {
  try {
    const result = await deps.onboardingService.applyDefaultSchedule(
      businessId,
      userId,
    );
    return success(
      'apply_onboarding_schedule',
      'Applied the default schedule.',
      { result },
    );
  } catch (err: any) {
    return failure(
      'apply_onboarding_schedule',
      err?.message ?? 'Could not apply the default schedule.',
    );
  }
}

export async function handleSkipOnboardingScheduleLogic(
  deps: OnboardingLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  try {
    const result = await deps.onboardingService.skipScheduleStep(businessId);
    return success(
      'skip_onboarding_schedule',
      'Skipped the schedule setup step.',
      { result },
    );
  } catch (err: any) {
    return failure(
      'skip_onboarding_schedule',
      err?.message ?? 'Could not skip the schedule step.',
    );
  }
}

export async function handleApplyOnboardingPlaybookLogic(
  deps: OnboardingLogicDeps,
  businessId: string,
  userId: string,
): Promise<CommandResult> {
  try {
    const result = await deps.onboardingService.applyVerticalPlaybook(
      businessId,
      userId,
    );
    return success(
      'apply_onboarding_playbook',
      'Applied the vertical playbook.',
      { result },
    );
  } catch (err: any) {
    return failure(
      'apply_onboarding_playbook',
      err?.message ?? 'Could not apply the vertical playbook.',
    );
  }
}

export async function handleCompleteOnboardingLogic(
  deps: OnboardingLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  try {
    const result = await deps.onboardingService.completeOnboarding(businessId);
    return success('complete_onboarding', 'Onboarding marked complete.', {
      result,
    });
  } catch (err: any) {
    return failure(
      'complete_onboarding',
      err?.message ?? 'Could not complete onboarding.',
    );
  }
}
