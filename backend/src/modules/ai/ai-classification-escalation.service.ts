import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import {
  DEFAULT_OPENAI_ESCALATION_MODEL,
  type AiActorType,
} from '../integrations/openai/openai.types.js';
import type {
  EnrichClassificationInput,
  EnrichedClassification,
} from './ai-classification-engine.types.js';
import {
  applyEscalationTieBreakerToIntent,
  buildEscalationTieBreakerSystemPrompt,
  buildEscalationTieBreakerUserPayload,
  resolveAllowedEscalationActions,
  type ClassificationTieBreakerPayload,
  type ClassificationTieBreakerResult,
} from './ai-classification-escalation.util.js';

@Injectable()
export class AiClassificationEscalationService {
  constructor(
    private readonly openAi: OpenAiGatewayService,
    private readonly config: ConfigService,
  ) {}

  resolveEscalationModel(): string {
    return (
      this.config.get<string>('OPENAI_ESCALATION_MODEL')?.trim() ||
      DEFAULT_OPENAI_ESCALATION_MODEL
    );
  }

  private resolveActorType(surface: EnrichClassificationInput['surface']): AiActorType {
    if (surface === 'dashboard') return 'manager';
    if (surface === 'provider') return 'provider';
    return 'customer';
  }

  private resolveSurface(surface: EnrichClassificationInput['surface']) {
    if (surface === 'public') return 'public_booking' as const;
    if (surface === 'provider') return 'provider_mobile' as const;
    if (surface === 'customer') return 'customer' as const;
    return 'dashboard' as const;
  }

  async runTieBreaker(
    input: EnrichClassificationInput,
    enriched: EnrichedClassification,
  ): Promise<ClassificationTieBreakerResult | null> {
    if (!input.businessId || input.skipEscalationTieBreaker) return null;
    if (!enriched.consensus.needsEscalation) return null;
    if (!(await this.openAi.isAvailableForBusiness(input.businessId))) {
      return null;
    }

    const allowedActions = resolveAllowedEscalationActions(
      input.shortlist,
      enriched.consensus,
      enriched.intent.action,
    );
    const model = this.resolveEscalationModel();
    const payload = await this.openAi.completeJson<ClassificationTieBreakerPayload>(
      {
        businessId: input.businessId,
        surface: this.resolveSurface(input.surface),
        operation: 'classify_tie_breaker',
        actorType: this.resolveActorType(input.surface),
      },
      buildEscalationTieBreakerSystemPrompt(input.surface, allowedActions),
      buildEscalationTieBreakerUserPayload({
        prompt: input.prompt,
        surface: input.surface,
        intent: enriched.intent,
        consensus: enriched.consensus,
        deterministicRoute: input.deterministicRoute,
        shortlist: input.shortlist,
      }),
      { temperature: 0, maxTokens: 450, model },
    );

    if (!payload?.action || !allowedActions.includes(payload.action)) {
      return null;
    }

    return {
      ...payload,
      model,
      resolved: true,
    };
  }

  async applyTieBreakerIfNeeded(
    input: EnrichClassificationInput,
    enriched: EnrichedClassification,
  ): Promise<EnrichedClassification> {
    const tieBreaker = await this.runTieBreaker(input, enriched);
    if (!tieBreaker?.resolved) {
      return enriched;
    }

    const intent = applyEscalationTieBreakerToIntent(enriched.intent, tieBreaker);
    return {
      ...enriched,
      intent,
      tieBreaker,
      consensus: {
        ...enriched.consensus,
        needsEscalation: false,
        reason: undefined,
      },
    };
  }
}
