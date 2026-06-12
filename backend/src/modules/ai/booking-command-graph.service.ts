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
import {
  attachReactFallbackTelemetry,
  shouldUseReactAgentFallback,
} from './booking-command-react-fallback.util.js';

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
    const graphPath =
      this.decomposition.isCompoundPrompt(input.effectivePrompt) ||
      input.complexityRoute?.tier === 'compound'
        ? 'compound'
        : 'single';

    let result: CommandResult;

    if (graphPath === 'compound') {
      result = await this.runCompound(input);
    } else {
      result = await input.delegates.executeSingleIntent();
    }

    if (
      shouldUseReactAgentFallback({
        reactEnabled: this.router.useReactAgent(),
        complexityTier: input.complexityRoute?.tier,
        pipelineResult: result,
      })
    ) {
      const reactResult = await this.runReactAgent(input);
      if (reactResult) {
        return attachReactFallbackTelemetry(reactResult);
      }
    }

    return this.reasoning.enrichResult(input.businessId, input.prompt, result, {
      graphPath,
      subIntents: result.details?.subIntents as string[] | undefined,
    });
  }

  private async runReactAgent(
    input: CommandGraphRunInput,
  ): Promise<CommandResult | null> {
    try {
      this.logger.log(
        `ReAct fallback (unknown after semantic+rescue): "${input.effectivePrompt.slice(0, 80)}..."`,
      );

      const output = await this.reactAgent.run({
        businessId: input.businessId,
        prompt: input.effectivePrompt,
        userId: input.userId,
        timeZone: input.timeZone,
        employees: input.catalog.employees,
        services: input.catalog.services,
        templates: input.catalog.templates,
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

      return this.reasoning.enrichResult(
        input.businessId,
        input.prompt,
        result,
        {
          graphPath: 'react_agent',
        },
      );
    } catch (err: any) {
      this.logger.warn(
        `ReAct fallback failed, keeping pipeline unknown result: ${err?.message ?? err}`,
      );
      return null;
    }
  }

  private async runCompound(
    input: CommandGraphRunInput,
  ): Promise<CommandResult> {
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
          sessionContext: {
            ...input.session?.context,
            timeZone: input.timeZone,
          },
          subIntents,
          catalog: input.catalog,
          timeZone: input.timeZone,
          confidenceThresholds: input.confidenceThresholds,
          buildPlan: input.delegates.buildCompoundPlan,
          toCommandResult: input.delegates.toCommandResult,
          executeReadOnlySubIntent: input.delegates.executeReadOnlySubIntent,
        });
      } catch (err: any) {
        this.logger.warn(
          `Compound LangGraph failed, falling back: ${err?.message ?? err}`,
        );
      }
    }

    return input.delegates.executeLegacyCompound();
  }
}
