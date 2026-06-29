import { Injectable } from '@nestjs/common';
import { LlmService } from '../../engine/agent/llm.service.js';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  buildProductGuideLogicDeps,
  handleExplainAppFeatureLogic,
  handleExplainAppFeatureLogicAsync,
  handleExplainCurrentScreenLogic,
  handleExplainCurrentScreenLogicAsync,
  handleGuideUserFlowLogic,
  handleGuideUserFlowLogicAsync,
  type ProductGuideLogicInput,
} from './ai-product-guide.logic.js';
import { getFrontendGuideCorpusMessages } from './guide/ai-guide-corpus-i18n.fixtures.js';
import { resolveLocale } from '../../common/i18n/messages.js';
import type { ProductGuideRetrieveQuery } from './ai-product-guide-ranking.util.js';
import {
  rankAllGuideTopics,
  resolveGuideKeywordMatch,
} from './ai-product-guide-match.util.js';
import { GuideTelemetryService } from './guide-telemetry.service.js';
import type { ProductGuideTelemetryRecorder } from './guide/guide-telemetry.types.js';

@Injectable()
export class AiProductGuideService {
  constructor(
    private readonly llm: LlmService,
    private readonly openAi: OpenAiGatewayService,
    private readonly guideTelemetry: GuideTelemetryService,
  ) {}

  private buildTelemetryRecorder(): ProductGuideTelemetryRecorder {
    return {
      recordTopicOpened: (input) => this.guideTelemetry.recordTopicOpened(input),
      recordGroundingFailure: (input) => this.guideTelemetry.recordGroundingFailure(input),
    };
  }

  private withTelemetryContext(
    context: Omit<ProductGuideLogicInput, 'businessId' | 'params' | 'prompt'>,
  ): Omit<ProductGuideLogicInput, 'businessId' | 'params' | 'prompt'> {
    return {
      ...context,
      telemetry: this.buildTelemetryRecorder(),
    };
  }

  private buildDeps(businessId: string, userId?: string) {
    return buildProductGuideLogicDeps(businessId, this.llm, this.openAi, userId);
  }

  retrieveRankedTopics(query: ProductGuideRetrieveQuery) {
    const locale = resolveLocale(query.locale);
    const messages = getFrontendGuideCorpusMessages(locale);
    return rankAllGuideTopics({ ...query, locale }, messages);
  }

  isConfidentMatch(score: number): boolean {
    return score >= 0.55;
  }

  pickBestTopic(query: ProductGuideRetrieveQuery) {
    const locale = resolveLocale(query.locale);
    const messages = getFrontendGuideCorpusMessages(locale);
    const match = resolveGuideKeywordMatch({ ...query, locale }, messages);
    if (match.kind === 'flow' && match.flowBest) {
      return {
        topicId: match.flowBest.topicId,
        score: match.flowBest.score,
        reasons: match.flowBest.reasons,
        source: 'flow' as const,
      };
    }
    if (match.kind === 'corpus' && match.corpusBest) {
      return {
        topicId: match.corpusBest.topicId,
        score: match.corpusBest.score,
        reasons: match.corpusBest.reasons,
        source: 'corpus' as const,
      };
    }
    return null;
  }

  handleExplainAppFeature(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt = '',
    context: Omit<ProductGuideLogicInput, 'businessId' | 'params' | 'prompt'> = {},
  ): CommandResult {
    return handleExplainAppFeatureLogic({
      businessId,
      params,
      prompt: prompt || String(params._prompt ?? ''),
      ...this.withTelemetryContext(context),
    });
  }

  async handleExplainAppFeatureAsync(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt = '',
    context: Omit<ProductGuideLogicInput, 'businessId' | 'params' | 'prompt'> = {},
  ): Promise<CommandResult> {
    return handleExplainAppFeatureLogicAsync(
      {
        businessId,
        params,
        prompt: prompt || String(params._prompt ?? ''),
        ...this.withTelemetryContext(context),
      },
      this.buildDeps(businessId, context.userId),
    );
  }

  handleGuideUserFlow(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt = '',
    context: Omit<ProductGuideLogicInput, 'businessId' | 'params' | 'prompt'> = {},
  ): CommandResult {
    return handleGuideUserFlowLogic({
      businessId,
      params,
      prompt: prompt || String(params._prompt ?? ''),
      ...this.withTelemetryContext(context),
    });
  }

  async handleGuideUserFlowAsync(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt = '',
    context: Omit<ProductGuideLogicInput, 'businessId' | 'params' | 'prompt'> = {},
  ): Promise<CommandResult> {
    return handleGuideUserFlowLogicAsync(
      {
        businessId,
        params,
        prompt: prompt || String(params._prompt ?? ''),
        ...this.withTelemetryContext(context),
      },
      this.buildDeps(businessId, context.userId),
    );
  }

  handleExplainCurrentScreen(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt = '',
    context: Omit<ProductGuideLogicInput, 'businessId' | 'params' | 'prompt'> = {},
  ): CommandResult {
    return handleExplainCurrentScreenLogic({
      businessId,
      params,
      prompt: prompt || String(params._prompt ?? ''),
      ...this.withTelemetryContext(context),
    });
  }

  async handleExplainCurrentScreenAsync(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt = '',
    context: Omit<ProductGuideLogicInput, 'businessId' | 'params' | 'prompt'> = {},
  ): Promise<CommandResult> {
    return handleExplainCurrentScreenLogicAsync(
      {
        businessId,
        params,
        prompt: prompt || String(params._prompt ?? ''),
        ...this.withTelemetryContext(context),
      },
      this.buildDeps(businessId, context.userId),
    );
  }
}
