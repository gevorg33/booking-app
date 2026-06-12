import type { IntentCandidate } from './command-understanding.types.js';
import type { PipelineTrace } from './command-completion.types.js';

/** pipe-1.10.2 — semantic + pipeline stage on misroute telemetry. */
export const MISROUTE_TELEMETRY_PIPE_MARKER = 'pipe-1.10.2';

export const MISROUTE_SEMANTIC_FIXTURE_CANDIDATES: IntentCandidate[] = [
  {
    action: 'unknown',
    confidence: 0.2,
    source: 'classifier',
    reasoning: 'unclear',
  },
  {
    action: 'create_booking',
    confidence: 0.84,
    source: 'semantic_match',
    rescueReason: 'semantic_match',
    anchorId: 'book-haircut',
  },
  {
    action: 'create_booking',
    confidence: 0.9,
    source: 'rescue',
    rescueReason: 'nearest_slot',
  },
];

export const MISROUTE_PIPELINE_TRACE_FIXTURE: PipelineTrace[] = [
  {
    stage: 'classify',
    action: 'unknown',
    at: '2026-06-12T10:00:00.000Z',
  },
  {
    stage: 'semantic_match',
    action: 'create_booking',
    at: '2026-06-12T10:00:01.000Z',
    detail: 'anchor book-haircut',
  },
  {
    stage: 'rescue',
    action: 'book_nearest_slot',
    at: '2026-06-12T10:00:02.000Z',
    detail: 'nearest_slot',
  },
  {
    stage: 'structural_enrich',
    action: 'book_nearest_slot',
    at: '2026-06-12T10:00:03.000Z',
  },
];
