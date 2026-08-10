/**
 * e2e-bug.403 — precedence, and why it is not a confidence boost.
 *
 * The rerank sorted on confidence alone. That works while every candidate's
 * number means the same thing, and stopped being true when the planner joined:
 * its confidence is an LLM self-report anchored by an example value in a prompt
 * template, the classifier's is a calibrated score, and on the `tour` slice both
 * land on 0.90–0.95.
 */
import {
  mergeAndRerankIntentCandidates,
  rerankIntentCandidates,
} from './intent-candidate-rerank.util.js';
import type { IntentCandidate } from './command-understanding.types.js';

const planner = (confidence: number, precedence?: number): IntentCandidate => ({
  action: 'list_tour_calendar_week',
  confidence,
  source: 'planner',
  ...(precedence === undefined ? {} : { precedence }),
});
const classifier = (confidence: number): IntentCandidate => ({
  action: 'list_upcoming_tour_departures',
  confidence,
  source: 'classifier',
});

describe('rerank precedence', () => {
  it('lets a lower-confidence planner route win in a retired domain', () => {
    // The measured case: planner 0.90 vs classifier 0.95, planner correct.
    const r = rerankIntentCandidates([planner(0.9, 1), classifier(0.95)]);
    expect(r?.winner.source).toBe('planner');
  });

  it('changes nothing without precedence — the planner still has to earn it', () => {
    // §90's rule outside retired domains: it competes, it is not privileged.
    const r = rerankIntentCandidates([planner(0.9), classifier(0.95)]);
    expect(r?.winner.source).toBe('classifier');
  });

  it('does not let precedence rescue a plan the planner did not make', () => {
    const r = rerankIntentCandidates([classifier(0.95)]);
    expect(r?.winner.source).toBe('classifier');
  });

  it('orders by confidence within the same precedence', () => {
    const r = rerankIntentCandidates([planner(0.7, 1), { ...planner(0.95, 1), action: 'other' }]);
    expect(r?.winner.action).toBe('other');
  });

  it('treats an absent precedence as zero, not as undefined ordering', () => {
    const r = rerankIntentCandidates([classifier(0.5), planner(0.4, 1)]);
    expect(r?.winner.source).toBe('planner');
  });

  it('keeps the merged result reporting every candidate', () => {
    const merged = mergeAndRerankIntentCandidates([planner(0.9, 1), classifier(0.95)]);
    expect(merged?.merged).toHaveLength(2);
    expect(merged?.winner.source).toBe('planner');
  });
});
