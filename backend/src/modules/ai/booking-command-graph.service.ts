import { Injectable, Logger } from '@nestjs/common';
import { BookingAgentRouterService } from '../../engine/langgraph/services/booking-agent-router.service.js';
import { ReactBookingAgentService } from '../../engine/langgraph/services/react-booking-agent.service.js';
import { IntentDecompositionService } from './intent-decomposition.service.js';
import { CompoundCommandGraphService } from './compound-command-graph.service.js';
import { CommandReasoningService } from './command-reasoning.service.js';
import { ReactResultCompilerService } from './react-result-compiler.service.js';
import type { CommandResult } from './command-completion.types.js';
import type { CommandSessionOptions } from './ai-command.service.js';
import type { Employee } from '../employee/entities/employee.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import type { Customer } from '../customer/entities/customer.entity.js';
import type { ScheduleTemplate } from '../schedule/entities/schedule-template.entity.js';
import type { AgentPlan } from '../../engine/agent/interfaces/agent.interfaces.js';
import type { OrchestrationResult } from './command-orchestration.service.js';

export interface ComplexityRoute {
  tier: 'read_only' | 'simple_mutate' | 'orchestration' | 'compound';
  useDecomposition?: boolean;
  reasoning?: string;
}

export interface CommandGraphCatalog {
  employees: Employee[];
  services: Service[];
  customers: Customer[];
  templates: ScheduleTemplate[];
}

export interface CommandGraphDelegates {
  executeSingleIntent: () => Promise<CommandResult>;
  buildCompoundPlan: (
    action: string,
    params: Record<string, any>,
    employeeId: string | undefined,
    pendingCancelBookingIds?: string[],
  ) => Promise<AgentPlan | null>;
  toCommandResult: (orch: OrchestrationResult) => CommandResult;
  executeLegacyCompound: () => Promise<CommandResult>;
  executeReadOnlySubIntent?: (
    action: string,
    params: Record<string, any>,
  ) => Promise<CommandResult | null>;
}

export interface CommandGraphRunInput {
  businessId: string;
  prompt: string;
  effectivePrompt: string;
  userId?: string;
  session?: CommandSessionOptions;
  catalog: CommandGraphCatalog;
  timeZone: string;
  confidenceThresholds: { low: number; high: number };
  complexityRoute?: ComplexityRoute;
  delegates: CommandGraphDelegates;
}

const AMBIGUOUS_PATTERNS =
  /\b(fix|figure out|what'?s wrong|help me with|diagnose|investigate|what should i do|something wrong|sort out|deal with)\b/i;

const ORCHESTRATION_INTENT_HINTS =
  /\b(optimize|conflict|recover|reassign|rebook|waitlist|underutilized|gaps?|utilization)\b/i;

const FALLBACK_BOOKING_PATTERN =
  /\b(if .+ (not available|unavailable|busy|can'?t)|otherwise|else (book|try)|then (try|book)|who(?:ever)? is free|whoever(?:'s| is) available)\b/i;

@Injectable()
export class BookingCommandGraphService {
  private readonly logger = new Logger(BookingCommandGraphService.name);

  constructor(
    private readonly router: BookingAgentRouterService,
    private readonly decomposition: IntentDecompositionService,
    private readonly compoundGraph: CompoundCommandGraphService,
    private readonly reasoning: CommandReasoningService,
    private readonly reactAgent: ReactBookingAgentService,
    private readonly reactCompiler: ReactResultCompilerService,
  ) {}

  isEnabled(): boolean {
    return this.router.useCommandGraph();
  }

  async run(input: CommandGraphRunInput): Promise<CommandResult> {
    if (this.shouldUseReactAgent(input)) {
      const reactResult = await this.runReactAgent(input);
      if (reactResult) return reactResult;
    }

    const graphPath = this.decomposition.isCompoundPrompt(input.effectivePrompt)
      || input.complexityRoute?.tier === 'compound'
      ? 'compound'
      : 'single';

    let result: CommandResult;

    if (graphPath === 'compound') {
      result = await this.runCompound(input);
    } else {
      result = await input.delegates.executeSingleIntent();
    }

    return this.reasoning.enrichResult(input.businessId, input.prompt, result, {
      graphPath,
      subIntents: result.details?.subIntents as string[] | undefined,
    });
  }

  private shouldUseReactAgent(input: CommandGraphRunInput): boolean {
    if (!this.router.useReactAgent()) return false;

    const tier = input.complexityRoute?.tier;
    if (tier === 'compound') return false;
    if (tier === 'read_only' || tier === 'simple_mutate') return false;

    if (tier === 'orchestration') return true;
    if (FALLBACK_BOOKING_PATTERN.test(input.effectivePrompt)) return true;
    if (AMBIGUOUS_PATTERNS.test(input.effectivePrompt)) return true;
    if (ORCHESTRATION_INTENT_HINTS.test(input.effectivePrompt)) return true;

    return false;
  }

  private async runReactAgent(input: CommandGraphRunInput): Promise<CommandResult | null> {
    try {
      this.logger.log(`ReAct tool agent: "${input.effectivePrompt.slice(0, 80)}..."`);

      const output = await this.reactAgent.run({
        businessId: input.businessId,
        prompt: input.effectivePrompt,
        userId: input.userId,
        timeZone: input.timeZone,
        employees: input.catalog.employees,
        services: input.catalog.services,
      });

      if (output.error) {
        this.logger.warn(`ReAct agent error: ${output.error}`);
        return null;
      }

      const result = await this.reactCompiler.compile({
        businessId: input.businessId,
        userId: input.userId,
        prompt: input.prompt,
        messages: output.messages,
        proposals: output.proposals,
      });

      return this.reasoning.enrichResult(input.businessId, input.prompt, result, {
        graphPath: 'react_agent',
      });
    } catch (err: any) {
      this.logger.warn(`ReAct agent failed, falling back to classify path: ${err?.message ?? err}`);
      return null;
    }
  }

  private async runCompound(input: CommandGraphRunInput): Promise<CommandResult> {
    const subIntents = await this.decomposition.decompose(
      input.businessId,
      input.userId,
      input.effectivePrompt,
      input.timeZone,
    );

    if (subIntents.length <= 1) {
      return input.delegates.executeSingleIntent();
    }

    if (this.router.useCompoundGraph()) {
      try {
        return await this.compoundGraph.run({
          businessId: input.businessId,
          prompt: input.effectivePrompt,
          userId: input.userId,
          sessionContext: { ...input.session?.context, timeZone: input.timeZone },
          subIntents,
          catalog: input.catalog,
          timeZone: input.timeZone,
          confidenceThresholds: input.confidenceThresholds,
          buildPlan: input.delegates.buildCompoundPlan,
          toCommandResult: input.delegates.toCommandResult,
          executeReadOnlySubIntent: input.delegates.executeReadOnlySubIntent,
        });
      } catch (err: any) {
        this.logger.warn(`Compound LangGraph failed, falling back: ${err?.message ?? err}`);
      }
    }

    return input.delegates.executeLegacyCompound();
  }
}
