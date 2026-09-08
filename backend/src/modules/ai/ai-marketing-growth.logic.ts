import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import type { MarketingAutomationService } from '../marketing-automation/marketing-automation.service.js';
import type { PlanEntitlementsService } from '../billing/plan-entitlements.service.js';
import type { BillingService } from '../billing/billing.service.js';
import type { LoyaltyService } from '../loyalty/loyalty.service.js';
import type { PromoCodesService } from '../promo-codes/promo-codes.service.js';
import type { StripeService } from '../billing/stripe.service.js';
import type { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import type { TenantAppInstallService } from '../business/tenant-app-install.service.js';
import { getActivePlans, getPlan } from '../billing/plans.js';
import {
  TOP_SUBSCRIPTION_PLAN_ID,
  UPGRADE_PLAN_ID,
  type PlanTierId,
} from '../billing/plan-limits.js';
import type { CommandResult } from './command-completion.types.js';
import { resolveDateRange as resolveFullDateRange } from './ai-orchestration.helpers.js';
import {
  getUtcBoundsForDateKey,
  resolveTimezone,
} from '../../common/utils/timezone.util.js';
import {
  buildConsumerAppSwitchGuidance,
  decomposeMarketingGrowthCompoundPrompt,
  extractAutomationToggleFromPrompt,
  extractInactiveDaysFromPrompt,
  extractPromoCodeFromPrompt,
  extractReengagementPromoFromPrompt,
  formatEntitlementsSummary,
  type MarketingGrowthCompoundStep,
} from './ai-marketing-growth.util.js';
import { buildHowToDownloadAppGuidance } from './ai-how-to-download-app.util.js';
import { getEarnPercentCashback } from '../loyalty/loyalty-settings.util.js';
import { handleConfigureStripeConnectLogic } from './ai-stripe-connect.logic.js';
import { handleExplainTenantAppInstallLogic } from './ai-tenant-app-install.logic.js';
import { handleRegenerateTenantAppInstallQrLogic } from './ai-tenant-app-install.logic.js';
import { handleCreatePromoCodeLogic } from './ai-create-promo-code.logic.js';
import { handleConfigureLoyaltySettingsLogic } from './ai-configure-loyalty-settings.logic.js';
import { handleExplainLoyaltyPointsLogic } from './ai-explain-loyalty-points.logic.js';
import { handleApplyPromoCodeCheckoutLogic } from './ai-apply-promo-code-checkout.logic.js';
import { handleApplyLoyaltyAtCheckoutLogic } from './ai-apply-loyalty-at-checkout.logic.js';

export interface MarketingGrowthLogicDeps {
  marketingAutomationService: MarketingAutomationService;
  planEntitlementsService: PlanEntitlementsService;
  billingService: BillingService;
  loyaltyService: LoyaltyService;
  promoCodesService?: PromoCodesService;
  stripeService: StripeService;
  stripeIntegrationService: StripeIntegrationService;
  configService: ConfigService;
  customerRepo: Repository<Customer>;
  businessRepo: Repository<Business>;
  tenantAppInstallService: TenantAppInstallService;
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
  details: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details };
}

const DATE_RANGE_PHRASES: Record<string, string> = {
  this_month: 'this month',
  this_week: 'this week',
  // e2e-bug.467 / §217 — `ai-retail-finance.util.ts` emits both of these and
  // neither had a key here, so the enum value was dropped and the raw prompt
  // used instead. The resolver now understands the phrases too.
  this_quarter: 'this quarter',
  this_year: 'this year',
};

