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
import {
  isGuideCorpusMatchConfident,
  pickBestGuideCorpusTopic,
  rankGuideCorpusTopics,
  type ProductGuideRetrieveQuery,
} from './ai-product-guide-ranking.util.js';
import { getFrontendGuideCorpusMessages } from './guide/ai-guide-corpus-i18n.fixtures.js';
import { resolveLocale } from '../../common/i18n/messages.js';

@Injectable()
export class AiProductGuideService {
  constructor(
    private readonly llm: LlmService,
    private readonly openAi: OpenAiGatewayService,
  ) {}

  private buildDeps(businessId: string, userId?: string) {
    return buildProductGuideLogicDeps(businessId, this.llm, this.openAi, userId);
  }

  retrieveRankedTopics(query: ProductGuideRetrieveQuery) {
    const locale = resolveLocale(query.locale);
    const messages = getFrontendGuideCorpusMessages(locale);
    return rankGuideCorpusTopics({ ...query, locale }, messages);
  }

  isConfidentMatch(score: number): boolean {
    return isGuideCorpusMatchConfident(score);
  }

  pickBestTopic(query: ProductGuideRetrieveQuery) {
    const locale = resolveLocale(query.locale);
    const messages = getFrontendGuideCorpusMessages(locale);
    return pickBestGuideCorpusTopic({ ...query, locale }, messages);
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
      ...context,
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
        ...context,
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
      ...context,
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
        ...context,
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
      ...context,
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
        ...context,
      },
      this.buildDeps(businessId, context.userId),
    );
  }
}
