import { randomUUID } from 'crypto';
import type { Repository } from 'typeorm';
import {
  AgentType,
  PlanStatus,
  type AgentPlan,
} from '../../engine/agent/interfaces/agent.interfaces.js';
import type { AgentTask } from '../../engine/agent/agent-task.entity.js';
import type { AiEventsService } from './ai-events.service.js';
import type { AiSettings } from './ai-settings.types.js';
import type { ClassificationSurface } from './ai-classification-engine.types.js';
import type { CommandResult } from './command-completion.types.js';
import { resolveHitlSlaMinutes } from './ai-platform.util.js';
import { resolveEscalationHandoffRoute } from './ai-escalation-handoff.util.js';
import type { AiIntegrationsService } from './ai-integrations.service.js';

export interface EscalationHandoffLogicDeps {
  agentTaskRepo: Repository<AgentTask>;
  aiEvents: AiEventsService;
  integrations: AiIntegrationsService;
  settings: AiSettings;
}

export interface ExecuteHumanHandoffInput {
  businessId: string;
  surface: ClassificationSurface;
  sessionContext?: Record<string, unknown>;
  userId?: string;
  customerId?: string;
  prompt?: string;
  actorEmail?: string;
  actorName?: string;
}

export function shouldExecuteHumanHandoffFromSession(
  sessionContext?: Record<string, unknown>,
): boolean {
  return sessionContext?._executeHumanHandoff === true;
}

export function readHandoffSurface(
  sessionContext: Record<string, unknown> | undefined,
  fallback: ClassificationSurface,
): ClassificationSurface {
  const surface = sessionContext?._handoffSurface ?? sessionContext?._surface;
  if (
    surface === 'customer' ||
    surface === 'public' ||
    surface === 'provider' ||
    surface === 'dashboard'
  ) {
    return surface;
  }
  return fallback;
}

/** acc-6.5 — deterministic rescue when user taps Get help or types an escalation phrase. */
export function isHumanHandoffExecutePrompt(prompt: string): boolean {
  const text = prompt.trim();
  if (!text) return false;
  if (/^get help\b/i.test(text)) return true;
  return (
    /\b(need\s+help|get\s+help|escalate|human\s+help)\b/i.test(text) &&
    /\b(staff|support|ticket|team|owner|human)\b/i.test(text)
  );
}

export function extractHandoffOriginalPrompt(
  sessionContext?: Record<string, unknown>,
  prompt?: string,
): string {
  const clarify = sessionContext?._clarifyContext as
    | { originalPrompt?: string }
    | undefined;
  return (
    clarify?.originalPrompt ??
    (sessionContext?._handoffOriginalPrompt as string | undefined) ??
    (sessionContext?.prompt as string | undefined) ??
    prompt?.trim() ??
    'AI assistant request'
  );
}

function truncate(text: string, max = 160): string {
  const trimmed = text.trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
}

function buildHandoffPlan(
  businessId: string,
  originalPrompt: string,
): AgentPlan {
  return {
    id: randomUUID(),
    agentType: AgentType.CONFLICT_RESOLUTION,
    businessId,
    intent: 'request_human_help',
    reasoning:
      'Human handoff after repeated clarify failure (acc-6.5 / ai-e7 SLA).',
    steps: [],
    constraints: [],
    riskAssessment: { level: 'low', factors: ['human_handoff'] },
    status: PlanStatus.PENDING_VALIDATION,
    createdAt: new Date(),
  };
}

export async function executeStaffOwnerHandoffLogic(
  deps: EscalationHandoffLogicDeps,
  input: ExecuteHumanHandoffInput,
): Promise<CommandResult> {
  const originalPrompt = extractHandoffOriginalPrompt(
    input.sessionContext,
    input.prompt,
  );
  const slaMinutes = resolveHitlSlaMinutes(deps.settings.enterprise);
  const clarifyContext = input.sessionContext?._clarifyContext;

  const task = deps.agentTaskRepo.create({
    agentType: AgentType.CONFLICT_RESOLUTION,
    businessId: input.businessId,
    intent: 'request_human_help',
    status: PlanStatus.PENDING_VALIDATION,
    userId: input.userId,
    plan: buildHandoffPlan(input.businessId, originalPrompt),
    context: {
      _humanHandoff: true,
      _hitlSlaMinutes: slaMinutes,
      _humanEscalationAt: new Date().toISOString(),
      originalPrompt,
      clarifyContext,
      surface: input.surface,
      failureSignal: 'human_escalation',
    },
  });
  await deps.agentTaskRepo.save(task);
  const taskId = task.id ?? randomUUID();

  deps.aiEvents.emitAlert(input.businessId, {
    alertType: 'approval',
    title: 'AI needs human help',
    message: `Could not complete after 2 clarifies: "${truncate(originalPrompt)}" — respond within ${slaMinutes} minutes (AI Ops).`,
    taskId,
    route: '/dashboard/ai-ops',
  });

  return {
    success: true,
    action: 'request_human_help',
    summary: `Help request sent to your team — they'll respond within ${slaMinutes} minutes. Track it in AI Ops.`,
    details: {
      humanHandoff: true,
      taskId,
      hitlSlaMinutes: slaMinutes,
      route: '/dashboard/ai-ops',
      failureSignal: 'human_escalation',
      escalationRoute: 'staff_owner',
    },
  };
}

