import type { AgentPlan } from '../../engine/agent/interfaces/agent.interfaces.js';

export interface PolicyExplainResult {
  headline: string;
  explanation: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface PolicyPreviewLike {
  decision?: string;
  riskLevel?: string;
  violations?: string[];
  reasons?: string[];
}

/** Deterministic policy / risk copy for plan preview (ai-d10). */
export function buildPolicyRiskExplain(input: {
  policyPreview?: PolicyPreviewLike;
  plan?: Pick<AgentPlan, 'steps' | 'riskAssessment'>;
  employeeCount?: number;
  daySpan?: number;
}): PolicyExplainResult {
  const steps = input.plan?.steps?.length ?? 0;
  const providers = Math.max(1, input.employeeCount ?? 1);
  const days = Math.max(1, input.daySpan ?? 7);
  const riskRaw =
    input.policyPreview?.riskLevel ??
    input.plan?.riskAssessment?.level ??
    'medium';
  const riskLevel = normalizeRiskLevel(riskRaw);
  const violations = input.policyPreview?.violations ?? [];

  const scopePhrase =
    providers > 1 && days > 1
      ? `${providers} providers × ${days} days`
      : providers > 1
        ? `${providers} providers`
        : days > 1
          ? `${days} days`
          : `${steps} step(s)`;

  const headline =
    riskLevel === 'high'
      ? `High-risk plan (${scopePhrase})`
      : riskLevel === 'medium'
        ? `Review required (${scopePhrase})`
        : `Policy check (${scopePhrase})`;

  const parts: string[] = [];
  if (input.policyPreview?.decision === 'requires_approval') {
    parts.push(
      `This plan affects ${scopePhrase} and needs your approval before Orchestrix runs it.`,
    );
  } else {
    parts.push(`Orchestrix flagged this ${steps}-step plan for review.`);
  }
  if (violations.length > 0) {
    parts.push(`Policy notes: ${violations.slice(0, 3).join('; ')}.`);
  } else if (riskLevel === 'high') {
    parts.push(
      'Bulk schedule or booking changes at this scale are treated as high risk.',
    );
  }

  return {
    headline,
    explanation: parts.join(' '),
    riskLevel,
  };
}

function normalizeRiskLevel(level: string): 'low' | 'medium' | 'high' {
  const l = level.toLowerCase();
  if (l === 'high' || l === 'critical') return 'high';
  if (l === 'low') return 'low';
  return 'medium';
}
