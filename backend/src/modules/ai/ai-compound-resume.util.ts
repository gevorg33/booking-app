/**
 * e2e-bug.304 — mid-step compound clarify must keep prior validated plans
 * so a follow-up can resume (reschedule → create) instead of dropping the move.
 */
import type { AgentPlan } from '../../engine/agent/interfaces/agent.interfaces.js';
import type { CommandResult } from './command-completion.types.js';

export const COMPOUND_RESUME_CONTEXT_KEYS = [
  'compoundResumePlans',
  'compoundResumeSubIntents',
  'compoundStepIndex',
  'compoundActions',
  'compoundConfirmationPrompt',
] as const;

export type CompoundResumeSubIntent = {
  action: string;
  params: Record<string, unknown>;
  reasoning: string;
};

export type CompoundResumePayload = {
  plans: AgentPlan[];
  subIntents: CompoundResumeSubIntent[];
  stepIndex: number;
  compoundActions: string[];
  confirmationPrompt: string;
};

export function serializeCompoundResumePlans(
  plans: AgentPlan[],
): Record<string, unknown>[] {
  return plans.map((plan) => ({
    ...plan,
    createdAt:
      plan.createdAt instanceof Date
        ? plan.createdAt.toISOString()
        : plan.createdAt,
  }));
}

export function deserializeCompoundResumePlans(
  raw: unknown,
): AgentPlan[] | null {
  if (!Array.isArray(raw)) return null;
  if (raw.length === 0) return [];
  const plans: AgentPlan[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') return null;
    const plan = row as AgentPlan;
    if (!plan.id || !Array.isArray(plan.steps)) return null;
    plans.push({
      ...plan,
      createdAt:
        typeof plan.createdAt === 'string'
          ? new Date(plan.createdAt)
          : plan.createdAt instanceof Date
            ? plan.createdAt
            : new Date(),
    });
  }
  return plans;
}

export function readCompoundResumeFromContext(
  context: Record<string, unknown> | undefined | null,
): CompoundResumePayload | null {
  if (!context || typeof context !== 'object') return null;
  const plansRaw = context.compoundResumePlans;
  const plans =
    plansRaw === undefined ? [] : deserializeCompoundResumePlans(plansRaw);
  if (plans == null) return null;
  const subIntentsRaw = context.compoundResumeSubIntents;
  if (!Array.isArray(subIntentsRaw) || subIntentsRaw.length === 0) {
    return null;
  }
  const subIntents: CompoundResumeSubIntent[] = [];
  for (const row of subIntentsRaw) {
    if (!row || typeof row !== 'object') return null;
    const action = String((row as CompoundResumeSubIntent).action ?? '').trim();
    if (!action) return null;
    subIntents.push({
      action,
      params:
        ((row as CompoundResumeSubIntent).params as Record<string, unknown>) ??
        {},
      reasoning: String((row as CompoundResumeSubIntent).reasoning ?? ''),
    });
  }
  const stepIndex = Number(context.compoundStepIndex);
  if (
    !Number.isInteger(stepIndex) ||
    stepIndex < 0 ||
    stepIndex >= subIntents.length
  ) {
    return null;
  }
  const compoundActions = Array.isArray(context.compoundActions)
    ? context.compoundActions.map(String)
    : subIntents.map((s) => s.action);
  const confirmationPrompt = String(
    context.compoundConfirmationPrompt ?? '',
  ).trim();
  return {
    plans,
    subIntents,
    // When no prior plans were built, restart from 0 so earlier legs re-plan.
    stepIndex: plans.length > 0 ? stepIndex : 0,
    compoundActions,
    confirmationPrompt,
  };
}

/** Short clarify-form follow-ups ("Start time: 09:00") — resume compound. */
export function isCompoundClarifyFollowUpPrompt(prompt: string): boolean {
  const t = prompt.trim();
  if (!t || t.length > 160) return false;
  if (/\bthen\b|;/i.test(t)) return false;
  if (
    /^(start\s*time|time(?:\s*slot)?|date|customer|service|provider|employee)\s*:/i.test(
      t,
    )
  ) {
    return true;
  }
  if (/^\d{1,2}:\d{2}\b/.test(t)) return true;
  if (/^(first available|any time|morning|afternoon|evening)\b/i.test(t)) {
    return true;
  }
  return false;
}

