import type { CommandResult } from './command-completion.types.js';
import type { AgentPlan } from '../../engine/agent/interfaces/agent.interfaces.js';
import { normalizeServiceLookup } from './ai-orchestration.helpers.js';

export interface PlanVerificationResult {
  ok: boolean;
  mismatches: string[];
}

export interface PlanVsPromptCheckInput {
  prompt: string;
  plan: AgentPlan;
  action?: string;
}

const CANCEL_INTENT = /\bcancel(?:led|lation|s)?\b/i;
const HIDE_INTENT = /\bhide\b|\bhidden\b|\boff the calendar\b/i;
const BROAD_SCOPE = /\ball\b|\bevery\b|\bwhole\b|\bentire\b/i;
const SINGLE_DAY = /\b(tomorrow|today|tonight|yesterday)\b/i;
const MULTI_DAY = /\b(this week|next week|next month|date range|from .+ to)\b/i;

function daysBetween(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return 0;
  return Math.max(0, Math.ceil((endMs - startMs) / (24 * 60 * 60 * 1000))) + 1;
}

export function promptMentionsName(prompt: string, name: string): boolean {
  const lowerPrompt = prompt.toLowerCase();
  const lowerName = name.trim().toLowerCase();
  if (!lowerName) return true;
  if (lowerPrompt.includes(lowerName)) return true;
  const firstToken = lowerName.split(/\s+/)[0];
  return firstToken ? lowerPrompt.includes(firstToken) : false;
}

export function promptMentionsService(prompt: string, serviceName: string): boolean {
  const lowerPrompt = prompt.toLowerCase();
  const lowerService = serviceName.trim().toLowerCase();
  if (!lowerService) return true;
  if (lowerPrompt.includes(lowerService)) return true;
  const promptNorm = normalizeServiceLookup(lowerPrompt);
  const serviceNorm = normalizeServiceLookup(lowerService);
  return (
    promptNorm.includes(serviceNorm) ||
    serviceNorm.includes(promptNorm) ||
    promptNorm.split(/\s+/).some((token) => serviceNorm.includes(token) && token.length >= 4)
  );
}

export function promptHasBroadScope(prompt: string): boolean {
  return BROAD_SCOPE.test(prompt);
}

export function promptImpliesSingleDay(prompt: string): boolean {
  return SINGLE_DAY.test(prompt);
}

export function promptImpliesMultiDay(prompt: string): boolean {
  return MULTI_DAY.test(prompt);
}

function verifyStepEntityScope(
  prompt: string,
  step: AgentPlan['steps'][number],
  mismatches: string[],
): void {
  const employeeName = step.params.employeeName as string | undefined;
  if (employeeName && !promptMentionsName(prompt, employeeName)) {
    mismatches.push(`plan targets ${employeeName} but prompt does not mention them`);
  }

  const customerName = step.params.customerName as string | undefined;
  if (customerName && !promptMentionsName(prompt, customerName)) {
    mismatches.push(
      `plan targets customer ${customerName} but prompt does not mention them`,
    );
  }

  const serviceName = step.params.serviceName as string | undefined;
  if (serviceName && !promptMentionsService(prompt, serviceName)) {
    mismatches.push(
      `plan targets service "${serviceName}" but prompt does not mention it`,
    );
  }
}

function verifyStepScopeBreadth(
  prompt: string,
  step: AgentPlan['steps'][number],
  mismatches: string[],
): void {
  if (step.params.allAppointments === true && !promptHasBroadScope(prompt)) {
    mismatches.push('plan cancels a broad scope but prompt looks narrower');
  }
  if (step.params.allProviders === true && !promptHasBroadScope(prompt)) {
    mismatches.push('plan affects all providers but prompt looks narrower');
  }
}

function verifyStepDateScope(
  prompt: string,
  step: AgentPlan['steps'][number],
  mismatches: string[],
): void {
  const dateFrom = step.params.dateFrom as string | undefined;
  const dateTo = step.params.dateTo as string | undefined;
  if (!dateFrom || !dateTo) return;

  const rangeDays = daysBetween(dateFrom, dateTo);
  if (
    rangeDays > 1 &&
    promptImpliesSingleDay(prompt) &&
    !promptImpliesMultiDay(prompt)
  ) {
    mismatches.push('plan spans a date range but prompt looks single-day');
  }
}

function verifyStepActionIntent(
  prompt: string,
  step: AgentPlan['steps'][number],
  mismatches: string[],
): void {
  if (
    CANCEL_INTENT.test(prompt) &&
    step.action === 'hide_bookings' &&
    !HIDE_INTENT.test(prompt)
  ) {
    mismatches.push(`plan step ${step.action} does not match cancel intent in prompt`);
  }

  if (
    HIDE_INTENT.test(prompt) &&
    step.action === 'cancel_bookings' &&
    !CANCEL_INTENT.test(prompt)
  ) {
    mismatches.push('plan cancels bookings but prompt asked to hide');
  }
}

/** acc-5.2 — verify workflow plan steps match the user's prompt scope. */
export function verifyPlanMatchesPrompt(
  prompt: string,
  plan: AgentPlan,
): PlanVerificationResult {
  const mismatches: string[] = [];
  const effectivePrompt = prompt.trim() || plan.intent;

  for (const step of plan.steps) {
    verifyStepEntityScope(effectivePrompt, step, mismatches);
    verifyStepScopeBreadth(effectivePrompt, step, mismatches);
    verifyStepDateScope(effectivePrompt, step, mismatches);
    verifyStepActionIntent(effectivePrompt, step, mismatches);
  }

  return { ok: mismatches.length === 0, mismatches };
}

export function buildPlanMismatchSummary(mismatches: string[]): string {
  if (mismatches.length === 0) {
    return 'The generated plan matches your request.';
  }
  if (mismatches.length === 1) {
    return `The generated plan may not match your request: ${mismatches[0]}. Please review or rephrase.`;
  }
  return `The generated plan may not match your request (${mismatches.slice(0, 2).join('; ')}). Please review or rephrase.`;
}

export function buildPlanVsPromptClarifyResult(
  input: PlanVsPromptCheckInput & { verification: PlanVerificationResult },
): CommandResult {
  return {
    success: false,
    action: input.action ?? input.plan.steps[0]?.action ?? 'plan_review',
    summary: buildPlanMismatchSummary(input.verification.mismatches),
    details: {
      needsClarification: true,
      clarify: true,
      clarifySource: 'plan_vs_prompt',
      clarifyKind: 'plan_vs_prompt',
      planMismatch: input.verification.mismatches,
      planVsPromptFailed: true,
      requiresApproval: false,
      plan: input.plan,
      pipelineStage: 'plan',
    },
  };
}

export function runPlanVsPromptCheck(
  input: PlanVsPromptCheckInput,
): PlanVerificationResult {
  return verifyPlanMatchesPrompt(input.prompt, input.plan);
}

export function buildPlanVsPromptGateResult(
  input: PlanVsPromptCheckInput,
): CommandResult | null {
  const verification = runPlanVsPromptCheck(input);
  if (verification.ok) return null;
  return buildPlanVsPromptClarifyResult({ ...input, verification });
}
