import { rescueCancelPackageVisitSelfIntent } from './ai-cancel-package-visit-self.util.js';
import { CANCEL_PACKAGE_VISIT_SELF_PROMPTS } from './ai-cancel-package-visit-self.fixtures.js';
import { CANCEL_PACKAGE_VISIT_SELF_MULTILINGUAL_SCENARIOS } from './ai-cancel-package-visit-self-multilingual.fixtures.js';

describe('customer-ai-command cancel_package_visit_self integration (ai-cmd-customer-4.15.2)', () => {
  it.each(
    [
      ...CANCEL_PACKAGE_VISIT_SELF_PROMPTS,
      ...CANCEL_PACKAGE_VISIT_SELF_MULTILINGUAL_SCENARIOS,
    ].map((row) => [row.id, row.prompt] as const),
  )('rescues cancel_package_visit_self for $0', (_id, prompt) => {
    expect(rescueCancelPackageVisitSelfIntent(prompt, 'unknown')?.action).toBe(
      'cancel_package_visit_self',
    );
  });
});
