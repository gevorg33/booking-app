import { rescueExplainRtlLayoutIntent } from './ai-explain-rtl-layout.util.js';
import { EXPLAIN_RTL_LAYOUT_PROMPTS } from './ai-explain-rtl-layout.fixtures.js';

describe('customer-ai-command explain_rtl_layout integration (ai-cmd-customer-4.19.4)', () => {
  it.each(
    EXPLAIN_RTL_LAYOUT_PROMPTS.filter((row) => row.surface === 'customer'),
  )('rescues explain_rtl_layout for $id', (row) => {
    expect(rescueExplainRtlLayoutIntent(row.prompt, 'unknown')?.action).toBe(
      'explain_rtl_layout',
    );
  });
});
