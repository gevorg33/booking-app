import { rescueExplainPackageVisitRulesIntent } from './ai-explain-package-visit-rules.util.js';
import { EXPLAIN_PACKAGE_VISIT_RULES_PROMPTS } from './ai-explain-package-visit-rules.fixtures.js';
import { EXPLAIN_PACKAGE_VISIT_RULES_MULTILINGUAL_SCENARIOS } from './ai-explain-package-visit-rules-multilingual.fixtures.js';

describe('customer-ai-command explain_package_visit_rules integration (ai-cmd-customer-4.15.4)', () => {
  it.each(
    [
      ...EXPLAIN_PACKAGE_VISIT_RULES_PROMPTS,
      ...EXPLAIN_PACKAGE_VISIT_RULES_MULTILINGUAL_SCENARIOS,
    ].map((row) => [row.id, row.prompt] as const),
  )('rescues explain_package_visit_rules for $0', (_id, prompt) => {
    expect(
      rescueExplainPackageVisitRulesIntent(prompt, 'unknown')?.action,
    ).toBe('explain_package_visit_rules');
  });
});