function resolveMarketingDateRange(
  params: Record<string, any>,
  prompt?: string,
): { from?: Date; to?: Date } {
  if (params.from || params.to) {
    return {
      from: params.from ? new Date(params.from as string) : undefined,
      to: params.to ? new Date(params.to as string) : undefined,
    };
  }
  // The structured `dateRange` enum and the free-text prompt describe the same
  // spans, so both go through the canonical resolver rather than being parsed
  // twice. Routing the enum as its English phrase keeps that single path.
  const phrase = DATE_RANGE_PHRASES[params.dateRange as string];
  const timeZone = resolveTimezone(params._timeZone as string | undefined);
  const range = resolveFullDateRange(
    { _timeZone: params._timeZone as string | undefined },
    phrase ?? prompt ?? (params._prompt as string) ?? '',
  );
  if (!range) return {};

  // e2e-bug.466 / §218 — the two branches used to close differently: the enum
  // on the last millisecond of the end day, the prompt on its midnight. Since
  // `Between` is inclusive of neither past its bound, "this month" typed as
  // free text under-reported by a whole day against the identical request sent
  // as `dateRange: 'this_month'`. Both now close at end of day.
  //
  // The bounds are also converted in the business's own timezone rather than
  // pinned to UTC. `resolveFullDateRange` computes the day keys in `_timeZone`
  // already, so anchoring them at `T00:00:00.000Z` re-interpreted those local
  // days as UTC days and slid the whole window by the offset — for Asia/Yerevan
  // (UTC+4) that dropped the first four hours of the range and added the last
  // four of the day before.
  return {
    from: getUtcBoundsForDateKey(range.start, timeZone).start,
    to: getUtcBoundsForDateKey(range.end, timeZone).end,
  };
}

function recommendNextPlan(
  tierId: PlanTierId,
): { planId: string; tierName: string; reason: string } | null {
  if (tierId === 'solo') {
    const plan = getPlan(UPGRADE_PLAN_ID);
    return {
      planId: UPGRADE_PLAN_ID,
      tierName: plan?.name ?? 'Starter',
      reason:
        'Unlock more provider seats, AI commands, Stripe Connect, and promo codes.',
    };
  }
  if (tierId === 'starter') {
    const plan = getPlan(TOP_SUBSCRIPTION_PLAN_ID);
    return {
      planId: TOP_SUBSCRIPTION_PLAN_ID,
      tierName: plan?.name ?? 'Business',
      reason:
        'Unlock loyalty, memberships, gift cards, and higher seat/AI limits.',
    };
  }
  return null;
}

export async function handleConfigureMarketingAutomationLogic(
  deps: MarketingGrowthLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const promptText = prompt ?? (params._prompt as string) ?? '';
  const dto: Record<string, unknown> = {};

  if (params.reEngagementEnabled !== undefined)
    dto.reEngagementEnabled = params.reEngagementEnabled;
  else {
    const toggle = extractAutomationToggleFromPrompt(promptText);
    if (toggle !== null) dto.reEngagementEnabled = toggle;
  }

  if (params.inactiveDaysThreshold !== undefined) {
    dto.inactiveDaysThreshold = params.inactiveDaysThreshold;
  } else {
    const days = extractInactiveDaysFromPrompt(promptText);
    if (days !== null) dto.inactiveDaysThreshold = days;
  }

  if (params.reEngagementPromoCode !== undefined) {
    dto.reEngagementPromoCode = params.reEngagementPromoCode;
  } else {
    const promo = extractReengagementPromoFromPrompt(promptText);
    if (promo) dto.reEngagementPromoCode = promo;
  }

  if (params.postVisitReviewEnabled !== undefined) {
    dto.postVisitReviewEnabled = params.postVisitReviewEnabled;
  }
  if (params.reEngagementEmailEnabled !== undefined) {
    dto.reEngagementEmailEnabled = params.reEngagementEmailEnabled;
  }
  if (params.reEngagementSmsEnabled !== undefined) {
    dto.reEngagementSmsEnabled = params.reEngagementSmsEnabled;
  }
  if (params.minDaysBetweenReEngagement !== undefined) {
    dto.minDaysBetweenReEngagement = params.minDaysBetweenReEngagement;
  }

  if (!Object.keys(dto).length) {
    if (
      /\b(configure|set up|update)\b/i.test(promptText) &&
      /\bautomation\b/i.test(promptText)
    ) {
      dto.reEngagementEnabled = true;
    } else {
      return failure(
        'configure_marketing_automation',
        'Specify automation settings to update.',
        {
          clarify: true,
          missing: ['reEngagementEnabled'],
          current:
            await deps.marketingAutomationService.getSettings(businessId),
        },
      );
    }
  }

  try {
    const settings = await deps.marketingAutomationService.updateSettings(
      businessId,
      dto,
    );
    return success(
      'configure_marketing_automation',
      `Marketing automation updated — re-engagement ${settings.reEngagementEnabled ? 'enabled' : 'disabled'}.`,
      { settings },
    );
  } catch (err: any) {
    return failure(
      'configure_marketing_automation',
      err?.message ?? 'Could not update automation settings.',
    );
  }
}

