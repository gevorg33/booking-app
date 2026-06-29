import { COMMAND_REGISTRY_BY_ID } from './ai-command-registry.js';
import type { GuideRelatedAction, GuideResponse } from './command-completion.types.js';
import type { GuideCorpusTopicId } from './guide/ai-guide-corpus.types.js';
import { enrichServiceOnlinePaymentParamsFromPrompt } from './ai-service-online-payment.util.js';
import type { AppGuideIntent } from './ai-product-guide.util.js';

export interface GuideHandoffRule {
  id: string;
  topicIds: readonly GuideCorpusTopicId[];
  intents?: readonly AppGuideIntent[];
  promptCue: RegExp;
  action: string;
  label: string;
  buildParams?: (input: GuideHandoffInput) => Record<string, unknown>;
}

export interface GuideHandoffInput {
  prompt: string;
  route?: string;
  intent: AppGuideIntent;
}

/** Context / DTO key for direct guide handoff dispatch (ai-guide-1.2.5). */
export const GUIDE_HANDOFF_CONTEXT_KEY = 'guideHandoff';

export interface GuideHandoffDispatch {
  action: string;
  params?: Record<string, unknown>;
  source?: 'product_guide';
}

export const GUIDE_HANDOFF_RULES: readonly GuideHandoffRule[] = [
  {
    id: 'services-online-payment',
    topicIds: ['dashboard.core.employees'],
    intents: ['guide_user_flow', 'explain_app_feature'],
    promptCue:
      /\bonline\s+payment|prepayment|accept\s+payment|turn\s+on\s+payment|deposit\s+mode\b/i,
    action: 'configure_service_online_payment',
    label: 'Configure online payment for a service',
    buildParams: (input) =>
      enrichServiceOnlinePaymentParamsFromPrompt({}, input.prompt),
  },
  {
    id: 'schedule-apply-template',
    topicIds: ['dashboard.core.schedule'],
    intents: ['guide_user_flow'],
    promptCue:
      /\b(schedule template|weekly schedule|apply template|weekday template|set up schedule)\b/i,
    action: 'apply_schedule',
    label: 'Apply a schedule template',
    buildParams: () => ({ allProviders: true }),
  },
  {
    id: 'schedule-setup-week',
    topicIds: ['dashboard.core.schedule'],
    intents: ['guide_user_flow', 'explain_current_screen'],
    promptCue:
      /\b(set up|setup|configure|build)\b.*\b(weekly|recurring|repeating)\b.*\b(hours|schedule|availability)\b/i,
    action: 'setup_week_schedule',
    label: 'Set up weekly schedule hours',
    buildParams: () => ({ allProviders: true }),
  },
  {
    id: 'schedule-block-time',
    topicIds: ['dashboard.core.schedule'],
    intents: ['guide_user_flow', 'explain_app_feature'],
    promptCue:
      /\b(block schedule|time off|break|blocked time|remove availability)\b/i,
    action: 'block_schedule',
    label: 'Block time on the schedule',
  },
  {
    id: 'schedule-create-template',
    topicIds: ['dashboard.core.schedule'],
    intents: ['guide_user_flow'],
    promptCue:
      /\b(create|add|new)\b.*\b(schedule template|weekly template|recurring template)\b/i,
    action: 'create_schedule_template',
    label: 'Create a schedule template',
  },
  {
    id: 'services-add-service',
    topicIds: ['dashboard.core.employees'],
    intents: ['guide_user_flow'],
    promptCue: /\b(add|create|new)\s+(?:a\s+)?(?:new\s+)?service|service catalog\b/i,
    action: 'create_service',
    label: 'Add a service to the catalog',
  },
  {
    id: 'employees-add-staff',
    topicIds: ['dashboard.core.employees'],
    intents: ['guide_user_flow'],
    promptCue:
      /\b(add|invite|create)\s+(?:a\s+)?(?:new\s+)?(?:staff|employee|provider|team member|stylist)\b/i,
    action: 'create_employee',
    label: 'Add a staff member',
  },
  {
    id: 'employees-assign-services',
    topicIds: ['dashboard.core.employees'],
    intents: ['guide_user_flow', 'explain_app_feature'],
    promptCue:
      /\b(assign|link|connect)\b.*\b(service|services|catalog)\b.*\b(staff|employee|provider|stylist)\b/i,
    action: 'assign_employee_services',
    label: 'Assign services to a staff member',
  },
  {
    id: 'inventory-link-products',
    topicIds: ['dashboard.operations.inventory'],
    intents: ['guide_user_flow'],
    promptCue:
      /\b(link|connect|assign)\b.*\b(product|inventory|consumable)\b.*\b(service|services)\b/i,
    action: 'assign_employee_services',
    label: 'Link inventory products to services',
  },
] as const;

