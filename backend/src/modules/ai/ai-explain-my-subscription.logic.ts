import type { CustomerSubscription } from '../service-subscriptions/entities/subscription.entity.js';
import type { CommandResult } from './command-completion.types.js';
import type { CustomerCrmLogicDeps } from './ai-customer-crm.logic.js';
import {
  buildMySubscriptionExplainCopy,
  parseExplainMySubscriptionFromPrompt,
} from './ai-explain-my-subscription.util.js';

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function resolveSessionCustomerId(
  params: Record<string, unknown>,
): string | undefined {
  const raw = params.sessionCustomerId ?? params.customerId;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

function pickPrimarySubscription(
  subs: CustomerSubscription[],
  subscriptionId?: string,
): CustomerSubscription | undefined {
  if (subscriptionId) {
    return subs.find((sub) => sub.id === subscriptionId);
  }
  return (
    subs.find(
      (sub) => sub.status === 'active' && sub.appointmentsRemaining > 0,
    ) ??
    subs.find((sub) => sub.status === 'active') ??
    subs[0]
  );
}

export async function handleExplainMySubscriptionLogic(
  deps: CustomerCrmLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt = '',
): Promise<CommandResult> {
  const textPrompt = prompt || String(params._prompt ?? '');
  const parsed = parseExplainMySubscriptionFromPrompt(textPrompt);
  if (!parsed) {
    return failure(
      'explain_my_subscription',
      'Ask about visits left, expiry, or how your membership works.',
      { clarify: true },
    );
  }

  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'explain_my_subscription',
      'Sign in to view your subscription details.',
      { clarify: true, missing: ['sessionCustomerId'] },
    );
  }

  try {
    const subs = await deps.subscriptionsService.listCustomerSubscriptions(
      businessId,
      customerId,
    );
    const subscriptionId =
      typeof params.subscriptionId === 'string'
        ? params.subscriptionId
        : typeof params.customerSubscriptionId === 'string'
          ? params.customerSubscriptionId
          : undefined;
    const primary = pickPrimarySubscription(subs, subscriptionId);

    let usageEventCount: number | undefined;
    if (primary) {
      const usage =
        await deps.subscriptionsService.getCustomerSubscriptionUsage(
          businessId,
          customerId,
          primary.id,
        );
      usageEventCount = usage.usage.length;
    }

    const explainLines = subs.map((sub) => ({
      planName: sub.plan?.name ?? 'Membership plan',
      serviceName: sub.plan?.service?.name,
      appointmentsRemaining: sub.appointmentsRemaining,
      appointmentsIncluded: sub.appointmentsIncluded,
      status: sub.status,
      expiresAt: sub.expiresAt,
      usageEventCount: sub.id === primary?.id ? usageEventCount : undefined,
    }));

    const copy = buildMySubscriptionExplainCopy({
      subscriptions: explainLines,
      focus: parsed.focus,
    });

    return success('explain_my_subscription', copy.summary, {
      focus: copy.focus,
      subscriptions: subs,
      count: subs.length,
      ...(primary
        ? {
            subscriptionId: primary.id,
            appointmentsRemaining: primary.appointmentsRemaining,
            appointmentsIncluded: primary.appointmentsIncluded,
            status: primary.status,
            expiresAt: primary.expiresAt,
            usageEventCount,
          }
        : {}),
      navigate: primary
        ? {
            path: 'account',
            query: { tab: 'subscriptions', subscriptionId: primary.id },
          }
        : { path: 'account', query: { tab: 'subscriptions' } },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Could not explain subscription.';
    return failure('explain_my_subscription', message);
  }
}
