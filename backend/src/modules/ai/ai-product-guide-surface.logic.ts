import type { CommandResult } from './command-completion.types.js';
import type { AiProductGuideService } from './ai-product-guide.service.js';
import {
  buildProductGuideLogicInput,
  type ProductGuideSessionContext,
} from './ai-product-guide-session.util.js';
import type { AppGuideIntent } from './ai-product-guide.util.js';
import type { GuideFlowSurface } from './guide/guide-flow.types.js';
import {
  type ProviderProductGuideIntent,
  resolveProviderProductGuideAppIntent,
  resolveProviderProductGuideTopicId,
  rewriteProviderGuideCommandResult,
} from './ai-provider-product-guide.util.js';

export async function runSurfaceProductGuideIntent(input: {
  productGuide: AiProductGuideService;
  businessId: string;
  prompt: string;
  intent: AppGuideIntent;
  surface: GuideFlowSurface;
  session?: { context?: Record<string, unknown> };
  locale?: string;
  userId?: string;
  params?: Record<string, unknown>;
  sessionContext?: ProductGuideSessionContext;
}): Promise<CommandResult> {
  const guideInput = input.sessionContext
    ? {
        businessId: input.businessId,
        prompt: input.prompt,
        params: input.params,
        route: input.sessionContext.route,
        locale: input.locale ?? input.sessionContext.locale,
        vertical: input.sessionContext.vertical,
        role: input.sessionContext.role,
        roleProfile: input.sessionContext.roleProfile,
        retailPosEnabled: input.sessionContext.retailPosEnabled,
        enabledModules: input.sessionContext.enabledModules,
        surface: input.sessionContext.surface ?? input.surface,
        userId: input.userId,
        session: input.session,
      }
    : buildProductGuideLogicInput({
        businessId: input.businessId,
        prompt: input.prompt,
        params: input.params,
        session: input.session,
        surface: input.surface,
        locale: input.locale,
        userId: input.userId,
      });

  switch (input.intent) {
    case 'explain_app_feature':
      return input.productGuide.handleExplainAppFeatureAsync(
        input.businessId,
        input.params ?? {},
        input.prompt,
        guideInput,
      );
    case 'explain_current_screen':
      return input.productGuide.handleExplainCurrentScreenAsync(
        input.businessId,
        input.params ?? {},
        input.prompt,
        guideInput,
      );
    case 'guide_user_flow':
    default:
      return input.productGuide.handleGuideUserFlowAsync(
        input.businessId,
        input.params ?? {},
        input.prompt,
        guideInput,
      );
  }
}

/** ai-guide-1.4.1 — provider FAQ intents → unified AiProductGuideService playbooks. */
export async function runProviderProductGuideIntent(input: {
  productGuide: AiProductGuideService;
  businessId: string;
  prompt: string;
  providerIntent: ProviderProductGuideIntent;
  session?: { context?: Record<string, unknown> };
  locale?: string;
  userId?: string;
  params?: Record<string, unknown>;
  sessionContext?: ProductGuideSessionContext;
}): Promise<CommandResult> {
  const topicId = resolveProviderProductGuideTopicId(input.providerIntent);
  const appIntent = resolveProviderProductGuideAppIntent(input.providerIntent);
  const guideInput = input.sessionContext
    ? {
        businessId: input.businessId,
        prompt: input.prompt,
        params: { ...input.params, topicId },
        route: input.sessionContext.route,
        locale: input.locale ?? input.sessionContext.locale,
        vertical: input.sessionContext.vertical,
        role: input.sessionContext.role,
        roleProfile: input.sessionContext.roleProfile,
        retailPosEnabled: input.sessionContext.retailPosEnabled,
        enabledModules: input.sessionContext.enabledModules,
        surface: input.sessionContext.surface ?? 'provider',
        userId: input.userId,
        session: input.session,
      }
    : buildProductGuideLogicInput({
        businessId: input.businessId,
        prompt: input.prompt,
        params: { ...input.params, topicId },
        session: input.session,
        surface: 'provider',
        locale: input.locale,
        userId: input.userId,
      });
  const result =
    appIntent === 'explain_app_feature'
      ? input.productGuide.handleExplainAppFeature(
          input.businessId,
          { ...input.params, topicId },
          input.prompt,
          guideInput,
        )
      : appIntent === 'explain_current_screen'
        ? input.productGuide.handleExplainCurrentScreen(
            input.businessId,
            { ...input.params, topicId },
            input.prompt,
            guideInput,
          )
        : input.productGuide.handleGuideUserFlow(
            input.businessId,
            { ...input.params, topicId },
            input.prompt,
            guideInput,
          );
  return rewriteProviderGuideCommandResult(input.providerIntent, result);
}

export function mapCommandResultGuideNavigate(
  result: CommandResult,
): CommandResult {
  if (!result.guide?.navigate) return result;
  return {
    ...result,
    details: {
      ...result.details,
      navigate: result.guide.navigate,
    },
  };
}
