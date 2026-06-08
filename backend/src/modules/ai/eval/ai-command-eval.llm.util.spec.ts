import { AI_COMMAND_EVAL_LLM_CASES } from './ai-command-eval.cases.js';
import {
  buildLlmEvalClassifierMessages,
  inferLlmEvalSurface,
} from './ai-command-eval.llm-classifier.util.js';
import {
  evaluateLlmEvalCase,
  resolveLlmEvalCostBounds,
  runLlmEvalSuite,
} from './ai-command-eval.llm-runner.js';

describe('ai-command-eval.llm-classifier.util (acc-2.10)', () => {
  it.each(
    AI_COMMAND_EVAL_LLM_CASES.map((entry) => [entry.id, entry]),
  )('infers surface for %s', (_id, evalCase) => {
    const surface = inferLlmEvalSurface(evalCase);
    expect(['dashboard', 'customer', 'public', 'provider']).toContain(
      surface,
    );
  });

  it('builds dashboard classify messages for bulk cancel', () => {
    const evalCase = AI_COMMAND_EVAL_LLM_CASES.find(
      (entry) => entry.id === 'llm-en-bulk-cancel',
    )!;
    const built = buildLlmEvalClassifierMessages(evalCase);
    expect(built.surface).toBe('dashboard');
    expect(built.messages[0]?.content).toContain('cancel_bookings');
    expect(built.messages[1]?.content).toContain('Maria');
  });

  it('builds public classify messages for check+book prompt', () => {
    const evalCase = AI_COMMAND_EVAL_LLM_CASES.find(
      (entry) => entry.id === 'llm-en-public-check-book',
    )!;
    const built = buildLlmEvalClassifierMessages(evalCase);
    expect(built.surface).toBe('public');
    expect(built.messages[0]?.content).toContain('book_appointment');
  });
});

describe('ai-command-eval.llm-runner (acc-2.10)', () => {
  it('respects cost bounds from env overrides', () => {
    const previousCases = process.env.AI_EVAL_LLM_MAX_CASES;
    process.env.AI_EVAL_LLM_MAX_CASES = '2';
    expect(resolveLlmEvalCostBounds().maxCases).toBe(2);
    process.env.AI_EVAL_LLM_MAX_CASES = previousCases;
  });

  it('evaluates LLM cases with injected classify fn', async () => {
    const evalCase = AI_COMMAND_EVAL_LLM_CASES[0]!;
    const result = await evaluateLlmEvalCase(evalCase, {
      maxTokensPerCase: 200,
      classify: async () => ({
        action: evalCase.expect.action ?? null,
        raw: JSON.stringify({ action: evalCase.expect.action }),
        totalTokens: 120,
      }),
    });
    expect(result.passed).toBe(true);
    expect(result.actualAction).toBe(evalCase.expect.action);
  });

  it('runLlmEvalSuite tracks failures and token budget', async () => {
    const summary = await runLlmEvalSuite(AI_COMMAND_EVAL_LLM_CASES, {
      classify: async ({ messages }) => {
        const user = messages.find((entry) => entry.role === 'user')?.content ?? '';
        const match = AI_COMMAND_EVAL_LLM_CASES.find((entry) =>
          user.includes(entry.prompt.slice(0, 12)),
        );
        return {
          action: match?.expect.action ?? 'unknown',
          raw: JSON.stringify({ action: match?.expect.action ?? 'unknown' }),
          totalTokens: 5000,
        };
      },
      costBounds: {
        maxCases: 3,
        maxTotalTokens: 12_000,
        maxTokensPerCase: 500,
      },
    });

    expect(summary.results.length).toBe(3);
    expect(summary.totalTokensUsed).toBe(15_000);
    expect(summary.stoppedEarlyReason).toMatch(/token budget/i);
  });
});
