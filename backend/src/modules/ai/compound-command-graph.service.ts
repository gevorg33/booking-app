import { Injectable, Logger } from '@nestjs/common';
import { END, START, StateGraph, Annotation } from '@langchain/langgraph';
import { AgentPlan } from '../../engine/agent/interfaces/agent.interfaces.js';
import { CommandCompletionPipelineService } from './command-completion.pipeline.service.js';
import { OperationalPlanBuilderService } from './operational-plan-builder.service.js';
import { CommandOrchestrationService } from './command-orchestration.service.js';
import {
  inferDirectSchedulePeriods,
  resolveAutoExecute,
  sanitizeProviderScopeFromPrompt,
} from './ai-orchestration.helpers.js';
import { shouldValidateAction } from './command-completion.validator.js';
import { formatDateDisplay } from '../../common/utils/date-format.util.js';
import type { CommandResult } from './command-completion.types.js';
import type { Employee } from '../employee/entities/employee.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import type { Customer } from '../customer/entities/customer.entity.js';
import type { ScheduleTemplate } from '../schedule/entities/schedule-template.entity.js';
import { mergeCompoundStepParams } from './ai-command-entity-params.util.js';
import {
  enrichCompoundSubStepBookingHints,
  isBookingCompoundSubStepAction,
  mergeBookingHintsIntoSessionContext,
} from './ai-compound-booking-hints.util.js';
import {
  enrichCompoundSubStepScheduleHints,
  isScheduleOpsAction,
  mergeScheduleHintsIntoSessionContext,
} from './ai-schedule-ops-hints.util.js';
import {
  enrichCompoundSubStepPackageMultiHints,
  isDashboardPackageMultiAction,
  mergePackageMultiServiceHintsIntoSessionContext,
} from './ai-package-multi-service-hints.util.js';
import {
  enrichCompoundSubStepGiftCardPaymentsHints,
  isGiftCardPaymentsAction,
  mergeGiftCardPaymentsHintsIntoSessionContext,
} from './ai-gift-card-payments-hints.util.js';

export interface CompoundGraphCatalog {
  employees: Employee[];
  services: Service[];
  customers: Customer[];
  templates: ScheduleTemplate[];
}

export interface CompoundSubIntent {
  action: string;
  params: Record<string, any>;
  reasoning: string;
}

export interface CompoundGraphInput {
  businessId: string;
  prompt: string;
  userId?: string;
  sessionContext: Record<string, any>;
  subIntents: CompoundSubIntent[];
  catalog: CompoundGraphCatalog;
  timeZone: string;
  confidenceThresholds: { low: number; high: number };
  buildPlan: (
    action: string,
    params: Record<string, any>,
    employeeId: string | undefined,
    pendingCancelBookingIds?: string[],
  ) => Promise<AgentPlan | null>;
  toCommandResult: (
    orch: Awaited<ReturnType<CommandOrchestrationService['executePlan']>>,
  ) => CommandResult;
  executeReadOnlySubIntent?: (
    action: string,
    params: Record<string, any>,
  ) => Promise<CommandResult | null>;
}

const READ_ONLY_COMPOUND_ACTIONS = new Set([
  'list_bookings',
  'show_appointments',
  'check_availability',
  'summarize_day',
  'summarize_bookings',
  'analyze_appointments',
  'analyze_services',
  'summarize_staff',
  'lookup_customer',
  'summarize_waitlist',
  'lookup_service_assignment',
  'list_services',
  'list_employees',
  'list_templates',
  'list_schedule_gaps',
  'summarize_utilization',
  'summarize_customers',
]);

const CompoundState = Annotation.Root({
  businessId: Annotation<string>,
  prompt: Annotation<string>,
  userId: Annotation<string | undefined>,
  sessionContext: Annotation<Record<string, any>>,
  subIntents: Annotation<CompoundSubIntent[]>,
  catalog: Annotation<CompoundGraphCatalog>,
  timeZone: Annotation<string>,
  confidenceThresholds: Annotation<{ low: number; high: number }>,
  currentIndex: Annotation<number>({ reducer: (_p, n) => n, default: () => 0 }),
  plans: Annotation<AgentPlan[]>({
    reducer: (_p, n) => n,
    default: () => [],
  }),
  pendingCancelBookingIds: Annotation<string[]>({
    reducer: (_p, n) => n,
    default: () => [],
  }),
  pipelineTrace: Annotation<string[]>({
    reducer: (_p, n) => n,
    default: () => [],
  }),
  error: Annotation<CommandResult | undefined>({
    reducer: (_p, n) => n,
    default: () => undefined,
  }),
  result: Annotation<CommandResult | undefined>({
    reducer: (_p, n) => n,
    default: () => undefined,
  }),
  readOnlySummaries: Annotation<string[]>({
    reducer: (_p, n) => n,
    default: () => [],
  }),
  skippedSteps: Annotation<string[]>({
    reducer: (_p, n) => n,
    default: () => [],
  }),
});

