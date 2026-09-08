import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { AiEntityMemoryService } from './ai-entity-memory.service.js';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import { AiSettingsService } from './ai-settings.service.js';

describe('AiEntityMemoryService', () => {
  // F1 — typed rather than bare `jest.fn()`: with @types/jest 30 a bare mock
  // infers an `unknown` return, so `mockResolvedValue(...)` resolves its
  // parameter to `never`.
  const openAi = {
    isAvailableForBusiness:
      jest.fn<(businessId: string) => Promise<boolean>>(),
    completeJson: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  };
  const aiSettings = {
    getEntityMemory: jest.fn<(businessId: string) => Promise<unknown>>(),
    mergeEntityMemory:
      jest.fn<(businessId: string, aliases: unknown) => Promise<void>>(),
  };

  let service: AiEntityMemoryService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AiEntityMemoryService(openAi as any, aiSettings as any);
  });

  it('constructs through Nest DI', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AiEntityMemoryService,
        { provide: OpenAiGatewayService, useValue: openAi },
        { provide: AiSettingsService, useValue: aiSettings },
      ],
    }).compile();
    expect(moduleRef.get(AiEntityMemoryService)).toBeInstanceOf(
      AiEntityMemoryService,
    );
  });

  it('getEntityMemory delegates to settings', async () => {
    aiSettings.getEntityMemory.mockResolvedValue({
      aliases: { gevorg: { employeeName: 'Gevorg' } },
    });
    await expect(service.getEntityMemory('biz-1')).resolves.toEqual({
      aliases: { gevorg: { employeeName: 'Gevorg' } },
    });
  });

  it('buildMemoryContextBlock formats stored aliases', async () => {
    aiSettings.getEntityMemory.mockResolvedValue({
      aliases: { gevorg: { employeeName: 'Gevorg' } },
    });
    const block = await service.buildMemoryContextBlock('biz-1');
    expect(block).toContain('gevorg');
    expect(block).toContain('Gevorg');
  });

  it('learnFromCommand skips when OpenAI unavailable', async () => {
    openAi.isAvailableForBusiness.mockResolvedValue(false);
    await service.learnFromCommand('biz-1', 'show gevorg', 'list_bookings', {});
    expect(openAi.completeJson).not.toHaveBeenCalled();
  });

  it('learnFromCommand merges aliases from LLM on dashboard surface', async () => {
    openAi.isAvailableForBusiness.mockResolvedValue(true);
    openAi.completeJson.mockResolvedValue({
      aliases: { gevorg: { employeeName: 'Gevorg' } },
    });
    await service.learnFromCommand('biz-1', 'show gevorg', 'list_bookings', {
      employee: 'Gevorg',
    });
    expect(aiSettings.mergeEntityMemory).toHaveBeenCalledWith('biz-1', {
      gevorg: { employeeName: 'Gevorg' },
    });
  });

  it('learnFromCommand supports provider_mobile surface', async () => {
    openAi.isAvailableForBusiness.mockResolvedValue(true);
    openAi.completeJson.mockResolvedValue({
      aliases: { maria: { employeeName: 'Maria' } },
    });
    await service.learnFromCommand(
      'biz-1',
      'maria today',
      'list_bookings',
      {},
      'provider_mobile',
    );
    expect(openAi.completeJson).toHaveBeenCalledWith(
      expect.objectContaining({ surface: 'provider_mobile' }),
      expect.any(String),
      expect.any(String),
      expect.any(Object),
    );
  });

  it('learnFromCommand skips empty alias payloads', async () => {
    openAi.isAvailableForBusiness.mockResolvedValue(true);
    openAi.completeJson.mockResolvedValue({ aliases: {} });
    await service.learnFromCommand('biz-1', 'hi', 'list_bookings', {});
    expect(aiSettings.mergeEntityMemory).not.toHaveBeenCalled();
  });

  it('learnFromCommand skips null LLM responses', async () => {
    openAi.isAvailableForBusiness.mockResolvedValue(true);
    openAi.completeJson.mockResolvedValue(null);
    await service.learnFromCommand('biz-1', 'hi', 'list_bookings', {});
    expect(aiSettings.mergeEntityMemory).not.toHaveBeenCalled();
  });

  it('resolveMention returns direct alias hit with trimmed mention', async () => {
    aiSettings.getEntityMemory.mockResolvedValue({
      aliases: { gevorg: { employeeName: 'Gevorg' } },
    });
    await expect(
      service.resolveMention('biz-1', '  Gevorg  ', 'catalog'),
    ).resolves.toEqual({
      employeeName: 'Gevorg',
    });
  });

  it('resolveMention returns direct alias hit', async () => {
    aiSettings.getEntityMemory.mockResolvedValue({
      aliases: { gevorg: { employeeName: 'Gevorg' } },
    });
    await expect(
      service.resolveMention('biz-1', 'Gevorg', 'catalog'),
    ).resolves.toEqual({
      employeeName: 'Gevorg',
    });
    expect(openAi.completeJson).not.toHaveBeenCalled();
  });

  it('resolveMention treats missing confidence as zero', async () => {
    aiSettings.getEntityMemory.mockResolvedValue({ aliases: {} });
    openAi.isAvailableForBusiness.mockResolvedValue(true);
    openAi.completeJson.mockResolvedValue({ employeeName: 'Maybe' });
    await expect(
      service.resolveMention('biz-1', 'maybe', 'catalog'),
    ).resolves.toBeNull();
  });

  it('resolveMention returns null when OpenAI unavailable after miss', async () => {
    aiSettings.getEntityMemory.mockResolvedValue({ aliases: {} });
    openAi.isAvailableForBusiness.mockResolvedValue(false);
    await expect(
      service.resolveMention('biz-1', 'unknown', 'catalog'),
    ).resolves.toBeNull();
  });

  it('resolveMention uses LLM when alias missing and confidence is high', async () => {
    aiSettings.getEntityMemory.mockResolvedValue({ aliases: {} });
    openAi.isAvailableForBusiness.mockResolvedValue(true);
    openAi.completeJson.mockResolvedValue({
      employeeName: 'Maria',
      confidence: 0.9,
    });
    await expect(
      service.resolveMention('biz-1', 'maria', 'providers: Maria'),
    ).resolves.toEqual({
      employeeName: 'Maria',
      confidence: 0.9,
    });
  });

  it('resolveMention accepts confidence at the 0.6 threshold', async () => {
    aiSettings.getEntityMemory.mockResolvedValue({ aliases: {} });
    openAi.isAvailableForBusiness.mockResolvedValue(true);
    openAi.completeJson.mockResolvedValue({
      employeeName: 'Maria',
      confidence: 0.6,
    });
    await expect(
      service.resolveMention('biz-1', 'maria', 'catalog'),
    ).resolves.toEqual({
      employeeName: 'Maria',
      confidence: 0.6,
    });
  });

  it('resolveMention rejects low-confidence LLM matches', async () => {
    aiSettings.getEntityMemory.mockResolvedValue({ aliases: {} });
    openAi.isAvailableForBusiness.mockResolvedValue(true);
    openAi.completeJson.mockResolvedValue({
      employeeName: 'Maybe',
      confidence: 0.4,
    });
    await expect(
      service.resolveMention('biz-1', 'maybe', 'catalog'),
    ).resolves.toBeNull();
  });

  it('resolveMention rejects null LLM responses', async () => {
    aiSettings.getEntityMemory.mockResolvedValue({ aliases: {} });
    openAi.isAvailableForBusiness.mockResolvedValue(true);
    openAi.completeJson.mockResolvedValue(null);
    await expect(
      service.resolveMention('biz-1', 'x', 'catalog'),
    ).resolves.toBeNull();
  });
});