export function shouldContinueCompoundResume(
  prompt: string,
  context: Record<string, unknown> | undefined | null,
): boolean {
  const resume = readCompoundResumeFromContext(context);
  if (!resume) return false;
  if (isCompoundClarifyFollowUpPrompt(prompt)) return true;
  if (
    resume.confirmationPrompt &&
    prompt.trim() === resume.confirmationPrompt
  ) {
    return true;
  }
  return false;
}

/** Pull common clarify fields from composed NL follow-up into session params. */
export function extractClarifyFieldsFromFollowUpPrompt(
  prompt: string,
): Record<string, string> {
  const out: Record<string, string> = {};
  const timeLabeled = prompt.match(
    /(?:start\s*time|time(?:\s*slot)?)\s*:\s*([^\n.]+)/i,
  );
  if (timeLabeled?.[1]?.trim()) {
    out.timeSlot = timeLabeled[1].trim();
  } else {
    const bare = prompt.match(/\b(\d{1,2}:\d{2})\b/);
    if (bare?.[1]) out.timeSlot = bare[1];
  }
  const dateLabeled = prompt.match(/date\s*:\s*([^\n.]+)/i);
  if (dateLabeled?.[1]?.trim()) out.date = dateLabeled[1].trim();
  const customerLabeled = prompt.match(/customer\s*:\s*([^\n.]+)/i);
  if (customerLabeled?.[1]?.trim()) {
    out.customerName = customerLabeled[1].trim();
  }
  const serviceLabeled = prompt.match(/service\s*:\s*([^\n.]+)/i);
  if (serviceLabeled?.[1]?.trim()) {
    out.serviceName = serviceLabeled[1].trim();
  }
  const employeeLabeled = prompt.match(
    /(?:provider|employee)\s*:\s*([^\n.]+)/i,
  );
  if (employeeLabeled?.[1]?.trim()) {
    out.employeeName = employeeLabeled[1].trim();
  }
  return out;
}

export function buildCompoundResumeSessionFields(input: {
  plans: AgentPlan[];
  subIntents: CompoundResumeSubIntent[];
  stepIndex: number;
  compoundActions: string[];
  confirmationPrompt: string;
}): Record<string, unknown> {
  return {
    compoundResumePlans: serializeCompoundResumePlans(input.plans),
    compoundResumeSubIntents: input.subIntents,
    compoundStepIndex: input.stepIndex,
    compoundActions: input.compoundActions,
    compoundConfirmationPrompt: input.confirmationPrompt,
  };
}

export function prependCompoundQueuedSummary(
  clarifySummary: string,
  plans: AgentPlan[],
  compoundActions: string[] = [],
): string {
  if (plans.length) {
    const labels = plans
      .map((p) => p.intent || p.steps?.[0]?.action || 'step')
      .filter(Boolean);
    const queued = labels.join(' → ');
    return `Also queued from earlier steps (${queued}). ${clarifySummary}`;
  }
  if (compoundActions.length > 1) {
    return `Also continuing compound (${compoundActions.join(' → ')}). ${clarifySummary}`;
  }
  return clarifySummary;
}

/**
 * Attach prior validated plans to a mid-step clarify result (e2e-bug.304)
 * and surface compound_intent (e2e-bug.305).
 */
export function attachCompoundResumeToClarifyResult(
  clarify: CommandResult,
  input: {
    plans: AgentPlan[];
    subIntents: CompoundResumeSubIntent[];
    stepIndex: number;
    compoundActions: string[];
    confirmationPrompt: string;
    compoundStep: string;
  },
): CommandResult {
  const resumeFields = buildCompoundResumeSessionFields(input);
  const priorSession =
    (clarify.details?.sessionContext as Record<string, unknown> | undefined) ??
    {};
  const summary = prependCompoundQueuedSummary(
    String(clarify.summary ?? ''),
    input.plans,
    input.compoundActions,
  );
  return {
    ...clarify,
    action: 'compound_intent',
    summary,
    details: {
      ...(clarify.details ?? {}),
      ...resumeFields,
      compoundStep: input.compoundStep,
      compoundStepIndex: input.stepIndex,
      compoundActions: input.compoundActions,
      decomposed: true,
      confirmationPrompt: input.confirmationPrompt,
      sessionContext: {
        ...priorSession,
        ...resumeFields,
        lastAction: 'compound_intent',
      },
    },
  };
}

export function clearCompoundResumeFromContext(
  context: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...context };
  for (const key of COMPOUND_RESUME_CONTEXT_KEYS) {
    delete next[key];
  }
  return next;
}