type CompoundGraphState = typeof CompoundState.State;

@Injectable()
export class CompoundCommandGraphService {
  private readonly logger = new Logger(CompoundCommandGraphService.name);
  private readonly graph;
  private buildPlanFn!: CompoundGraphInput['buildPlan'];
  private toCommandResultFn!: CompoundGraphInput['toCommandResult'];
  private executeReadOnlyFn?: CompoundGraphInput['executeReadOnlySubIntent'];

  constructor(
    private readonly completionPipeline: CommandCompletionPipelineService,
    private readonly planBuilder: OperationalPlanBuilderService,
    private readonly orchestration: CommandOrchestrationService,
  ) {
    this.graph = this.buildGraph();
  }

  async run(input: CompoundGraphInput): Promise<CommandResult> {
    this.buildPlanFn = input.buildPlan;
    this.toCommandResultFn = input.toCommandResult;
    this.executeReadOnlyFn = input.executeReadOnlySubIntent;

    const finalState = (await this.graph.invoke({
      businessId: input.businessId,
      prompt: input.prompt,
      userId: input.userId,
      sessionContext: input.sessionContext,
      subIntents: input.subIntents,
      catalog: input.catalog,
      timeZone: input.timeZone,
      confidenceThresholds: input.confidenceThresholds,
      currentIndex: 0,
      plans: [],
      pendingCancelBookingIds: [],
      pipelineTrace: [
        this.completionPipeline.trace(
          'classify',
          'compound_intent',
          `${input.subIntents.length} sub-intent(s) via LangGraph`,
        ),
      ],
      error: undefined,
      result: undefined,
      readOnlySummaries: [],
      skippedSteps: [],
    })) as CompoundGraphState;

    if (finalState.error) return finalState.error;
    if (finalState.result) return finalState.result;

    return {
      success: false,
      action: 'compound_intent',
      summary: 'Compound command graph did not produce a result.',
      details: {},
    };
  }

  private buildGraph() {
    return new StateGraph(CompoundState)
      .addNode('process_sub_intent', (state) => this.processSubIntent(state))
      .addNode('merge_and_execute', (state) => this.mergeAndExecute(state))
      .addEdge(START, 'process_sub_intent')
      .addConditionalEdges('process_sub_intent', (state) => {
        if (state.error) return END;
        if (state.currentIndex < state.subIntents.length)
          return 'process_sub_intent';
        return 'merge_and_execute';
      })
      .addEdge('merge_and_execute', END)
      .compile();
  }

