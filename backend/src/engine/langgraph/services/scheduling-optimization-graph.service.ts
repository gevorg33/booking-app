import { Injectable, Logger } from '@nestjs/common';
import { END, START, StateGraph } from '@langchain/langgraph';
import {
  AgentContext,
  AgentResult,
  AgentType,
  PlanStatus,
} from '../../agent/interfaces/agent.interfaces.js';
import { OpenAiGatewayService } from '../../../modules/integrations/openai/openai-gateway.service.js';
import {
  OptimizationStepIds,
  SchedulingOptimizationGraphState,
  SchedulingOptimizationState,
} from '../interfaces/scheduling-optimization-state.js';
import { AgentToolBridgeService } from './agent-tool-bridge.service.js';

@Injectable()
export class SchedulingOptimizationGraphService {
  private readonly logger = new Logger(SchedulingOptimizationGraphService.name);
  private readonly graph;

  constructor(
    private readonly toolBridge: AgentToolBridgeService,
    private readonly openAi: OpenAiGatewayService,
  ) {
    this.graph = this.buildGraph();
  }

  async run(context: AgentContext, intent: string): Promise<AgentResult> {
    const stepIds: OptimizationStepIds = {
      analyze: crypto.randomUUID(),
      gaps: crypto.randomUUID(),
      recommend: crypto.randomUUID(),
    };

    const finalState = (await this.graph.invoke({
      businessId: context.businessId,
      intent,
      dateRange: context.dateRange,
      stepIds,
      toolContext: { businessId: context.businessId },
      employeeCount: 0,
      gapCount: 0,
      recommendationCount: 0,
      reasoning: '',
    })) as SchedulingOptimizationGraphState;

    return this.toAgentResult(finalState, context, intent, stepIds);
  }

  private buildGraph() {
    return new StateGraph(SchedulingOptimizationState)
      .addNode('analyze_utilization', (state) => this.nodeAnalyze(state))
      .addNode('identify_schedule_gaps', (state) => this.nodeGaps(state))
      .addNode('generate_optimization_recommendations', (state) => this.nodeRecommend(state))
      .addNode('summarize', (state) => this.nodeSummarize(state))
      .addEdge(START, 'analyze_utilization')
      .addEdge('analyze_utilization', 'identify_schedule_gaps')
      .addEdge('identify_schedule_gaps', 'generate_optimization_recommendations')
      .addEdge('generate_optimization_recommendations', 'summarize')
      .addEdge('summarize', END)
      .compile();
  }

  private dateParams(state: SchedulingOptimizationGraphState) {
    return state.dateRange ? { dateRange: state.dateRange } : {};
  }

  private async nodeAnalyze(state: SchedulingOptimizationGraphState) {
    const { result, ctx } = await this.toolBridge.run(
      {
        stepId: state.stepIds.analyze,
        action: 'analyze_utilization',
        params: { businessId: state.businessId, ...this.dateParams(state) },
      },
      state.toolContext,
    );

    const employeeCount = (result as { utilization?: unknown[] })?.utilization?.length ?? 0;
    return { toolContext: ctx, employeeCount };
  }

  private async nodeGaps(state: SchedulingOptimizationGraphState) {
    const { result, ctx } = await this.toolBridge.run(
      {
        stepId: state.stepIds.gaps,
        action: 'identify_schedule_gaps',
        params: {
          businessId: state.businessId,
          ...this.dateParams(state),
          minUtilizationThreshold: 0.6,
        },
        dependsOn: [state.stepIds.analyze],
      },
      state.toolContext,
    );

    const gapCount =
      (result as { underutilizedEmployees?: unknown[] })?.underutilizedEmployees?.length ?? 0;
    return { toolContext: ctx, gapCount };
  }

  private async nodeRecommend(state: SchedulingOptimizationGraphState) {
    const { result, ctx } = await this.toolBridge.run(
      {
        stepId: state.stepIds.recommend,
        action: 'generate_optimization_recommendations',
        params: { businessId: state.businessId, optimizationGoal: state.intent },
        dependsOn: [state.stepIds.gaps],
      },
      state.toolContext,
    );

    const recommendationCount =
      (result as { recommendations?: unknown[] })?.recommendations?.length ?? 0;
    return { toolContext: ctx, recommendationCount };
  }

  private async nodeSummarize(state: SchedulingOptimizationGraphState) {
    const base = `LangGraph schedule optimization for "${state.intent}": analyzed ${state.employeeCount} provider(s), found ${state.gapCount} underutilized block(s), generated ${state.recommendationCount} recommendation(s).`;

    if (!(await this.openAi.isAvailableForBusiness(state.businessId))) {
      return { reasoning: base };
    }

    const summary = await this.openAi.completeJson<{ reasoning: string }>(
      {
        businessId: state.businessId,
        surface: 'agent',
        operation: 'langgraph_scheduling_optimization_summarize',
        actorType: 'system',
      },
      `Summarize schedule optimization for salon/spa staff. Return JSON: { "reasoning": "2-4 actionable sentences" }`,
      `Intent: ${state.intent}\nProviders: ${state.employeeCount}, gaps: ${state.gapCount}, recommendations: ${state.recommendationCount}\nBaseline: ${base}`,
      { temperature: 0.2, maxTokens: 450 },
    );

    return { reasoning: summary?.reasoning?.trim() || base };
  }

  private toAgentResult(
    state: SchedulingOptimizationGraphState,
    context: AgentContext,
    intent: string,
    stepIds: OptimizationStepIds,
  ): AgentResult {
    const dateParams = this.dateParams(state);

    return {
      plan: {
        id: crypto.randomUUID(),
        agentType: AgentType.SCHEDULING_OPTIMIZATION,
        businessId: context.businessId,
        intent,
        reasoning: state.reasoning,
        steps: [
          {
            id: stepIds.analyze,
            action: 'analyze_utilization',
            description: 'Analyze current schedule utilization across all employees',
            params: { businessId: context.businessId, ...dateParams },
            dependsOn: [],
            estimatedImpact: 'Read-only analysis',
          },
          {
            id: stepIds.gaps,
            action: 'identify_schedule_gaps',
            description: 'Identify underutilized time slots and scheduling gaps',
            params: {
              businessId: context.businessId,
              ...dateParams,
              minUtilizationThreshold: 0.6,
            },
            dependsOn: [stepIds.analyze],
            estimatedImpact: 'Read-only analysis',
          },
          {
            id: stepIds.recommend,
            action: 'generate_optimization_recommendations',
            description: 'Generate scheduling recommendations based on analysis',
            params: { businessId: context.businessId, optimizationGoal: intent },
            dependsOn: [stepIds.gaps],
            estimatedImpact: 'Generates suggestions only',
          },
        ],
        constraints: [
          'Must not modify existing confirmed bookings',
          'Must respect employee working hours',
          'Must maintain minimum buffer between bookings',
        ],
        riskAssessment: {
          level: 'low',
          factors: ['Read-only analysis and suggestions'],
        },
        status: PlanStatus.DRAFT,
        createdAt: new Date(),
      },
      executionMode: 'requires_approval',
    };
  }
}
