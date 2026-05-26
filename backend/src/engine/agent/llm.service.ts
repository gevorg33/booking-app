import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AgentPlan, AgentContext, AgentType, PlanStatus } from './interfaces/agent.interfaces.js';

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
`;

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private client: OpenAI | null = null;

  constructor(private config: ConfigService) {
    const apiKey = config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
      this.logger.log('OpenAI client initialized — agents will use GPT-4o-mini');
    } else {
      this.logger.warn('OPENAI_API_KEY not set — agents will use fallback plans');
    }
  }

  get isAvailable(): boolean {
    return this.client !== null;
  }

  async buildPlan(
    agentType: AgentType,
    intent: string,
    context: AgentContext,
  ): Promise<{
    reasoning: string;
    steps: AgentPlan['steps'];
    constraints: string[];
    riskAssessment: AgentPlan['riskAssessment'];
    executionMode: 'suggestion' | 'requires_approval' | 'autonomous';
  } | null> {
    if (!this.client) return null;

    const systemPrompt = `You are an AI scheduling operations planner for a service business.
Your job is to interpret user intent and produce a structured, safe execution plan.
You NEVER directly execute anything — you only plan.
Business ID: ${context.businessId}
Date range: ${context.dateRange ? `${context.dateRange.start.toISOString()} to ${context.dateRange.end.toISOString()}` : 'not specified'}
Agent type: ${agentType}

${PLAN_SCHEMA}`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `User intent: "${intent}"` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 1000,
      });

      const raw = response.choices[0]?.message?.content;
      if (!raw) return null;

      return JSON.parse(raw);
    } catch (err: any) {
      this.logger.error(`LLM plan generation failed: ${err.message}`);
      return null;
    }
  }
}
