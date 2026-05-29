import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { Business } from '../../business/entities/business.entity.js';
import { AiCallContext, DEFAULT_OPENAI_MODEL } from './openai.types.js';
import { OpenAiIntegrationService } from './openai-integration.service.js';
import { AiUsageService } from './ai-usage.service.js';

export interface ChatCompletionParams {
  model?: string;
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  responseFormat?: 'json_object' | 'text';
  temperature?: number;
  maxTokens?: number;
}

@Injectable()
export class OpenAiGatewayService {
  private readonly logger = new Logger(OpenAiGatewayService.name);
  private readonly clientCache = new Map<string, OpenAI>();

  constructor(
    @InjectRepository(Business) private businessRepo: Repository<Business>,
    private readonly config: ConfigService,
    private readonly integrationService: OpenAiIntegrationService,
    private readonly usageService: AiUsageService,
  ) {}

  private resolveDefaultModel(): string {
    return this.config.get<string>('OPENAI_MODEL')?.trim() || DEFAULT_OPENAI_MODEL;
  }

  /** GPT-5+ and o-series models use max_completion_tokens instead of max_tokens. */
  private completionTokenLimit(model: string, maxTokens: number): Record<string, number> {
    if (/^gpt-5|^o[1-9]/i.test(model)) {
      return { max_completion_tokens: maxTokens };
    }
    return { max_tokens: maxTokens };
  }

  invalidateBusiness(businessId: string): void {
    for (const key of this.clientCache.keys()) {
      if (key.startsWith(`${businessId}:`)) {
        this.clientCache.delete(key);
      }
    }
  }

  async isAvailableForBusiness(businessId: string): Promise<boolean> {
    return this.integrationService.isAvailableForBusiness(businessId);
  }

  private async getClient(businessId: string): Promise<{ client: OpenAI; source: 'platform' | 'business' } | null> {
    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) return null;

    const runtime = this.integrationService.resolveRuntimeConfig(business.settings);
    if (!runtime) return null;

    const cacheKey = `${businessId}:${runtime.source}`;
    let client = this.clientCache.get(cacheKey);
    if (!client) {
      client = new OpenAI({ apiKey: runtime.apiKey });
      this.clientCache.set(cacheKey, client);
    }

    return { client, source: runtime.source };
  }

  async chatCompletion(
    context: AiCallContext,
    params: ChatCompletionParams,
  ): Promise<OpenAI.Chat.Completions.ChatCompletion | null> {
    const resolved = await this.getClient(context.businessId);
    if (!resolved) return null;

    const model = params.model ?? this.resolveDefaultModel();

    try {
      const response = await resolved.client.chat.completions.create({
        model,
        messages: params.messages,
        ...(params.responseFormat === 'json_object'
          ? { response_format: { type: 'json_object' as const } }
          : {}),
        temperature: params.temperature ?? 0.2,
        ...this.completionTokenLimit(model, params.maxTokens ?? 2000),
      });

      const usage = response.usage;
      if (usage) {
        await this.usageService.recordUsage({
          context,
          model,
          promptTokens: usage.prompt_tokens ?? 0,
          completionTokens: usage.completion_tokens ?? 0,
          keySource: resolved.source,
        });
      }

      return response;
    } catch (err: any) {
      this.logger.error(
        `OpenAI completion failed [${context.surface}/${context.operation}] business=${context.businessId}: ${err.message}`,
      );
      return null;
    }
  }

  async completeJson<T>(
    context: AiCallContext,
    systemPrompt: string,
    userPrompt: string,
    options: { temperature?: number; maxTokens?: number } = {},
  ): Promise<T | null> {
    const response = await this.chatCompletion(context, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      responseFormat: 'json_object',
      temperature: options.temperature ?? 0.2,
      maxTokens: options.maxTokens ?? 2000,
    });

    const raw = response?.choices[0]?.message?.content;
    if (!raw) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      this.logger.warn(`Failed to parse JSON from OpenAI response [${context.operation}]`);
      return null;
    }
  }
}
