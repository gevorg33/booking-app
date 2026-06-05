import type { AgentPlanStep } from '../../engine/agent/interfaces/agent.interfaces.js';

/** ai-e7 — escalation notification plan metadata (read-only alert, no mutation steps). */
export function buildHitlEscalationPlanSteps(params: {
  businessId: string;
  taskId: string;
  intent: string;
  stuckMinutes: number;
  ownerUserId?: string;
  idFactory?: () => string;
}): AgentPlanStep[] {
  const nextId = params.idFactory ?? (() => crypto.randomUUID());
  return [
    {
      id: nextId(),
      action: 'notify_owner',
      description: `Escalate stuck "${params.intent}" task to owner`,
      params: {
        businessId: params.businessId,
        taskId: params.taskId,
        alertType: 'approval',
        stuckMinutes: params.stuckMinutes,
        ownerUserId: params.ownerUserId,
      },
      dependsOn: [],
      estimatedImpact: 'Owner notified to approve or resolve stuck AI task',
    },
  ];
}

export function buildHitlEscalationPlanMeta(params: {
  intent: string;
  taskId: string;
  stuckMinutes: number;
}) {
  return {
    reasoning: `Task "${params.intent}" has been waiting ${params.stuckMinutes} minutes — escalating to owner.`,
    risk: { level: 'medium' as const, factors: ['human_in_the_loop_sla'] },
    requiresApproval: false,
    taskId: params.taskId,
  };
}