export async function handleSummarizeAutomationPerformanceLogic(
  deps: MarketingGrowthLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  try {
    const summary =
      await deps.marketingAutomationService.getSummary(businessId);
    return success(
      'summarize_automation_performance',
      `Automation — ${summary.eligibleInactiveCustomers} inactive customer(s), ${summary.reEngagementSentLast30Days} re-engagement message(s) sent in last 30 days.`,
      { summary },
    );
  } catch (err: any) {
    return failure(
      'summarize_automation_performance',
      err?.message ?? 'Could not summarize automation performance.',
    );
  }
}

export async function handleTriggerReengagementLogic(
  deps: MarketingGrowthLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  try {
    const sent =
      await deps.marketingAutomationService.processBusinessReEngagement(
        businessId,
      );
    return success(
      'trigger_reengagement',
      sent
        ? `Re-engagement run complete — ${sent} message(s) sent.`
        : 'Re-engagement run complete — no eligible customers or automation disabled.',
      { sent },
    );
  } catch (err: any) {
    return failure(
      'trigger_reengagement',
      err?.message ?? 'Could not trigger re-engagement.',
    );
  }
}

export async function handleListInactiveCustomersLogic(
  deps: MarketingGrowthLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  try {
    const settings =
      await deps.marketingAutomationService.getSettings(businessId);
    const candidates =
      await deps.marketingAutomationService.findReEngagementCandidates(
        businessId,
        settings,
      );
    return success(
      'list_inactive_customers',
      candidates.length
        ? `${candidates.length} inactive customer(s) eligible for re-engagement.`
        : 'No inactive customers eligible for re-engagement.',
      {
        candidates,
        count: candidates.length,
        inactiveDaysThreshold: settings.inactiveDaysThreshold,
      },
    );
  } catch (err: any) {
    return failure(
      'list_inactive_customers',
      err?.message ?? 'Could not list inactive customers.',
    );
  }
}

export async function handleExplainPlanLimitsLogic(
  deps: MarketingGrowthLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  try {
    const entitlements =
      await deps.planEntitlementsService.getEntitlements(businessId);
    const formatted = formatEntitlementsSummary(entitlements);
    return success('explain_plan_limits', formatted, {
      entitlements,
      formatted,
    });
  } catch (err: any) {
    return failure(
      'explain_plan_limits',
      err?.message ?? 'Could not explain plan limits.',
    );
  }
}

export async function handleSuggestUpgradeLogic(
  deps: MarketingGrowthLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  try {
    const entitlements =
      await deps.planEntitlementsService.getEntitlements(businessId);
    const recommendation = recommendNextPlan(entitlements.tierId);
    if (!recommendation) {
      return success(
        'suggest_upgrade',
        `You are on the ${entitlements.tierName} plan — no higher tier is available.`,
        { entitlements, recommendation: null },
      );
    }

    const atLimitNote =
      entitlements.atLimit.providerSeats || entitlements.atLimit.aiCommands
        ? ' You are at or near a plan limit.'
        : '';

    return success(
      'suggest_upgrade',
      `Recommend upgrading to ${recommendation.tierName} (${recommendation.planId}). ${recommendation.reason}${atLimitNote}`,
      {
        entitlements,
        recommendation,
        upgradePlanId: recommendation.planId,
      },
    );
  } catch (err: any) {
    return failure(
      'suggest_upgrade',
      err?.message ?? 'Could not suggest upgrade.',
    );
  }
}

