import { Injectable, Logger } from '@nestjs/common';
import {
  AgentPlan,
  AgentContext,
  AgentType,
} from './interfaces/agent.interfaces.js';
import { OpenAiGatewayService } from '../../modules/integrations/openai/openai-gateway.service.js';
import { AiCallContext } from '../../modules/integrations/openai/openai.types.js';

const PLAN_SCHEMA = `
Return a JSON object with this exact structure:
{
  "reasoning": "string — explain your thinking",
  "steps": [
    {
      "id": "unique-string",
      "action": "snake_case_action_name",
      "description": "human readable description",
      "params": { "key": "value" },
      "dependsOn": ["step-id-or-empty-array"],
      "estimatedImpact": "string"
    }
  ],
  "constraints": ["constraint1", "constraint2"],
  "riskAssessment": {
    "level": "low|medium|high",
    "factors": ["factor1"]
  },
  "executionMode": "suggestion|requires_approval|autonomous"
}

Rules:
- Steps must form a valid DAG (no circular dependencies)
- Autonomous is only allowed for read-only or zero-risk actions
- All booking modifications require requires_approval
- Keep steps minimal and purposeful — do not over-engineer
- Never include steps that directly mutate data unless explicitly asked
- Use ONLY these action names (snake_case):
  fetch_current_schedule, list_appointments, analyze_utilization, identify_schedule_gaps,
  generate_optimization_recommendations, find_freed_slots, find_rebooking_candidates,
  propose_reassignment, detect_conflicts, analyze_resolution_options, propose_resolutions,
  execute_reassignment,
  create_booking, cancel_bookings, fill_schedule_gaps, apply_template, create_block_schedule,
  create_direct_schedule, reschedule_booking, assign_employee_services, summarize_utilization
- Do NOT invent new action names
`;

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(private readonly openAi: OpenAiGatewayService) {}

  async isAvailableForBusiness(businessId: string): Promise<boolean> {
    return this.openAi.isAvailableForBusiness(businessId);
  }

  async completeJson<T>(
    businessId: string,
    systemPrompt: string,
    userPrompt: string,
    meta: Omit<AiCallContext, 'businessId'>,
    temperature = 0.2,
    maxTokens = 2000,
  ): Promise<T | null> {
    const context: AiCallContext = { businessId, ...meta };
    return this.openAi.completeJson<T>(context, systemPrompt, userPrompt, {
      temperature,
      maxTokens,
    });
  }

  async buildPlan(
    agentType: AgentType,
    intent: string,
    context: AgentContext,
    userId?: string,
  ): Promise<{
    reasoning: string;
    steps: AgentPlan['steps'];
    constraints: string[];
    riskAssessment: AgentPlan['riskAssessment'];
    executionMode: 'suggestion' | 'requires_approval' | 'autonomous';
  } | null> {
    const systemPrompt = `You are an AI scheduling operations planner for a service business.
Your job is to interpret user intent and produce a structured, safe execution plan.
You NEVER directly execute anything — you only plan.
Business ID: ${context.businessId}
Date range: ${context.dateRange ? `${context.dateRange.start.toISOString()} to ${context.dateRange.end.toISOString()}` : 'not specified'}
Agent type: ${agentType}

${PLAN_SCHEMA}`;

    const callContext: AiCallContext = {
      businessId: context.businessId,
      surface: 'agent',
      operation: `build_plan_${agentType}`,
      actorType: userId ? 'manager' : 'system',
      userId,
    };

    const result = await this.openAi.completeJson<{
      reasoning: string;
      steps: AgentPlan['steps'];
      constraints: string[];
      riskAssessment: AgentPlan['riskAssessment'];
      executionMode: 'suggestion' | 'requires_approval' | 'autonomous';
    }>(callContext, systemPrompt, `User intent: "${intent}"`, {
      temperature: 0.2,
      maxTokens: 1000,
    });

    if (!result) {
      this.logger.warn(
        `LLM plan generation returned null for business ${context.businessId}`,
      );
    }

    return result;
  }
}
