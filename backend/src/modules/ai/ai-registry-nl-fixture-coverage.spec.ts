import {
  auditRegistryNlFixtureCoverage,
  countRegistryNlFixtures,
  extractRegistryNlBindingsFromEvalCase,
  extractRegistryNlBindingsFromRow,
  formatRegistryNlFixtureCoverageReport,
  isNlPromptFixtureRow,
  listGatedRegistryNlFixtureViolations,
  listRegistryNlFixtureGaps,
  MIN_REGISTRY_NL_PROMPTS_PER_INTENT,
} from './ai-registry-nl-fixture-coverage.util.js';
import { REGISTRY_NL_FIXTURE_COVERAGE_GATED } from './ai-registry-nl-fixture-coverage.build.js';
import { AI_COMMAND_EVAL_DETERMINISTIC_CASES } from './eval/ai-command-eval.cases.js';

describe('ai-registry-nl-fixture-coverage.util (ai-cmd-ext-6.4)', () => {
  it('extracts intent bindings from fixture rows', () => {
    const bindings = extractRegistryNlBindingsFromRow({
      id: 'sample',
      prompt: 'mark booking paid',
      surface: 'dashboard',
      expectedAction: 'mark_paid',
    });
    expect(bindings).toEqual([{ intent: 'mark_paid', surface: 'dashboard' }]);
  });

  it('duplicates both-surface fixtures onto customer and public', () => {
    const bindings = extractRegistryNlBindingsFromRow({
      id: 'sample',
      prompt: 'list services under $50',
      surface: 'both',
      expectedAction: 'list_services',
    });
    expect(bindings).toEqual([
      { intent: 'list_services', surface: 'customer' },
      { intent: 'list_services', surface: 'public' },
    ]);
  });

  it('extracts eval-case bindings with explicit surface', () => {
    const bindings = extractRegistryNlBindingsFromEvalCase({
      id: 'eval-sample',
      prompt: 'book nearest slot tomorrow',
      surface: 'customer',
      expect: { action: 'book_nearest_slot' },
    });
    expect(bindings).toEqual([
      { intent: 'book_nearest_slot', surface: 'customer' },
    ]);
  });

  it('counts unique prompt ids per intent/surface', () => {
    const counts = countRegistryNlFixtures(
      [
        {
          id: 'eval-1',
          prompt: 'book nearest slot tomorrow',
          surface: 'customer',
          expect: { action: 'book_nearest_slot' },
        },
        {
          id: 'eval-2',
          prompt: 'grab the soonest opening tomorrow',
          surface: 'customer',
          expect: { action: 'book_nearest_slot' },
        },
      ],
      { includeFixtureModules: false },
    );

    expect(counts.get('customer:book_nearest_slot')).toBe(2);
  });

  it('ignores non-prompt fixture exports', () => {
    expect(
      isNlPromptFixtureRow({
        id: 'not-a-prompt',
        expectedAction: 'list_services',
      }),
    ).toBe(false);
  });
});

describe('registry NL fixture coverage report (ai-cmd-ext-6.4 / ai-cmd-ext-gap-5)', () => {
  it('audits every registry intent on all four surfaces', () => {
    const report = auditRegistryNlFixtureCoverage(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
    );

    expect(report.minimum).toBe(MIN_REGISTRY_NL_PROMPTS_PER_INTENT);
    expect(report.auditedIntentCount).toBeGreaterThan(400);
    expect(report.gapCount).toBeGreaterThan(0);
    expect(report.gapCount).toBeLessThan(report.auditedIntentCount);
    expect(report.rows.every((row) => row.intent.length > 0)).toBe(true);
  });

  it('lists registry intents missing the minimum NL fixture count', () => {
    const gaps = listRegistryNlFixtureGaps(AI_COMMAND_EVAL_DETERMINISTIC_CASES);
    expect(gaps.length).toBeGreaterThan(0);
    expect(
      gaps.every(
        (gap) => gap.count < MIN_REGISTRY_NL_PROMPTS_PER_INTENT && gap.deficit > 0,
      ),
    ).toBe(true);
  });

  it('prints a human-readable coverage report for gap triage', () => {
    const report = auditRegistryNlFixtureCoverage(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
    );
    const formatted = formatRegistryNlFixtureCoverageReport(report);

    // eslint-disable-next-line no-console -- intentional automation report output
    console.log(`\n${formatted}\n`);

    expect(formatted).toContain('Registry NL fixture coverage');
    expect(formatted).toContain('dashboard:');
    expect(formatted).toContain('customer:');
    expect(formatted).toContain(`below ${MIN_REGISTRY_NL_PROMPTS_PER_INTENT}`);
  });

  it('keeps major-domain gated intents at or above the minimum', () => {
    const violations = listGatedRegistryNlFixtureViolations(
      AI_COMMAND_EVAL_DETERMINISTIC_CASES,
      REGISTRY_NL_FIXTURE_COVERAGE_GATED,
    );
    expect(violations).toEqual([]);
  });
});
