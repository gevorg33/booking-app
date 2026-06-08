import type { AiCommandEvalCase } from './ai-command-eval.types.js';
import type { AiEvalCaseResult } from './ai-command-eval.types.js';
import { buildLlmEvalClassifierMessages } from './ai-command-eval.llm-classifier.util.js';

export interface LlmClassifyRequest {
  surface: string;
  messages: Array<{ role: 'system' | 'user'; content: string }>;
  maxTokens: number;
  temperature: number;
}

export interface LlmClassifyResponse {
  action: string | null;
  raw: string | null;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  error?: string;
}

export type LlmClassifyFn = (
  request: LlmClassifyRequest,
) => Promise<LlmClassifyResponse>;

export interface LlmEvalCostBounds {
  maxCases: number;
  maxTokensPerCase: number;
  maxTotalTokens: number;
}

export interface LlmEvalRunOptions {
  timeZone?: string;
  classify: LlmClassifyFn;
  costBounds?: Partial<LlmEvalCostBounds>;
}

export interface LlmEvalCaseDetail extends AiEvalCaseResult {
  surface: string;
  expectedAction?: string;
  actualAction?: string | null;
  tokensUsed?: number;
}

export interface LlmEvalRunSummary {
  passed: number;
  failed: number;
  skipped: number;
  results: LlmEvalCaseDetail[];
  totalTokensUsed: number;
  stoppedEarlyReason?: string;
}

export const DEFAULT_LLM_EVAL_COST_BOUNDS: LlmEvalCostBounds = {
  maxCases: 14,
  maxTokensPerCase: 650,
  maxTotalTokens: 20_000,
};

export function resolveLlmEvalCostBounds(
  overrides: Partial<LlmEvalCostBounds> = {},
): LlmEvalCostBounds {
  return {
    maxCases: parseBoundedInt(
      process.env.AI_EVAL_LLM_MAX_CASES,
      overrides.maxCases ?? DEFAULT_LLM_EVAL_COST_BOUNDS.maxCases,
    ),
    maxTokensPerCase: parseBoundedInt(
      process.env.AI_EVAL_LLM_MAX_TOKENS_PER_CASE,
      overrides.maxTokensPerCase ??
        DEFAULT_LLM_EVAL_COST_BOUNDS.maxTokensPerCase,
    ),
    maxTotalTokens: parseBoundedInt(
      process.env.AI_EVAL_LLM_MAX_TOTAL_TOKENS,
      overrides.maxTotalTokens ?? DEFAULT_LLM_EVAL_COST_BOUNDS.maxTotalTokens,
    ),
  };
}

function parseBoundedInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseClassifiedAction(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { action?: string };
    return parsed.action ?? null;
  } catch {
    return null;
  }
}

/** Evaluate one requiresLlm case via live classify_intent. */
export async function evaluateLlmEvalCase(
  evalCase: AiCommandEvalCase,
  options: LlmEvalRunOptions & { maxTokensPerCase: number },
): Promise<LlmEvalCaseDetail> {
  const errors: string[] = [];
  const expectedAction = evalCase.expect.action;
  const { surface, messages } = buildLlmEvalClassifierMessages(evalCase, {
    timeZone: options.timeZone,
  });

  const response = await options.classify({
    surface,
    messages,
    maxTokens: options.maxTokensPerCase,
    temperature: surface === 'dashboard' ? 0.1 : surface === 'customer' ? 0.1 : 0.2,
  });

  const actualAction = parseClassifiedAction(response.raw);
  if (response.error) {
    errors.push(`classify error: ${response.error}`);
  }
  if (!actualAction) {
    errors.push('classify returned no action');
  } else if (expectedAction && actualAction !== expectedAction) {
    errors.push(
      `action: expected ${expectedAction}, got ${actualAction}`,
    );
  }

  return {
    id: evalCase.id,
    passed: errors.length === 0,
    errors,
    surface,
    expectedAction,
    actualAction,
    tokensUsed: response.totalTokens,
  };
}

/** Run all requiresLlm cases with cost bounds (acc-2.10). */
export async function runLlmEvalSuite(
  cases: AiCommandEvalCase[],
  options: LlmEvalRunOptions,
): Promise<LlmEvalRunSummary> {
  const bounds = resolveLlmEvalCostBounds(options.costBounds);
  const llmCases = cases.filter((entry) => entry.requiresLlm);
  const selectedCases = llmCases.slice(0, bounds.maxCases);
  const results: LlmEvalCaseDetail[] = [];
  let totalTokensUsed = 0;
  let stoppedEarlyReason: string | undefined;

  for (const evalCase of selectedCases) {
    if (totalTokensUsed >= bounds.maxTotalTokens) {
      stoppedEarlyReason = `total token budget ${bounds.maxTotalTokens} exhausted`;
      break;
    }

    const result = await evaluateLlmEvalCase(evalCase, {
      ...options,
      maxTokensPerCase: bounds.maxTokensPerCase,
    });
    results.push(result);
    totalTokensUsed += result.tokensUsed ?? 0;

    if (totalTokensUsed >= bounds.maxTotalTokens) {
      stoppedEarlyReason = `total token budget ${bounds.maxTotalTokens} reached after ${evalCase.id}`;
    }
  }

  const skipped =
    llmCases.length -
    selectedCases.length +
    (stoppedEarlyReason ? selectedCases.length - results.length : 0);
  const failed = results.filter((entry) => !entry.passed).length;

  return {
    passed: results.length - failed,
    failed,
    skipped,
    results,
    totalTokensUsed,
    stoppedEarlyReason,
  };
}
