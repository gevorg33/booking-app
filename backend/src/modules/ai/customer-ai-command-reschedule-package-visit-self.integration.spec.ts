import { rescueReschedulePackageVisitSelfIntent } from './ai-reschedule-package-visit-self.util.js';
import { RESCHEDULE_PACKAGE_VISIT_SELF_PROMPTS } from './ai-reschedule-package-visit-self.fixtures.js';
import { RESCHEDULE_PACKAGE_VISIT_SELF_MULTILINGUAL_SCENARIOS } from './ai-reschedule-package-visit-self-multilingual.fixtures.js';

describe('customer-ai-command reschedule_package_visit_self integration (ai-cmd-customer-4.15.3)', () => {
  it.each(
    [
      ...RESCHEDULE_PACKAGE_VISIT_SELF_PROMPTS,
      ...RESCHEDULE_PACKAGE_VISIT_SELF_MULTILINGUAL_SCENARIOS,
    ].map((row) => [row.id, row.prompt] as const),
  )('rescues reschedule_package_visit_self for $0', (_id, prompt) => {
    expect(
      rescueReschedulePackageVisitSelfIntent(prompt, 'unknown')?.action,
    ).toBe('reschedule_package_visit_self');
  });
});
