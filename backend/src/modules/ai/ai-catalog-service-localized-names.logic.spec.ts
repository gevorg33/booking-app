import { describe, expect, it, jest } from '@jest/globals';
import type { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import {
  resolveCreateServiceLocalizedNames,
  translateServiceLocalizedNames,
} from './ai-catalog-service-localized-names.logic.js';

/**
 * The real `completeJson` is generic in its return type, which a `jest.fn` cannot
 * express, so requiring that exact type at this boundary only rejected every mock
 * — the helper casts to `OpenAiGatewayService` below regardless. This states the
 * call shape instead, which is what the assertions actually check.
 */
type CompleteJsonMock = (
  context: unknown,
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number },
) => Promise<unknown>;

function mockOpenAi(completeJson: CompleteJsonMock): OpenAiGatewayService {
  return {
    isAvailableForBusiness: jest.fn(async () => true),
    completeJson,
  } as unknown as OpenAiGatewayService;
}

describe('ai-catalog-service-localized-names.logic', () => {
  it('translates missing hy and ru titles via LLM', async () => {
    const openAi = mockOpenAi(
      jest.fn(async () => ({
        hy: 'Տղամարդու սանրվածք գլխի լվացումով',
        ru: 'Мужская стрижка с мытьем головы',
      })),
    );

    const result = await resolveCreateServiceLocalizedNames(openAi, {
      businessId: 'biz-1',
      serviceName: "Men's haircut with head wash",
      enabledLocales: ['en', 'hy', 'ru'],
    });

    expect(result).toEqual({
      hy: ['Տղամարդու սանրվածք գլխի լվացումով'],
      ru: ['Мужская стрижка с мытьем головы'],
    });
  });

  it('skips locales already provided explicitly', async () => {
    // Declares the arity so `toHaveBeenCalledWith` below can name four arguments.
    const completeJson = jest.fn(
      async (..._args: unknown[]) => ({ ru: 'Мужская стрижка' }),
    );
    const openAi = mockOpenAi(completeJson);

    const result = await resolveCreateServiceLocalizedNames(openAi, {
      businessId: 'biz-1',
      serviceName: "Men's haircut with head wash",
      enabledLocales: ['en', 'hy', 'ru'],
      params: { localizedNames: { hy: ['Տղամարդու սանրվածք'] } },
    });

    expect(result).toEqual({
      hy: ['Տղամարդու սանրվածք'],
      ru: ['Мужская стрижка'],
    });
    expect(completeJson).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(String),
      expect.stringContaining('keys ru only'),
      expect.any(Object),
    );
  });

  it('returns undefined when OpenAI is unavailable', async () => {
    const openAi = {
      isAvailableForBusiness: jest.fn(async () => false),
      completeJson: jest.fn(),
    } as unknown as OpenAiGatewayService;

    await expect(
      translateServiceLocalizedNames(openAi, {
        businessId: 'biz-1',
        serviceName: 'Haircut',
        targetLocales: ['hy', 'ru'],
      }),
    ).resolves.toBeUndefined();
  });
});