export async function handleToggleAnnualBillingLogic(
  deps: MarketingGrowthLogicDeps,
  businessId: string,
  params: Record<string, any>,
  userEmail?: string,
): Promise<CommandResult> {
  try {
    const subscription = await deps.billingService.getSubscription(businessId);
    const planId =
      (params.planId as string | undefined) ??
      subscription.planId ??
      UPGRADE_PLAN_ID;
    const plan = getPlan(planId);

    if (!deps.stripeService.isConfigured) {
      const activePlans = getActivePlans().map((p) => ({
        id: p.id,
        name: p.name,
        priceMonthly: p.priceMonthly,
        priceAnnual: p.priceAnnual,
        currency: p.currency,
      }));
      return success(
        'toggle_annual_billing',
        plan
          ? `Annual billing saves ~20% — ${plan.name} is $${plan.priceAnnual}/year (vs $${plan.priceMonthly * 12}/year monthly). Stripe checkout is not configured on this server.`
          : 'Annual billing saves ~20% vs paying monthly. Stripe checkout is not configured on this server.',
        {
          stripeConfigured: false,
          plan,
          annualPlans: activePlans,
          currentSubscription: subscription,
        },
      );
    }

    const checkout = await deps.billingService.createCheckoutSession(
      businessId,
      planId,
      userEmail ?? 'billing@example.com',
      'year',
    );
    return success(
      'toggle_annual_billing',
      'Annual billing checkout session created — open the link to switch to yearly billing.',
      { checkoutUrl: checkout.url, planId, billingInterval: 'year' },
    );
  } catch (err: any) {
    return failure(
      'toggle_annual_billing',
      err?.message ?? 'Could not start annual billing checkout.',
    );
  }
}

export async function handleSummarizeNewRegistrationsLogic(
  deps: MarketingGrowthLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const { from, to } = resolveMarketingDateRange(
    params,
    prompt ?? (params._prompt as string),
  );
  try {
    const where: Record<string, unknown> = { businessId };
    if (from && to) {
      where.createdAt = Between(from, to);
    } else if (from) {
      where.createdAt = MoreThanOrEqual(from);
    } else if (to) {
      where.createdAt = LessThanOrEqual(to);
    }

    const count = await deps.customerRepo.count({ where: where });
    const rangeLabel = from || to ? ' in the selected date range' : '';
    return success(
      'summarize_new_registrations',
      `${count} new customer registration(s)${rangeLabel}.`,
      { count, from: from?.toISOString(), to: to?.toISOString() },
    );
  } catch (err: any) {
    return failure(
      'summarize_new_registrations',
      err?.message ?? 'Could not summarize new registrations.',
    );
  }
}

export async function handleHowToDownloadAppLogic(
  deps: MarketingGrowthLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const frontendUrl =
    deps.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  const iosAppUrl = deps.configService.get<string>('CONSUMER_IOS_APP_URL');
  const androidAppUrl = deps.configService.get<string>(
    'CONSUMER_ANDROID_APP_URL',
  );

  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business) {
    return failure('how_to_download_app', 'Business not found.');
  }

  const view = await deps.tenantAppInstallService.ensureForBusiness(business);
  const guidance = buildHowToDownloadAppGuidance({
    view,
    iosAppUrl,
    androidAppUrl,
  });

  return success('how_to_download_app', guidance.summary, {
    guidance,
    appInstall: view,
    frontendUrl,
  });
}

export async function handleSwitchToConsumerAppLogic(
  deps: MarketingGrowthLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  const frontendUrl =
    deps.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  const view = business
    ? await deps.tenantAppInstallService.ensureForBusiness(business)
    : null;
  const guidance = buildConsumerAppSwitchGuidance({
    frontendUrl,
    businessSlug: business?.slug ?? null,
    view,
  });
  return success('switch_to_consumer_app', guidance.summary, { guidance });
}

