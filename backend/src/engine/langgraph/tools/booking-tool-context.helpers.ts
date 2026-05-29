import type { AgentPlanStep } from '../../agent/interfaces/agent.interfaces.js';
import type { BookingToolRunContext } from './booking-tool.types.js';
import type { AgentToolBridgeService } from '../services/agent-tool-bridge.service.js';

const MAX_TOOL_RESULT_CHARS = 8000;

export function truncateResult(result: unknown): string {
  return JSON.stringify(result, null, 0).slice(0, MAX_TOOL_RESULT_CHARS);
}

export async function runReadTool(
  ctx: BookingToolRunContext,
  toolBridge: AgentToolBridgeService,
  action: string,
  params: Record<string, unknown>,
  dependsOn: string[] = [],
): Promise<string> {
  ctx.stepCounter += 1;
  const stepId = `react-${ctx.stepCounter}-${action}`;
  try {
    const { result, ctx: updatedCtx } = await toolBridge.run(
      {
        stepId,
        action,
        params: { businessId: ctx.businessId, ...params },
        dependsOn,
      },
      ctx.toolContext,
    );
    ctx.toolContext = updatedCtx;
    ctx.lastStepByAction[action] = stepId;
    return truncateResult(result);
  } catch (err: any) {
    return JSON.stringify({ error: err?.message ?? 'Tool execution failed' });
  }
}

export function proposeStep(
  ctx: BookingToolRunContext,
  action: string,
  description: string,
  params: Record<string, unknown>,
  options?: { dependsOn?: string[]; chainPrevious?: boolean },
): string {
  const stepId = crypto.randomUUID();
  const chainPrevious = options?.chainPrevious !== false;
  const dependsOn =
    options?.dependsOn ??
    (chainPrevious && ctx.proposals.length ? [ctx.proposals[ctx.proposals.length - 1]!.id] : []);

  const step: AgentPlanStep = {
    id: stepId,
    action,
    description,
    params: { businessId: ctx.businessId, ...params },
    dependsOn,
    estimatedImpact: 'Requires approval before execution',
  };
  ctx.proposals.push(step);

  return JSON.stringify({
    status: 'proposed',
    action,
    stepId,
    dependsOn,
    totalProposedSteps: ctx.proposals.length,
    message: 'Added to approval plan — will not execute until user approves.',
  });
}

export function proposeManySteps(
  ctx: BookingToolRunContext,
  steps: Array<{
    action: string;
    description: string;
    params: Record<string, unknown>;
    chainPrevious?: boolean;
  }>,
): string {
  const created: string[] = [];
  for (const step of steps) {
    const raw = proposeStep(ctx, step.action, step.description, step.params, {
      chainPrevious: step.chainPrevious,
    });
    const parsed = JSON.parse(raw) as { stepId: string };
    created.push(parsed.stepId);
  }
  return JSON.stringify({
    status: 'proposed_compound',
    stepIds: created,
    totalProposedSteps: ctx.proposals.length,
    message: `Proposed ${steps.length} chained workflow step(s) for approval.`,
  });
}

export function priorStepId(ctx: BookingToolRunContext, action: string): string[] {
  const id = ctx.lastStepByAction[action];
  return id ? [id] : [];
}
