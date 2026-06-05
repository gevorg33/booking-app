import type { AgentPlanStep } from '../../agent/interfaces/agent.interfaces.js';
import type { BookingToolRunContext } from './booking-tool.types.js';
import type { AgentToolBridgeService } from '../services/agent-tool-bridge.service.js';
import {
  fuzzyMatchByName,
  getRequestedEmployeeNames,
  inferDirectSchedulePeriods,
  matchEmployeesInPrompt,
  resolveDirectScheduleDateKeys,
  resolveDirectSchedulePeriodServiceIds,
  resolveScheduleDates,
} from '../../../modules/ai/ai-orchestration.helpers.js';
import { normalizeTime24 } from '../../../common/utils/time-format.util.js';
import { buildDateParams } from './booking-tool-schemas.js';

const MAX_TOOL_RESULT_CHARS = 8000;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

/** Human-readable provider label — never returns raw UUIDs when catalog is available. */
export function resolveEmployeeLabel(
  ctx: BookingToolRunContext,
  employeeId?: string | null,
  employeeName?: string | null,
): string {
  const rawName = employeeName?.trim();
  if (rawName && !isUuid(rawName)) return rawName;

  const id =
    employeeId?.trim() || (rawName && isUuid(rawName) ? rawName : undefined);
  if (id) {
    const match = ctx.employees.find((e) => e.id === id);
    if (match?.name?.trim()) return match.name.trim();
  }

  return 'provider';
}

export function withResolvedEmployeeParams(
  ctx: BookingToolRunContext,
  params: { employeeId?: string; employeeName?: string } & Record<
    string,
    unknown
  >,
): Record<string, unknown> {
  const label = resolveEmployeeLabel(
    ctx,
    params.employeeId,
    params.employeeName,
  );
  return { ...params, employeeName: label };
}

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
    (chainPrevious && ctx.proposals.length
      ? [ctx.proposals[ctx.proposals.length - 1].id]
      : []);

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

export function priorStepId(
  ctx: BookingToolRunContext,
  action: string,
): string[] {
  const id = ctx.lastStepByAction[action];
  return id ? [id] : [];
}

type DirectSchedulePeriodInput = {
  startTime: string;
  endTime: string;
  type: 'service_block' | 'unavailable_block';
  serviceIds?: string[];
  label?: string;
};

function normalizeDirectSchedulePeriods(
  raw: DirectSchedulePeriodInput[] | undefined,
  input: Record<string, unknown>,
  employeeServiceIds?: string[],
): Array<Record<string, unknown>> {
  const inferred = inferDirectSchedulePeriods(
    {
      periods: raw,
      timeFrom: input.timeFrom,
      timeTo: input.timeTo,
    },
    typeof input.scheduleHint === 'string' ? input.scheduleHint : '',
  );
  const base =
    inferred.length > 0
      ? inferred
      : [
          {
            startTime: '09:00',
            endTime: '19:00',
            type: 'service_block',
            serviceIds: [],
          },
        ];

  return base.map((p) => ({
    startTime: normalizeTime24(String(p.startTime)),
    endTime: normalizeTime24(String(p.endTime)),
    type: p.type ?? 'service_block',
    placeholderLabel: p.placeholderLabel ?? p.label,
    serviceIds: resolveDirectSchedulePeriodServiceIds(
      {
        type: p.type ?? 'service_block',
        serviceIds: Array.isArray(p.serviceIds) ? p.serviceIds : [],
      },
      employeeServiceIds,
    ),
  }));
}

