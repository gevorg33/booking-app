import {
  RESULTS_THEN_REBOOK_COMPOUND_PROMPTS,
  RESULTS_THEN_REBOOK_NEGATIVE_PROMPTS,
  RESULTS_THEN_REBOOK_RESCUE_SCENARIOS,
} from './ai-results-then-rebook-compound.fixtures.js';
import { RESULTS_THEN_REBOOK_MULTILINGUAL_SCENARIOS } from './ai-results-then-rebook-compound-multilingual.fixtures.js';
import {
  buildResultsThenRebookCompoundParams,
  decomposeResultsThenRebookCompoundPrompt,
  isResultsThenRebookCompoundPrompt,
  rescueResultsThenRebookCompoundIntent,
} from './ai-results-then-rebook-compound.util.js';
import { isExplainResultStatusPrompt } from './ai-consumer-clinic-test-results.util.js';

describe('ai-results-then-rebook-compound.util (ai-cmd-customer-4.21.5)', () => {
  it.each(RESULTS_THEN_REBOOK_COMPOUND_PROMPTS)(
    'isResultsThenRebookCompoundPrompt customer $id',
    ({ prompt }) => {
      expect(isResultsThenRebookCompoundPrompt(prompt)).toBe(true);
    },
  );

  it.each(RESULTS_THEN_REBOOK_COMPOUND_PROMPTS)(
    'decomposeResultsThenRebookCompoundPrompt $id',
    ({ prompt, orderedActions, status, testName }) => {
      const steps = decomposeResultsThenRebookCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
      expect(steps).toHaveLength(2);
      expect(steps[0].params.resultsThenRebook).toBe(true);
      expect(steps[1].params.continueAfterResultExplain).toBe(true);
      if (status) {
        expect(steps[0].params.status).toBe(status);
      }
      if (testName) {
        expect(steps[0].params.testName).toBe(testName);
      }
    },
  );

  it.each(RESULTS_THEN_REBOOK_MULTILINGUAL_SCENARIOS)(
    'decomposeResultsThenRebookCompoundPrompt multilingual $id',
    ({ prompt, orderedActions }) => {
      const steps = decomposeResultsThenRebookCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
    },
  );

  it.each(RESULTS_THEN_REBOOK_RESCUE_SCENARIOS)(
    'rescueResultsThenRebookCompoundIntent $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueResultsThenRebookCompoundIntent(prompt, misclassifiedAction!),
      ).toEqual({
        action: 'compound_intent',
        rescueReason: 'results_then_rebook_compound',
      });
    },
  );

  it.each(RESULTS_THEN_REBOOK_NEGATIVE_PROMPTS)(
    'does not match negative prompt $id',
    ({ prompt }) => {
      expect(isResultsThenRebookCompoundPrompt(prompt)).toBe(false);
      expect(decomposeResultsThenRebookCompoundPrompt(prompt)).toEqual([]);
    },
  );

  it('explain-only prompt stays on explain_result_status', () => {
    const prompt = 'What does released mean for my lab results?';
    expect(isResultsThenRebookCompoundPrompt(prompt)).toBe(false);
    expect(isExplainResultStatusPrompt(prompt)).toBe(true);
  });

  it('buildResultsThenRebookCompoundParams extracts status and testName', () => {
    const params = buildResultsThenRebookCompoundParams(
      'My CBC results released; rebook last visit',
    );
    expect(params.status).toBe('Released');
    expect(params.testName).toBe('CBC');
    expect(params.resultsThenRebook).toBe(true);
  });

  it('rescueResultsThenRebookCompoundIntent returns null for non-compound', () => {
    expect(
      rescueResultsThenRebookCompoundIntent(
        'Rebook my last appointment',
        'rebook_last_appointment',
      ),
    ).toBeNull();
  });

  it('detects heuristic results follow-up without fixture id', () => {
    const prompt =
      'Lab results are ready — schedule follow-up like my last visit';
    expect(isResultsThenRebookCompoundPrompt(prompt)).toBe(true);
    const steps = decomposeResultsThenRebookCompoundPrompt(prompt);
    expect(steps.map((step) => step.action)).toEqual([
      'explain_result_status',
      'rebook_last_appointment',
    ]);
  });
});
