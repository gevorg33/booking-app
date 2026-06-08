import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { Business } from '../business/entities/business.entity.js';
import { AiCommandTrace } from './entities/ai-command-trace.entity.js';
import { AiAliasSuggestionService } from './ai-alias-suggestion.service.js';
import { AiEntityMemoryService } from './ai-entity-memory.service.js';

describe('AiAliasSuggestionService (acc-6.3)', () => {
  const traceRepo = { find: jest.fn() };
  const businessRepo = { find: jest.fn() };
  const entityMemory = {
    getEntityMemory: jest.fn(),
    mergeAliasSuggestions: jest.fn(),
  };

  let service: AiAliasSuggestionService;

  beforeEach(async () => {
    jest.clearAllMocks();
    entityMemory.getEntityMemory.mockResolvedValue({ aliases: {} });
    entityMemory.mergeAliasSuggestions.mockResolvedValue({
      aliases: {},
      pendingAliasSuggestions: [{ id: 's1', alias: 'gev' }],
    });
    traceRepo.find.mockResolvedValue([
      {
        traceId: 't1',
        rawPrompt: 'book gev for haircut tomorrow',
        action: 'create_booking',
        outcome: 'clarified',
        params: null,
        feedbackReason: null,
        feedbackRating: null,
        failureSignal: 'suspected_miss',
        correctedAction: 'create_booking',
        createdAt: new Date('2026-06-01T10:00:00.000Z'),
        userId: 'u1',
      },
      {
        traceId: 't2',
        rawPrompt: 'book gevorg for haircut tomorrow',
        action: 'create_booking',
        outcome: 'executed',
        params: { employeeName: 'Gevorg', serviceName: 'Haircut' },
        feedbackReason: null,
        feedbackRating: null,
        failureSignal: null,
        correctedAction: null,
        createdAt: new Date('2026-06-01T10:01:00.000Z'),
        userId: 'u1',
      },
      {
        traceId: 't3',
        rawPrompt: 'book gev for haircut tomorrow',
        action: 'create_booking',
        outcome: 'clarified',
        params: null,
        feedbackReason: null,
        feedbackRating: null,
        failureSignal: 'suspected_miss',
        correctedAction: 'create_booking',
        createdAt: new Date('2026-06-02T10:00:00.000Z'),
        userId: 'u1',
      },
      {
        traceId: 't4',
        rawPrompt: 'book gev for haircut tomorrow',
        action: 'create_booking',
        outcome: 'executed',
        params: { employeeName: 'Gevorg', serviceName: 'Haircut' },
        feedbackReason: null,
        feedbackRating: null,
        failureSignal: null,
        correctedAction: null,
        createdAt: new Date('2026-06-02T10:01:00.000Z'),
        userId: 'u1',
      },
      {
        traceId: 't5',
        rawPrompt: 'book gev for haircut tomorrow',
        action: 'create_booking',
        outcome: 'clarified',
        params: null,
        feedbackReason: null,
        feedbackRating: null,
        failureSignal: 'suspected_miss',
        correctedAction: 'create_booking',
        createdAt: new Date('2026-06-03T10:00:00.000Z'),
        userId: 'u1',
      },
      {
        traceId: 't6',
        rawPrompt: 'book gev for haircut tomorrow',
        action: 'create_booking',
        outcome: 'executed',
        params: { employeeName: 'Gevorg', serviceName: 'Haircut' },
        feedbackReason: null,
        feedbackRating: null,
        failureSignal: null,
        correctedAction: null,
        createdAt: new Date('2026-06-03T10:01:00.000Z'),
        userId: 'u1',
      },
    ]);

    const moduleRef = await Test.createTestingModule({
      providers: [
        AiAliasSuggestionService,
        { provide: getRepositoryToken(AiCommandTrace), useValue: traceRepo },
        { provide: getRepositoryToken(Business), useValue: businessRepo },
        { provide: AiEntityMemoryService, useValue: entityMemory },
      ],
    }).compile();
    service = moduleRef.get(AiAliasSuggestionService);
  });

  it('harvestForBusiness aggregates recurring corrections into pending suggestions', async () => {
    const result = await service.harvestForBusiness('biz-1', 30);
    expect(result.correctionEvents).toBeGreaterThan(0);
    expect(entityMemory.mergeAliasSuggestions).toHaveBeenCalled();
    expect(result.pendingTotal).toBe(1);
  });
});