export async function executeSupportTicketHandoffLogic(
  deps: EscalationHandoffLogicDeps,
  input: ExecuteHumanHandoffInput,
): Promise<CommandResult> {
  const originalPrompt = extractHandoffOriginalPrompt(
    input.sessionContext,
    input.prompt,
  );
  const customerId =
    input.customerId ??
    (input.sessionContext?.customerId as string | undefined) ??
    (input.sessionContext?.sessionCustomerId as string | undefined);

  const params: Record<string, unknown> = {
    ...(input.sessionContext ?? {}),
    sessionCustomerId: customerId,
    subject: 'AI assistant — need help',
    body: [
      'Customer tapped Get help after the assistant could not understand their request.',
      '',
      `Original request: ${originalPrompt}`,
      input.prompt && input.prompt !== originalPrompt
        ? `Follow-up: ${input.prompt}`
        : '',
    ]
      .filter(Boolean)
      .join('\n'),
    _humanHandoff: true,
  };

  const ticketResult = await deps.integrations.handleContactSupport(
    input.businessId,
    params,
    input.prompt,
    input.actorEmail,
    input.actorName,
  );

  if (!ticketResult.success) {
    return {
      ...ticketResult,
      details: {
        ...(ticketResult.details ?? {}),
        humanHandoff: true,
        escalationRoute: 'support_ticket',
        failureSignal: 'human_escalation',
      },
    };
  }

  return {
    ...ticketResult,
    summary:
      ticketResult.summary ??
      'Support ticket submitted — our team will follow up by email.',
    details: {
      ...(ticketResult.details ?? {}),
      humanHandoff: true,
      escalationRoute: 'support_ticket',
      failureSignal: 'human_escalation',
    },
  };
}

export async function executePublicVisitorHandoffLogic(
  deps: EscalationHandoffLogicDeps,
  input: ExecuteHumanHandoffInput,
): Promise<CommandResult> {
  const originalPrompt = extractHandoffOriginalPrompt(
    input.sessionContext,
    input.prompt,
  );
  const customerId =
    input.customerId ??
    (input.sessionContext?.customerId as string | undefined) ??
    (input.sessionContext?.sessionCustomerId as string | undefined);

  if (customerId) {
    return executeSupportTicketHandoffLogic(deps, {
      ...input,
      customerId,
      surface: 'customer',
    });
  }

  deps.aiEvents.emitAlert(input.businessId, {
    alertType: 'report',
    title: 'Booking visitor needs help',
    message: `Public assistant could not help: "${truncate(originalPrompt)}"`,
    route: '/dashboard/ai-ops',
  });

  return {
    success: true,
    action: 'request_human_help',
    summary:
      'We notified the team. Use the support chat widget on this page if you need immediate help.',
    details: {
      humanHandoff: true,
      openSupportWidget: true,
      escalationRoute: 'ai_ops',
      failureSignal: 'human_escalation',
    },
  };
}

/** acc-6.5 — execute Get help after 2 failed clarifies (staff/owner or Zendesk). */
export async function executeHumanHandoffLogic(
  deps: EscalationHandoffLogicDeps,
  input: ExecuteHumanHandoffInput,
): Promise<CommandResult> {
  const surface = readHandoffSurface(input.sessionContext, input.surface);
  const route = resolveEscalationHandoffRoute(surface);

  if (route === 'support_ticket') {
    return executeSupportTicketHandoffLogic(deps, { ...input, surface });
  }
  if (route === 'staff_owner') {
    return executeStaffOwnerHandoffLogic(deps, { ...input, surface });
  }
  return executePublicVisitorHandoffLogic(deps, { ...input, surface });
}

export function shouldExecuteHumanHandoff(
  prompt: string,
  sessionContext?: Record<string, unknown>,
): boolean {
  return (
    shouldExecuteHumanHandoffFromSession(sessionContext) ||
    isHumanHandoffExecutePrompt(prompt)
  );
}