export const GUIDE_HANDOFF_ALLOWED_ACTIONS = new Set(
  GUIDE_HANDOFF_RULES.map((rule) => rule.action),
);

export function buildGuideHandoffExecutionPrompt(
  action: string,
  params: Record<string, unknown>,
): string {
  if (typeof params.prompt === 'string' && params.prompt.trim()) {
    return params.prompt.trim();
  }

  switch (action) {
    case 'configure_service_online_payment': {
      const serviceName =
        typeof params.serviceName === 'string' ? params.serviceName.trim() : '';
      const mode =
        params.prepaymentMode === 'full'
          ? 'full online prepayment'
          : params.prepaymentMode === 'deposit'
            ? 'deposit prepayment'
            : 'online payment';
      return serviceName
        ? `Configure ${mode} for ${serviceName}`
        : `Configure ${mode} for a service`;
    }
    case 'apply_schedule':
      return 'Apply the weekday schedule template for all providers this week';
    case 'setup_week_schedule':
      return 'Set up weekly schedule hours for all providers';
    case 'block_schedule':
      return 'Block time on the schedule';
    case 'create_schedule_template':
      return 'Create a new weekly schedule template';
    case 'create_service':
      return 'Create a new service in the catalog';
    case 'create_employee':
      return 'Create a new employee';
    case 'assign_employee_services':
      return 'Assign services to a staff member';
    default:
      return action.replace(/_/g, ' ');
  }
}

export function buildGuideHandoffDispatch(
  related: Pick<GuideRelatedAction, 'action' | 'params' | 'prompt'>,
): GuideHandoffDispatch {
  const params = { ...(related.params ?? {}) };
  const prompt = related.prompt?.trim();
  if (prompt) params.prompt = prompt;
  return {
    action: related.action,
    params,
    source: 'product_guide',
  };
}

export function readGuideHandoffDispatch(
  session?: { context?: Record<string, unknown> },
): GuideHandoffDispatch | null {
  const raw = session?.context?.[GUIDE_HANDOFF_CONTEXT_KEY];
  if (!raw || typeof raw !== 'object') return null;
  const action = (raw as GuideHandoffDispatch).action;
  if (typeof action !== 'string' || !action.trim()) return null;
  const params = (raw as GuideHandoffDispatch).params;
  return {
    action: action.trim(),
    params:
      params && typeof params === 'object' && !Array.isArray(params)
        ? (params as Record<string, unknown>)
        : undefined,
    source: 'product_guide',
  };
}

export function validateGuideHandoffDispatch(
  handoff: GuideHandoffDispatch,
): { ok: true } | { ok: false; summary: string } {
  if (!GUIDE_HANDOFF_ALLOWED_ACTIONS.has(handoff.action)) {
    return {
      ok: false,
      summary: 'That guide action is not enabled for direct execution yet.',
    };
  }
  if (!COMMAND_REGISTRY_BY_ID.has(handoff.action)) {
    return {
      ok: false,
      summary: 'That guide action is not registered in the command catalog.',
    };
  }
  return { ok: true };
}

export function isGuideHandoffMutatingAction(action: string): boolean {
  return COMMAND_REGISTRY_BY_ID.get(action)?.mutating === true;
}

function ruleMatches(rule: GuideHandoffRule, input: GuideHandoffInput, topicId?: string): boolean {
  if (!topicId || !rule.topicIds.includes(topicId as GuideCorpusTopicId)) return false;
  if (rule.intents && !rule.intents.includes(input.intent)) return false;
  return rule.promptCue.test(input.prompt);
}

/** Attach deterministic mutate handoffs for “Do this for me” (ai-guide-1.2.5). */
export function enrichGuideResponseHandoffs(
  guide: GuideResponse,
  input: GuideHandoffInput,
): GuideResponse {
  const topicId = guide.topicId;
  if (!topicId) return guide;

  const relatedActions: GuideRelatedAction[] = [];
  const seen = new Set<string>();

  for (const rule of GUIDE_HANDOFF_RULES) {
    if (!ruleMatches(rule, input, topicId)) continue;
    if (seen.has(rule.action)) continue;
    seen.add(rule.action);

    const params = rule.buildParams?.(input) ?? {};
    relatedActions.push({
      action: rule.action,
      label: rule.label,
      params,
      prompt: buildGuideHandoffExecutionPrompt(rule.action, params),
    });
  }

  if (relatedActions.length === 0) return guide;
  return { ...guide, relatedActions };
}
