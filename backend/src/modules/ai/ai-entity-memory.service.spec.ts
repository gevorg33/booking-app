import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { AiEntityMemoryService } from './ai-entity-memory.service.js';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import { AiSettingsService } from './ai-settings.service.js';

describe('AiEntityMemoryService', () => {
  const openAi = {
    isAvailableForBusiness: jest.fn(),
    completeJson: jest.fn(),
  };
  const aiSettings = {
    getEntityMemory: jest.fn(),
    mergeEntityMemory: jest.fn(),
    mergeBusinessParaphrases: jest.fn(),
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

  it('learnFromCommand merges deterministic phrasing aliases without OpenAI', async () => {
    openAi.isAvailableForBusiness.mockResolvedValue(false);
    await service.learnFromCommand(
      'biz-1',
      'Book the usual with Gevorg tomorrow',
      'create_booking',
      { employee: 'Gevorg', service: 'Face massage' },
    );
    expect(aiSettings.mergeEntityMemory).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({
        'the usual': expect.objectContaining({
          employeeName: 'Gevorg',
          serviceName: 'Face massage',
        }),
      }),
    );
    expect(openAi.completeJson).not.toHaveBeenCalled();
  });

  it('learnFromCommand merges clarify-memory aliases (acc-4.4)', async () => {
    openAi.isAvailableForBusiness.mockResolvedValue(false);
    await service.learnFromCommand(
      'biz-1',
      'book with Anna tomorrow',
      'create_booking',
      {
        _clarifyMemory: { employeeName: 'Anna Smith' },
      },
    );
    expect(aiSettings.mergeEntityMemory).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({
        anna: expect.objectContaining({ employeeName: 'Anna Smith' }),
      }),
    );
  });

  it('learnFromCommand skips when OpenAI unavailable and no deterministic aliases', async () => {
    openAi.isAvailableForBusiness.mockResolvedValue(false);
    await service.learnFromCommand('biz-1', 'show appointments today', 'list_bookings', {});
    expect(openAi.completeJson).not.toHaveBeenCalled();
    expect(aiSettings.mergeEntityMemory).not.toHaveBeenCalled();
    expect(aiSettings.mergeBusinessParaphrases).toHaveBeenCalledWith(
      'biz-1',
      [
        expect.objectContaining({
          action: 'list_bookings',
          source: 'recurring',
          normalizedPhrase: 'show appointments today',
        }),
      ],
    );
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

  it('learnFromCorrection stores correction paraphrase', async () => {
    await service.learnFromCorrection(
      'biz-1',
      'pull the morning sheet',
      'list_bookings',
      'dashboard',
      'unknown',
    );
    expect(aiSettings.mergeBusinessParaphrases).toHaveBeenCalledWith(
      'biz-1',
      [
        expect.objectContaining({
          action: 'list_bookings',
          source: 'correction',
          surface: 'dashboard',
        }),
      ],
    );
  });

  it('learnFromCorrection skips when corrected action matches wrong action', async () => {
    await service.learnFromCorrection(
      'biz-1',
      'pull the morning sheet',
      'list_bookings',
      'dashboard',
      'list_bookings',
    );
    expect(aiSettings.mergeBusinessParaphrases).not.toHaveBeenCalled();
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