export async function handlePromoCodeHelpLogic(
  deps: MarketingGrowthLogicDeps,
  businessId: string,
  params: Record<string, any>,
  prompt?: string,
): Promise<CommandResult> {
  const promptText = prompt ?? (params._prompt as string) ?? '';
  const code =
    (params.promoCode as string | undefined) ??
    (params.code as string | undefined) ??
    extractPromoCodeFromPrompt(promptText);

  const explanation =
    'Promo codes apply a percent or fixed discount at checkout. Enter the code on the booking or gift-card checkout page before paying. Codes may have expiry dates, usage limits, and minimum order amounts.';

  if (!code || !deps.promoCodesService) {
    return success('promo_code_help', explanation, {
      explanation,
      validated: false,
    });
  }

  try {
    const promo = await deps.promoCodesService.findValidForCheckout(
      businessId,
      code,
      100,
    );
    return success(
      'promo_code_help',
      `${explanation} Code "${promo.code}" is valid (${promo.discountType} ${promo.discountValue}).`,
      {
        explanation,
        validated: true,
        promo: {
          code: promo.code,
          discountType: promo.discountType,
          discountValue: promo.discountValue,
          minOrderAmount: promo.minOrderAmount,
          expiresAt: promo.expiresAt,
        },
      },
    );
  } catch (err: any) {
    return success(
      'promo_code_help',
      `${explanation} Code "${code}" could not be validated: ${err?.message ?? 'invalid'}.`,
      { explanation, validated: false, code, validationError: err?.message },
    );
  }
}

export async function handleLoyaltyPointsBalanceLogic(
  deps: MarketingGrowthLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const customerId = params.sessionCustomerId as string | undefined;
  if (!customerId) {
    return failure(
      'loyalty_points_balance',
      'Sign in to view your loyalty points balance.',
      {
        clarify: true,
        missing: ['sessionCustomerId'],
      },
    );
  }

  try {
    const business = await deps.businessRepo.findOne({
      where: { id: businessId },
    });
    const { account } = await deps.loyaltyService.getBalance(
      businessId,
      customerId,
    );
    const summary = deps.loyaltyService.getPublicSummary(
      account,
      business?.settings,
    );
    return success(
      'loyalty_points_balance',
      `You have ${summary.pointsBalance} loyalty points (≈ $${summary.pointsValue} value).`,
      { account, summary },
    );
  } catch (err: any) {
    return failure(
      'loyalty_points_balance',
      err?.message ?? 'Could not load loyalty balance.',
    );
  }
}

export async function handleOpenBillingSettingsLogic(
  deps: MarketingGrowthLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  try {
    const entitlements =
      await deps.planEntitlementsService.getEntitlements(businessId);
    const portal = await deps.billingService.createPortalSession(businessId);
    const formatted = formatEntitlementsSummary(entitlements);
    return success(
      'open_billing_settings',
      `${formatted}\n\nManage billing: ${portal.url}`,
      { entitlements, portalUrl: portal.url },
    );
  } catch (err: any) {
    return failure(
      'open_billing_settings',
      err?.message ?? 'Could not open billing settings.',
    );
  }
}

export async function handleStartBillingCheckoutLogic(
  deps: MarketingGrowthLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
  if (!business)
    return failure('start_billing_checkout', 'Business not found.');

  const planId =
    typeof params.planId === 'string' && params.planId.trim()
      ? params.planId.trim()
      : undefined;
  const planName =
    typeof params.planName === 'string' && params.planName.trim()
      ? params.planName.trim()
      : undefined;

  const plan = planId
    ? getPlan(planId)
    : planName
      ? (getActivePlans().find(
          (p) => p.name.toLowerCase() === planName.toLowerCase(),
        ) ??
        getActivePlans().find((p) =>
          p.name.toLowerCase().includes(planName.toLowerCase()),
        ))
      : undefined;

  if (!plan) {
    return failure(
      'start_billing_checkout',
      'Which plan would you like to check out? Provide planName or planId.',
      { clarify: true, missing: ['planName'] },
    );
  }

  const billingInterval = params.billingInterval === 'year' ? 'year' : 'month';

  try {
    const session = await deps.billingService.createCheckoutSession(
      businessId,
      plan.id,
      business.email ?? '',
      billingInterval,
    );
    return success(
      'start_billing_checkout',
      `Opening checkout for the ${plan.name} plan (billed ${billingInterval}ly): ${session.url}`,
      {
        checkoutUrl: session.url,
        planId: plan.id,
        billingInterval,
        navigate: { url: session.url },
      },
    );
  } catch (err: any) {
    return failure(
      'start_billing_checkout',
      err?.message ?? 'Could not start billing checkout.',
    );
  }
}

