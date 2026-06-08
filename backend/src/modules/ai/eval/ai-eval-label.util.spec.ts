import { mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { AiEvalLabelQueue } from '../entities/ai-eval-label-queue.entity.js';
import {
  appendEvalCaseToHarvestedCasesFile,
  buildEvalCaseFromLabelQueueItem,
  formatHarvestedCasesModule,
  parseHarvestedCasesFromModule,
} from './ai-eval-label.util.js';

function buildQueueRow(
  overrides: Partial<AiEvalLabelQueue> = {},
): AiEvalLabelQueue {
  return {
    id: 'queue-1',
    businessId: 'biz-abc',
    promptHash: 'abc123def456',
    promptSnippet: 'book anna for haircut tomorrow',
    locale: 'en',
    surface: 'dashboard',
    classifiedAction: 'create_booking',
    correctedAction: 'list_bookings',
    confidence: 0.42,
    failureCount: 2,
    failureSignals: { suspected_miss: 1, thumbs_down: 1 },
    status: 'pending',
    expectedAction: null,
    expectedRescuedAction: 'list_bookings',
    expectedParams: { employeeName: 'Anna' },
    labelOutcome: 'execution',
    rescueFromAction: 'create_booking',
    expectedClarifyFields: null,
    evalCaseId: null,
    labeledBy: null,
    labeledAt: null,
    source: 'harvest',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as AiEvalLabelQueue;
}

describe('ai-eval-label.util (acc-2.2)', () => {
  it('buildEvalCaseFromLabelQueueItem maps rescued execution labels', () => {
    const evalCase = buildEvalCaseFromLabelQueueItem(buildQueueRow(), 'biz-abc');
    expect(evalCase).toMatchObject({
      id: 'harvest-biz-abc-abc123def456',
      corpus: 'harvested',
      expect: {
        rescuedAction: 'list_bookings',
        rescueFromAction: 'create_booking',
        paramsPartial: { employeeName: 'Anna' },
      },
    });
  });

  it('buildEvalCaseFromLabelQueueItem maps clarify-only labels', () => {
    const evalCase = buildEvalCaseFromLabelQueueItem(
      buildQueueRow({
        labelOutcome: 'clarify',
        expectedRescuedAction: null,
        expectedParams: null,
      }),
      'biz-abc',
    );
    expect(evalCase.difficulty).toBe('ambiguity');
    expect(evalCase.expect).toEqual({
      clarifyAction: 'create_booking',
      clarifyFields: undefined,
      classifiedParams: {},
      compoundExpectEmpty: true,
      compoundSurface: 'dashboard',
    });
  });

  it('appendEvalCaseToHarvestedCasesFile writes deduped cases when enabled', () => {
    const dir = mkdtempSync(join(tmpdir(), 'eval-label-'));
    const filePath = join(dir, 'ai-command-eval.harvested.cases.ts');
    writeFileSync(filePath, formatHarvestedCasesModule([]), 'utf8');

    const previous = process.env.AI_EVAL_FIXTURE_APPEND;
    process.env.AI_EVAL_FIXTURE_APPEND = '1';

    const evalCase = buildEvalCaseFromLabelQueueItem(buildQueueRow(), 'biz-abc');
    const first = appendEvalCaseToHarvestedCasesFile(evalCase, filePath);
    const second = appendEvalCaseToHarvestedCasesFile(evalCase, filePath);

    process.env.AI_EVAL_FIXTURE_APPEND = previous;

    expect(first.appended).toBe(true);
    expect(first.totalCases).toBe(1);
    expect(second.appended).toBe(false);
    expect(parseHarvestedCasesFromModule(readFileSync(filePath, 'utf8'))).toHaveLength(1);
  });
});