export function buildDirectScheduleProposalSteps(
  ctx: BookingToolRunContext,
  input: Record<string, unknown>,
  provider: {
    employeeId?: string;
    employeeName?: string;
    periods?: DirectSchedulePeriodInput[];
  },
  options?: { chainSteps?: boolean },
): Array<{
  action: string;
  description: string;
  params: Record<string, unknown>;
  chainPrevious?: boolean;
}> {
  const dates = resolveDirectScheduleDateKeys({
    ...input,
    ...buildDateParams(input),
  });
  if (!dates.length) {
    throw new Error(
      'Direct schedule requires date, dates, or dateFrom/dateTo (YYYY-MM-DD).',
    );
  }

  const employee = ctx.employees.find((e) => e.id === provider.employeeId);
  const periods = normalizeDirectSchedulePeriods(
    provider.periods ??
      (input.periods as DirectSchedulePeriodInput[] | undefined),
    input,
    employee?.serviceIds,
  );
  const label = resolveEmployeeLabel(
    ctx,
    provider.employeeId,
    provider.employeeName,
  );

  return dates.map((date, index) => ({
    action: 'create_direct_schedule',
    description: `Set schedule for ${label} on ${date}`,
    params: withResolvedEmployeeParams(ctx, {
      employeeId: provider.employeeId,
      employeeName: label,
      date,
      periods,
      userId: ctx.userId,
    }),
    chainPrevious: index > 0 && (options?.chainSteps ?? false),
  }));
}

function resolveClearScheduleProviders(
  ctx: BookingToolRunContext,
  input: {
    employeeId?: string;
    employeeName?: string;
    employeeNames?: string[];
    providers?: Array<{ employeeId?: string; employeeName?: string }>;
  },
): Array<{ employeeId?: string; employeeName: string }> {
  if (input.providers?.length) {
    return input.providers.map((provider) => ({
      employeeId: provider.employeeId,
      employeeName: resolveEmployeeLabel(
        ctx,
        provider.employeeId,
        provider.employeeName,
      ),
    }));
  }

  const requested = getRequestedEmployeeNames({
    employeeName: input.employeeName,
    employeeNames: input.employeeNames,
  });

  const resolved: Array<{ employeeId?: string; employeeName: string }> = [];
  const seen = new Set<string>();

  const addEmployee = (
    employeeId: string | undefined,
    employeeName: string,
  ) => {
    const key = employeeId ?? employeeName.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    resolved.push({ employeeId, employeeName });
  };

  for (const name of requested) {
    const match = fuzzyMatchByName(ctx.employees, name);
    if (match) addEmployee(match.id, match.name);
    else addEmployee(undefined, name);
  }

  if (input.employeeId) {
    addEmployee(
      input.employeeId,
      resolveEmployeeLabel(ctx, input.employeeId, input.employeeName),
    );
  }

  if (resolved.length === 0 && ctx.prompt) {
    for (const employee of matchEmployeesInPrompt(ctx.prompt, ctx.employees)) {
      addEmployee(employee.id, employee.name);
    }
  }

  return resolved;
}

export function buildClearScheduleProposalSteps(
  ctx: BookingToolRunContext,
  input: Record<string, unknown>,
  options?: { chainSteps?: boolean },
): Array<{
  action: string;
  description: string;
  params: Record<string, unknown>;
  chainPrevious?: boolean;
}> {
  const providers = resolveClearScheduleProviders(ctx, input);
  if (!providers.length) {
    throw new Error('Clear schedule requires at least one provider.');
  }

  const dates = resolveScheduleDates(
    {
      ...input,
      ...buildDateParams(input),
      _timeZone: ctx.timeZone,
    },
    ctx.prompt,
  );
  if (!dates.length) {
    throw new Error(
      'Clear schedule requires date, dates, dateFrom/dateTo, or a month in the prompt.',
    );
  }

  const steps: Array<{
    action: string;
    description: string;
    params: Record<string, unknown>;
    chainPrevious?: boolean;
  }> = [];

  for (const provider of providers) {
    for (const date of dates) {
      const label = provider.employeeName;
      steps.push({
        action: 'clear_schedule',
        description: `Clear schedule for ${label} on ${date}`,
        params: withResolvedEmployeeParams(ctx, {
          employeeId: provider.employeeId,
          employeeName: label,
          date,
          userId: ctx.userId,
        }),
        chainPrevious: steps.length > 0 && (options?.chainSteps ?? false),
      });
    }
  }

  return steps;
}
