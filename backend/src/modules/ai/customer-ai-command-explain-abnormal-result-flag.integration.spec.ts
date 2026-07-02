import { rescueExplainAbnormalResultFlagIntent } from './ai-explain-abnormal-result-flag.util.js';
import { EXPLAIN_ABNORMAL_RESULT_FLAG_PROMPTS } from './ai-explain-abnormal-result-flag.fixtures.js';
import { EXPLAIN_ABNORMAL_RESULT_FLAG_MULTILINGUAL_SCENARIOS } from './ai-explain-abnormal-result-flag-multilingual.fixtures.js';

describe('customer-ai-command explain_abnormal_result_flag integration (ai-cmd-customer-4.14.6)', () => {
  it.each(
    [
      ...EXPLAIN_ABNORMAL_RESULT_FLAG_PROMPTS,
      ...EXPLAIN_ABNORMAL_RESULT_FLAG_MULTILINGUAL_SCENARIOS,
    ].map((row) => [row.id, row.prompt] as const),
  )('rescues explain_abnormal_result_flag for $0', (_id, prompt) => {
    expect(
      rescueExplainAbnormalResultFlagIntent(prompt, 'unknown')?.action,
    ).toBe('explain_abnormal_result_flag');
  });
});
