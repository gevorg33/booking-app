import { Injectable } from '@nestjs/common';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import type { EnrichClassificationInput } from './ai-classification-engine.types.js';
import {
  mergeLlmSelfCheckWithRules,
  runClassificationSelfCheck,
  shouldRunLlmSelfCheck,
  type LlmSelfCheckResult,
} from './ai-classification-selfcheck.util.js';

const LLM_SELF_CHECK_SYSTEM = `You verify whether a classified booking command satisfies the user's message.
Return JSON only: {"satisfies": boolean, "confidence": number between 0 and 1, "reason": "short string"}
- satisfies=true only when the action AND extracted params would fulfill what the user asked.
- satisfies=false when the action family is wrong (e.g. booking vs availability vs cancel vs explain) or critical params are missing.
- Be strict on mutating actions (book/cancel/reschedule/configure).`;

@Injectable()
export class AiClassificationSelfCheckService {
  constructor(private readonly openAi: OpenAiGatewayService) {}

  runRuleSelfCheck(input: EnrichClassificationInput) {
    return runClassificationSelfCheck({
      prompt: input.prompt,
      surface: input.surface,
      intent: input.intent,
    });
  }

  async runLlmSelfCheck(
    input: EnrichClassificationInput,
  ): Promise<LlmSelfCheckResult | null> {
    if (!input.businessId) return null;
    if (!(await this.openAi.isAvailableForBusiness(input.businessId))) {
      return null;
    }

    const params = input.intent.params ?? {};
    const userPayload = JSON.stringify(
      {
        prompt: input.prompt,
        surface: input.surface,
        action: input.intent.action,
        params,
        reasoning: input.intent.reasoning ?? null,
      },
      null,
      0,
    );

    const result = await this.openAi.completeJson<LlmSelfCheckResult>(
      {
        businessId: input.businessId,
        surface:
          input.surface === 'public'
            ? 'public_booking'
            : input.surface === 'provider'
              ? 'provider_mobile'
              : input.surface,
        operation: 'classify_self_check',
        actorType:
          input.surface === 'dashboard'
            ? 'manager'
            : input.surface === 'provider'
              ? 'provider'
              : 'customer',
      },
      LLM_SELF_CHECK_SYSTEM,
      userPayload,
      { temperature: 0, maxTokens: 120 },
    );

    if (
      !result ||
      typeof result.satisfies !== 'boolean' ||
      typeof result.confidence !== 'number'
    ) {
      return null;
    }

    return {
      satisfies: result.satisfies,
      confidence: Math.max(0, Math.min(1, result.confidence)),
      reason: result.reason,
    };
  }

  async verifyClassification(input: EnrichClassificationInput) {
    const ruleVerification = this.runRuleSelfCheck(input);
    if (input.skipLlmSelfCheck || !shouldRunLlmSelfCheck(ruleVerification, input.intent)) {
      return ruleVerification;
    }

    const llmResult = await this.runLlmSelfCheck(input);
    return mergeLlmSelfCheckWithRules(ruleVerification, llmResult);
  }
}
