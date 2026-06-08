#!/usr/bin/env node
/**
 * acc-2.10 — nightly LLM eval (cost-bounded). Skipped unless AI_EVAL_LLM=1.
 * Runs requiresLlm cases separately from deterministic CI gate.
 */
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

if (process.env.AI_EVAL_LLM !== '1') {
  console.log('Skipping LLM eval (set AI_EVAL_LLM=1 to run nightly suite).');
  process.exit(0);
}

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, '..');
process.chdir(backendRoot);

const apiKey =
  process.env.OPENAI_API_KEY?.trim() ||
  process.env.AI_EVAL_OPENAI_API_KEY?.trim();
if (!apiKey) {
  console.error(
    'LLM eval requires OPENAI_API_KEY or AI_EVAL_OPENAI_API_KEY when AI_EVAL_LLM=1.',
  );
  process.exit(1);
}

const OpenAI = require('openai').default;
const { AI_COMMAND_EVAL_LLM_CASES } = require(
  join(backendRoot, 'dist/modules/ai/eval/ai-command-eval.cases.js'),
);
const {
  assertLlmEvalDriftGate,
  buildLlmEvalReport,
  formatLlmEvalReport,
  loadLlmEvalBaseline,
} = require(
  join(backendRoot, 'dist/modules/ai/eval/ai-command-eval.llm-report.js'),
);

const baselinePath = join(
  backendRoot,
  'src/modules/ai/eval/ai-command-eval.llm-baseline.json',
);
const baseline = loadLlmEvalBaseline(baselinePath);
const model =
  process.env.AI_EVAL_LLM_MODEL?.trim() ||
  process.env.OPENAI_MODEL?.trim() ||
  'gpt-4o-mini';
const client = new OpenAI({ apiKey });

const classify = async ({ messages, maxTokens, temperature }) => {
  try {
    const response = await client.chat.completions.create({
      model,
      messages,
      response_format: { type: 'json_object' },
      temperature,
      max_tokens: maxTokens,
    });
    const raw = response.choices?.[0]?.message?.content ?? null;
    const usage = response.usage;
    return {
      action: null,
      raw,
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens,
      totalTokens: usage?.total_tokens,
    };
  } catch (error) {
    return {
      action: null,
      raw: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

const report = await buildLlmEvalReport(
  AI_COMMAND_EVAL_LLM_CASES,
  baseline,
  classify,
  process.env.AI_EVAL_TIMEZONE?.trim() || 'UTC',
);

console.log(formatLlmEvalReport(report));
console.log('');
console.log(
  JSON.stringify(
    {
      path: report.path,
      accuracy: report.accuracy,
      evaluatedCases: report.evaluatedCases,
      totalCases: report.totalCases,
      totalTokensUsed: report.totalTokensUsed,
      driftDetected: report.driftDetected,
      gatePassed: report.gatePassed,
      gateFailures: report.gateFailures,
      failedCaseIds: report.failedCaseIds,
      bySurface: report.bySurface,
    },
    null,
    2,
  ),
);

const webhook = process.env.AI_EVAL_LLM_ALERT_WEBHOOK?.trim();
if (webhook && report.driftDetected) {
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `AI LLM eval drift (acc-2.10): ${(report.accuracy * 100).toFixed(2)}% on ${report.evaluatedCases} cases. Failed: ${report.failedCaseIds.join(', ') || 'none'}.`,
        report,
      }),
    });
  } catch (error) {
    console.error(
      'Failed to POST drift alert webhook:',
      error instanceof Error ? error.message : String(error),
    );
  }
}

try {
  assertLlmEvalDriftGate(report);
  console.log('\nLLM DRIFT GATE (acc-2.10): PASS');
} catch (error) {
  console.error('\nLLM DRIFT GATE (acc-2.10): FAIL — drift alert');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