export async function handleConfirmBillingCheckoutLogic(
  deps: MarketingGrowthLogicDeps,
  businessId: string,
  params: Record<string, any>,
): Promise<CommandResult> {
  const sessionId =
    typeof params.sessionId === 'string' ? params.sessionId.trim() : '';
  if (!sessionId) {
    return failure(
      'confirm_billing_checkout',
      'Provide the Stripe checkout sessionId to confirm (returned in the redirect URL after checkout).',
      { clarify: true, missing: ['sessionId'] },
    );
  }

  try {
    const subscription = await deps.billingService.confirmCheckoutSession(
      businessId,
      sessionId,
    );
    return success(
      'confirm_billing_checkout',
      subscription.isActive
        ? `Checkout confirmed — subscribed to ${subscription.plan?.name ?? subscription.planId} (${subscription.status}).`
        : `Checkout session processed, but the subscription is not active yet (status: ${subscription.status}).`,
      { subscription },
    );
  } catch (err: any) {
    return failure(
      'confirm_billing_checkout',
      err?.message ?? 'Could not confirm the billing checkout.',
    );
  }
}

export async function handleExplainPlanEntitlementsLogic(
  deps: MarketingGrowthLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  try {
    const entitlements =
      await deps.planEntitlementsService.getEntitlements(businessId);
    return success(
      'explain_plan_entitlements',
      formatEntitlementsSummary(entitlements),
      { entitlements },
    );
  } catch (err: any) {
    return failure(
      'explain_plan_entitlements',
      err?.message ?? 'Could not read plan entitlements.',
    );
  }
}

export async function handleSummarizeLoyaltyProgramLogic(
  deps: MarketingGrowthLogicDeps,
  businessId: string,
): Promise<CommandResult> {
  try {
    const business = await deps.businessRepo.findOne({
      where: { id: businessId },
    });
    const earnPercent = getEarnPercentCashback(business?.settings);
    const enabled =
      (business?.settings?.loyalty as Record<string, unknown> | undefined)
        ?.enabled !== false;
    const summary = enabled
      ? `Loyalty program is enabled — customers earn ${earnPercent}% back as points ($1 per point). Configure earn rules in Loyalty settings.`
      : 'Loyalty program is disabled. Enable it in Loyalty settings to reward repeat customers.';
    return success('summarize_loyalty_program', summary, {
      enabled,
      earnPercentCashback: earnPercent,
    });
  } catch (err: any) {
    return failure(
      'summarize_loyalty_program',
      err?.message ?? 'Could not summarize loyalty program.',
    );
  }
}

export function mergeMarketingGrowthCompoundContext(
  context: Record<string, unknown>,
  step: MarketingGrowthCompoundStep,
  result: CommandResult,
): Record<string, unknown> {
  const details = result.details as Record<string, unknown>;
  const next = { ...context };

  if (step.action === 'configure_marketing_automation' && details.settings) {
    next.automationConfigured = true;
  }
  if (step.action === 'list_inactive_customers' && details.count) {
    next.inactiveCustomerCount = details.count;
  }
  if (step.action === 'explain_plan_limits' && details.entitlements) {
    next.planEntitlements = details.entitlements;
  }
  if (step.action === 'how_to_download_app' && details.guidance) {
    next.consumerAppGuidance = details.guidance;
  }
  if (step.action === 'explain_tenant_app_install' && details.appInstall) {
    next.tenantAppInstall = details.appInstall;
  }
  if (
    step.action === 'regenerate_tenant_app_install_qr' &&
    details.appInstall
  ) {
    next.tenantAppInstall = details.appInstall;
    next.tenantAppInstallRegenerated = details.regenerated === true;
  }
  return next;
}

