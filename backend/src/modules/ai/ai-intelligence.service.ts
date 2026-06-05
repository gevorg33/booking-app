import { Injectable, Logger } from '@nestjs/common';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import { AiSettingsService } from './ai-settings.service.js';
import type { BusinessPlaybook } from './ai-settings.types.js';
import type { AgentPlan } from '../../engine/agent/interfaces/agent.interfaces.js';
import { isScheduleTemplateCreationPrompt } from './ai-orchestration.helpers.js';

interface PlaybookMatchResult {
  playbookId: string | null;
  prompt: string | null;
  reasoning?: string;
}

interface PolicyExplainResult {
  headline: string;
  explanation: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface ComplexityRouteResult {
  tier: 'read_only' | 'simple_mutate' | 'orchestration' | 'compound';
  useDecomposition: boolean;
  reasoning?: string;
}

@Injectable()
export class AiIntelligenceService {
  private readonly logger = new Logger(AiIntelligenceService.name);

  constructor(
    private openAi: OpenAiGatewayService,
    private aiSettings: AiSettingsService,
  ) {}

  /** LLM playbook matching (replaces substring triggers). */
  async matchPlaybook(
    businessId: string,
    userPrompt: string,
  ): Promise<BusinessPlaybook | null> {
    const settings = await this.aiSettings.getSettings(businessId);
    const enabled = settings.playbooks.filter((p) => p.enabled);
    if (enabled.length === 0) return null;

    if (!(await this.openAi.isAvailableForBusiness(businessId))) {
      return this.aiSettings.matchPlaybook(settings, userPrompt);
    }

    const system = `Pick the best matching business playbook for the user message, or none.
Return JSON: { "playbookId": string|null, "prompt": string|null, "reasoning": string }
Playbooks: ${JSON.stringify(enabled.map((p) => ({ id: p.id, name: p.name, triggers: p.triggers, description: p.description })))}`;

    const result = await this.openAi.completeJson<PlaybookMatchResult>(
      {
        businessId,
        surface: 'dashboard',
        operation: 'playbook_match',
        actorType: 'system',
      },
      system,
      userPrompt,
      { maxTokens: 300 },
    );

    if (!result?.playbookId) return null;
    const pb = enabled.find((p) => p.id === result.playbookId);
    if (!pb) return null;
    return { ...pb, prompt: result.prompt ?? pb.prompt };
  }

  /** Plain-language policy / risk explanation for plan preview (ai-d10). */
  async explainPolicyRisk(
    businessId: string,
    plan: AgentPlan,
    violations: string[],
    policyPreview?: Record<string, unknown>,
  ): Promise<PolicyExplainResult | null> {
    if (!(await this.openAi.isAvailableForBusiness(businessId))) return null;

    const system = `Explain why an AI schedule/booking plan needs approval in plain language for a salon owner.
Return JSON: { "headline": "short title", "explanation": "2-3 sentences", "riskLevel": "low"|"medium"|"high" }`;

    const user = JSON.stringify({
      intent: plan.intent,
      stepCount: plan.steps?.length ?? 0,
      riskAssessment: plan.riskAssessment,
      violations,
      policyPreview,
      steps: plan.steps?.map((s) => ({
        action: s.action,
        description: s.description,
      })),
    });

    return this.openAi.completeJson<PolicyExplainResult>(
      {
        businessId,
        surface: 'dashboard',
        operation: 'policy_explain',
        actorType: 'system',
      },
      system,
      user,
      { maxTokens: 400 },
    );
  }

  /** Route prompt complexity — when to decompose vs single classify (ai-i10). */
  async routeComplexity(
    businessId: string,
    prompt: string,
    surface: 'dashboard' | 'provider_mobile',
  ): Promise<ComplexityRouteResult> {
    if (isScheduleTemplateCreationPrompt(prompt)) {
      return {
        tier: 'simple_mutate',
        useDecomposition: false,
        reasoning: 'Single schedule template creation',
      };
    }

    if (!(await this.openAi.isAvailableForBusiness(businessId))) {
      return {
        tier: prompt.includes(' and ') ? 'compound' : 'simple_mutate',
        useDecomposition: prompt.includes(' and '),
      };
    }

    const system = `Classify operational command complexity for routing.
Return JSON: { "tier": "read_only"|"simple_mutate"|"orchestration"|"compound", "useDecomposition": boolean, "reasoning": string }
- read_only: list, summarize, check availability
- simple_mutate: single booking cancel/create, one block
- orchestration: optimize schedule, resolve conflicts, multi-provider week setup
- compound: multiple distinct commands joined with "and"/"then"`;

    const result = await this.openAi.completeJson<ComplexityRouteResult>(
      {
        businessId,
        surface,
        operation: 'complexity_route',
        actorType: 'system',
      },
      system,
      prompt,
      { maxTokens: 200 },
    );

    return (
      result ?? {
        tier: 'simple_mutate',
        useDecomposition: false,
      }
    );
  }

  /** Weekly ops narrative (ai-d18). */
  async generateWeeklyReport(
    businessId: string,
    snapshot: Record<string, unknown>,
  ): Promise<{
    title: string;
    sections: Array<{ heading: string; body: string }>;
  } | null> {
    if (!(await this.openAi.isAvailableForBusiness(businessId))) return null;

    const system = `Write a concise weekly operations report for a salon booking business.
Return JSON: { "title": string, "sections": [{ "heading": string, "body": string }] }
Include: utilization, gaps, conflicts, cancellations, top recommendations. 3-5 sections max.`;

    return this.openAi.completeJson(
      {
        businessId,
        surface: 'dashboard',
        operation: 'weekly_ops_report',
        actorType: 'system',
      },
      system,
      JSON.stringify(snapshot),
      { maxTokens: 1200 },
    );
  }
}
