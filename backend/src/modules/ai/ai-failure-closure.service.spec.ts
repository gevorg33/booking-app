import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { AiFailureClosureService } from './ai-failure-closure.service.js';
import type { AiEvalLabelQueue } from './entities/ai-eval-label-queue.entity.js';

describe('AiFailureClosureService (acc-6.2)', () => {
  const aiSettings = {
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
    mergeEntityMemory: jest.fn(),
  };

  let service: AiFailureClosureService;

  beforeEach(() => {
    jest.clearAllMocks();
    aiSettings.getSettings.mockResolvedValue({ accuracyProgram: {} });
    aiSettings.updateSettings.mockResolvedValue({});
    aiSettings.mergeEntityMemory.mockResolvedValue(undefined);
    service = new AiFailureClosureService(aiSettings as any);
  });

  const baseRow = (): AiEvalLabelQueue =>
    ({
      id: 'item-1',
      businessId: 'biz-1',
      promptHash: 'abc123hash456',
      promptSnippet: 'show appointments today',
      locale: 'en',
      surface: 'dashboard',
      classifiedAction: 'list_bookings',
      correctedAction: 'show_appointments',
      confidence: 0.4,
      failureCount: 2,
      failureSignals: null,
      status: 'labeled',
      expectedAction: null,
      expectedRescuedAction: 'show_appointments',
      expectedParams: null,
      labelOutcome: 'execution',
      rescueFromAction: 'list_bookings',
      expectedClarifyFields: null,
      evalCaseId: 'harvest-biz-1-abc',
      fixType: null,
      fixStatus: null,
      fixRef: null,
      closureSummary: null,
      closureAppliedAt: null,
      labeledBy: 'user-1',
      labeledAt: new Date(),
      source: 'harvest',
      createdAt: new Date(),
      updatedAt: new Date(),
    }) as AiEvalLabelQueue;

  it('executePipeline applies rescue rule and marks closure applied', async () => {
    const plan = await service.executePipeline('biz-1', baseRow());
    expect(plan.fixType).toBe('rescue');
    expect(plan.fixStatus).toBe('applied');
    expect(aiSettings.updateSettings).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({
        accuracyProgram: expect.objectContaining({
          learnedRescueRules: expect.arrayContaining([
            expect.objectContaining({ toAction: 'show_appointments' }),
          ]),
        }),
      }),
    );
  });

  it('executePipeline merges entity aliases for alias fix type', async () => {
    const row = baseRow();
    row.expectedRescuedAction = row.classifiedAction;
    row.expectedParams = { customerName: 'Maria K.' };
    const plan = await service.executePipeline('biz-1', row);
    expect(plan.fixType).toBe('alias');
    expect(aiSettings.mergeEntityMemory).toHaveBeenCalledWith(
      'biz-1',
      expect.objectContaining({ 'maria k.': { customerName: 'Maria K.' } }),
    );
  });

  it('applyClosureFieldsToRow persists closure metadata', () => {
    const row = baseRow();
    service.applyClosureFieldsToRow(row, {
      fixType: 'fewshot',
      fixStatus: 'applied',
      fixRef: 'fewshot:create_booking',
      summary: 'done',
    });
    expect(row.fixType).toBe('fewshot');
    expect(row.closureAppliedAt).toBeInstanceOf(Date);
  });
});