export async function handleMarketingGrowthCompoundLogic(
  deps: MarketingGrowthLogicDeps,
  businessId: string,
  prompt: string,
  params: Record<string, any>,
  userEmail?: string,
): Promise<CommandResult> {
  const steps: MarketingGrowthCompoundStep[] =
    (params.compoundSteps as MarketingGrowthCompoundStep[] | undefined) ??
    decomposeMarketingGrowthCompoundPrompt(prompt);

  if (steps.length < 2) {
    return failure(
      'compound_intent',
      'Could not split this into multiple marketing/growth commands. Try separating with "and" or semicolons.',
      { clarify: true },
    );
  }

  const results: CommandResult[] = [];
  let compoundContext: Record<string, unknown> = { ...params, _prompt: prompt };

  for (const step of steps.slice(0, 4)) {
    const stepParams = {
      ...step.params,
      ...compoundContext,
      _prompt: step.segment,
    };
    let result: CommandResult;
    switch (step.action) {
      case 'configure_marketing_automation':
        result = await handleConfigureMarketingAutomationLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'configure_stripe_connect':
        result = await handleConfigureStripeConnectLogic(
          { stripeIntegrationService: deps.stripeIntegrationService },
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'summarize_automation_performance':
        result = await handleSummarizeAutomationPerformanceLogic(
          deps,
          businessId,
        );
        break;
      case 'trigger_reengagement':
        result = await handleTriggerReengagementLogic(deps, businessId);
        break;
      case 'list_inactive_customers':
        result = await handleListInactiveCustomersLogic(deps, businessId);
        break;
      case 'explain_plan_limits':
        result = await handleExplainPlanLimitsLogic(deps, businessId);
        break;
      case 'suggest_upgrade':
        result = await handleSuggestUpgradeLogic(deps, businessId);
        break;
      case 'toggle_annual_billing':
        result = await handleToggleAnnualBillingLogic(
          deps,
          businessId,
          stepParams,
          userEmail,
        );
        break;
      case 'summarize_new_registrations':
        result = await handleSummarizeNewRegistrationsLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'explain_tenant_app_install':
        result = await handleExplainTenantAppInstallLogic(deps, businessId);
        break;
      case 'regenerate_tenant_app_install_qr':
        result = await handleRegenerateTenantAppInstallQrLogic(
          deps,
          businessId,
        );
        break;
      case 'create_promo_code':
        result = await handleCreatePromoCodeLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'configure_loyalty_settings':
        result = await handleConfigureLoyaltySettingsLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'how_to_download_app':
        result = await handleHowToDownloadAppLogic(deps, businessId);
        break;
      case 'switch_to_consumer_app':
        result = await handleSwitchToConsumerAppLogic(deps, businessId);
        break;
      case 'promo_code_help':
        result = await handlePromoCodeHelpLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'apply_promo_code_checkout':
        result = await handleApplyPromoCodeCheckoutLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'apply_loyalty_at_checkout':
        result = await handleApplyLoyaltyAtCheckoutLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      case 'loyalty_points_balance':
        result = await handleLoyaltyPointsBalanceLogic(
          deps,
          businessId,
          stepParams,
        );
        break;
      case 'explain_loyalty_points':
        result = await handleExplainLoyaltyPointsLogic(
          deps,
          businessId,
          stepParams,
          step.segment,
        );
        break;
      default:
        result = failure(
          step.action,
          `Unsupported marketing/growth compound step: ${step.action}.`,
        );
    }
    results.push(result);
    if (!result.success) {
      return {
        success: false,
        action: 'compound_intent',
        summary: `Stopped at step ${results.length} (${step.action}): ${result.summary}`,
        details: {
          steps: results.map((r) => r.action),
          failedStep: step.action,
        },
      };
    }
    compoundContext = mergeMarketingGrowthCompoundContext(
      compoundContext,
      step,
      result,
    );
  }

  return {
    success: true,
    action: 'compound_intent',
    summary: `Completed ${results.length} marketing/growth step(s): ${results.map((r) => r.action.replace(/_/g, ' ')).join(', ')}.`,
    details: {
      steps: results.map((r) => ({ action: r.action, summary: r.summary })),
      decomposed: true,
      marketingGrowthCompound: true,
      finalContext: compoundContext,
    },
  };
}