  private async processSubIntent(state: CompoundGraphState) {
    const sub = state.subIntents[state.currentIndex];
    if (!sub) {
      return { currentIndex: state.currentIndex };
    }

    const sessionMerged = this.completionPipeline.mergeSessionContext(
      sub.params,
      { ...state.sessionContext, timeZone: state.timeZone },
      sub.action,
    );
    const parsedParams: Record<string, any> = {
      ...mergeCompoundStepParams(
        state.sessionContext,
        sessionMerged,
        sub.action,
      ),
      _timeZone: state.timeZone,
    };

    const parsed = {
      action: sub.action,
      params: parsedParams,
      reasoning: sub.reasoning,
    };

    this.applyScheduleScope(
      state.prompt,
      parsedParams,
      parsed.action,
      state.catalog.employees,
    );
    enrichCompoundSubStepBookingHints(
      parsed.action,
      parsedParams,
      state.prompt,
      state.timeZone,
    );
    enrichCompoundSubStepScheduleHints(
      parsed.action,
      parsedParams,
      state.prompt,
      state.timeZone,
      state.catalog.employees.map((e) => ({ id: e.id, name: e.name })),
    );
    enrichCompoundSubStepPackageMultiHints(
      parsed.action,
      parsedParams,
      state.prompt,
      state.catalog.employees.map((e) => ({ id: e.id, name: e.name })),
      state.catalog.customers.map((c) => ({ id: c.id, name: c.name })),
    );
    enrichCompoundSubStepGiftCardPaymentsHints(
      parsed.action,
      parsedParams,
      state.prompt,
    );
    this.completionPipeline.normalizeDateParams(
      parsedParams,
      state.prompt,
      state.timeZone,
    );

    if (parsed.action === 'reschedule_booking') {
      this.completionPipeline.finalizeRescheduleParams(
        parsedParams,
        state.prompt,
        state.timeZone,
      );
    } else if (this.isScheduleMutating(parsed.action)) {
      this.completionPipeline.enrichDateRangeParams(
        parsedParams,
        state.prompt,
        state.timeZone,
      );
      this.completionPipeline.normalizeDateParams(
        parsedParams,
        state.prompt,
        state.timeZone,
      );
    }

    if (parsed.action === 'create_direct_schedule') {
      parsedParams.periods = inferDirectSchedulePeriods(
        parsedParams,
        state.prompt,
      );
    }

    if (
      parsed.action === 'hide_appointments_from_calendar' &&
      state.pendingCancelBookingIds.length
    ) {
      parsedParams.statusFilter = parsedParams.statusFilter ?? 'cancelled';
    }

    const resolved = this.completionPipeline.resolve(
      state.businessId,
      state.prompt,
      parsed,
      state.catalog,
      state.timeZone,
    );

    if (shouldValidateAction(parsed.action)) {
      const validation = this.completionPipeline.validate(resolved);
      if (!validation.ok) {
        const clarify = this.completionPipeline.toClarifyResult(
          resolved,
          validation,
        );
        clarify.details = {
          ...(clarify.details ?? {}),
          pipelineTrace: state.pipelineTrace,
          compoundStep: parsed.action,
        };
        return { error: clarify };
      }
    }

    let plan: AgentPlan | null = null;

    if (
      parsed.action === 'hide_appointments_from_calendar' &&
      state.pendingCancelBookingIds.length
    ) {
      plan = this.planBuilder.buildHideAppointmentsPlan(
        state.businessId,
        state.pendingCancelBookingIds,
        state.userId,
        {
          employeeName: resolved.enrichedParams.employeeName,
          date: resolved.enrichedParams.date
            ? formatDateDisplay(resolved.enrichedParams.date)
            : undefined,
          statuses: ['cancelled'],
        },
      );
    } else {
      plan = await this.buildPlanFn(
        parsed.action,
        resolved.enrichedParams,
        resolved.entities.employeeId,
        state.pendingCancelBookingIds,
      );
    }

    const plans = [...state.plans];
    let pendingCancelBookingIds = [...state.pendingCancelBookingIds];

    if (plan) {
      plans.push(plan);
      if (parsed.action === 'cancel_bookings') {
        const cancelStep = plan.steps.find(
          (s) => s.action === 'cancel_bookings',
        );
        pendingCancelBookingIds =
          (cancelStep?.params?.bookingIds as string[] | undefined) ??
          pendingCancelBookingIds;
      }
    } else if (
      READ_ONLY_COMPOUND_ACTIONS.has(parsed.action) &&
      this.executeReadOnlyFn
    ) {
      const readResult = await this.executeReadOnlyFn(
        parsed.action,
        resolved.enrichedParams,
      );
      if (readResult?.success) {
        let sessionContext = state.sessionContext;
        if (isBookingCompoundSubStepAction(parsed.action)) {
          sessionContext = mergeBookingHintsIntoSessionContext(
            sessionContext,
            parsedParams,
          );
        }
        if (isScheduleOpsAction(parsed.action)) {
          sessionContext = mergeScheduleHintsIntoSessionContext(
            sessionContext,
            parsedParams,
            parsed.action,
          );
        }
        if (isDashboardPackageMultiAction(parsed.action)) {
          sessionContext = mergePackageMultiServiceHintsIntoSessionContext(
            sessionContext,
            parsedParams,
            parsed.action,
          );
        }
        if (isGiftCardPaymentsAction(parsed.action)) {
          sessionContext = mergeGiftCardPaymentsHintsIntoSessionContext(
            sessionContext,
            parsedParams,
            parsed.action,
          );
        }
        return {
          currentIndex: state.currentIndex + 1,
          plans,
          pendingCancelBookingIds,
          sessionContext,
          pipelineTrace: [
            ...state.pipelineTrace,
            this.completionPipeline.trace(
              'execute',
              parsed.action,
              readResult.summary,
            ),
          ],
          readOnlySummaries: [...state.readOnlySummaries, readResult.summary],
        };
      }
    } else {
      return {
        currentIndex: state.currentIndex + 1,
        plans,
        pendingCancelBookingIds,
        pipelineTrace: [
          ...state.pipelineTrace,
          this.completionPipeline.trace(
            'resolve',
            parsed.action,
            'Could not build plan for step',
          ),
        ],
        skippedSteps: [...state.skippedSteps, parsed.action],
      };
    }

    const pipelineTrace = [
      ...state.pipelineTrace,
      this.completionPipeline.trace('resolve', parsed.action, sub.reasoning),
    ];

    let sessionContext = state.sessionContext;
    if (isBookingCompoundSubStepAction(parsed.action)) {
      sessionContext = mergeBookingHintsIntoSessionContext(
        sessionContext,
        parsedParams,
      );
    }
    if (isScheduleOpsAction(parsed.action)) {
      sessionContext = mergeScheduleHintsIntoSessionContext(
        sessionContext,
        parsedParams,
        parsed.action,
      );
    }
    if (isDashboardPackageMultiAction(parsed.action)) {
      sessionContext = mergePackageMultiServiceHintsIntoSessionContext(
        sessionContext,
        parsedParams,
        parsed.action,
      );
    }
    if (isGiftCardPaymentsAction(parsed.action)) {
      sessionContext = mergeGiftCardPaymentsHintsIntoSessionContext(
        sessionContext,
        parsedParams,
        parsed.action,
      );
    }

    return {
      currentIndex: state.currentIndex + 1,
      plans,
      pendingCancelBookingIds,
      pipelineTrace,
      sessionContext,
    };
  }

  private async mergeAndExecute(state: CompoundGraphState) {
    if (!state.plans.length) {
      if (state.readOnlySummaries.length) {
        return {
          result: {
            success: true,
            action: 'compound_intent',
            summary: state.readOnlySummaries.join('\n\n'),
            details: {
              subIntents: state.subIntents.map((s) => s.action),
              readOnlySummaries: state.readOnlySummaries,
              skippedSteps: state.skippedSteps,
              decomposed: true,
              langGraphPath: 'compound',
            },
          },
        };
      }
      return {
        error: {
          success: false,
          action: 'compound_intent',
          summary:
            state.skippedSteps.length > 0
              ? `Could not build a plan. Skipped steps: ${state.skippedSteps.join(', ')}.`
              : 'Could not build a plan from the compound command.',
          details: {
            subIntents: state.subIntents,
            skippedSteps: state.skippedSteps,
          },
        },
      };
    }

    const merged = this.planBuilder.mergePlans(
      state.businessId,
      'compound_intent',
      state.plans,
    );
    const providerCount =
      new Set(
        merged.steps
          .map((s) => s.params?.employeeId as string | undefined)
          .filter(Boolean),
      ).size || 1;

    const orch = await this.orchestration.executePlan({
      plan: merged,
      businessId: state.businessId,
      userId: state.userId,
      autoExecute: resolveAutoExecute({
        action: 'compound_intent',
        stepCount: merged.steps.length,
        providerCount,
        confidence: 0.9,
        thresholds: state.confidenceThresholds,
      }),
    });

    const result = this.toCommandResultFn(orch);
    if (state.readOnlySummaries.length) {
      result.summary = [result.summary, ...state.readOnlySummaries]
        .filter(Boolean)
        .join('\n\n');
    }
    result.details = {
      ...result.details,
      pipelineTrace: state.pipelineTrace,
      subIntents: state.subIntents.map((s) => s.action),
      decomposed: true,
      langGraphPath: 'compound',
      readOnlySummaries: state.readOnlySummaries.length
        ? state.readOnlySummaries
        : undefined,
      skippedSteps: state.skippedSteps.length ? state.skippedSteps : undefined,
    };

    return { result };
  }

  private isScheduleMutating(action: string): boolean {
    return [
      'create_direct_schedule',
      'clear_schedule',
      'apply_schedule',
      'block_schedule',
      'fill_unused_slots',
      'cancel_bookings',
      'hide_appointments_from_calendar',
    ].includes(action);
  }

  private applyScheduleScope(
    prompt: string,
    params: Record<string, any>,
    action: string,
    employees: Employee[],
  ): void {
    if (
      ![
        'create_direct_schedule',
        'clear_schedule',
        'apply_schedule',
        'block_schedule',
        'fill_unused_slots',
        'cancel_bookings',
        'hide_appointments_from_calendar',
      ].includes(action)
    ) {
      return;
    }

    sanitizeProviderScopeFromPrompt(prompt, params, employees);
  }
}
