import {
  CUSTOMER_EXPLAIN_PACKAGE_VISIT_RULES_CLASSIFIER_RULES,
  EXPLAIN_PACKAGE_VISIT_RULES_PROMPTS,
  EXPLAIN_PACKAGE_VISIT_RULES_RESCUE_SCENARIOS,
  assemblePackageVisitRulesSummary,
  buildPackageVisitCatalogTermsLines,
  buildPackageVisitRulesFocusLines,
  buildPackageVisitRulesSummaryFromCatalog,
  buildPackageVisitSelfServiceLines,
  buildPackageVisitStructureLine,
  detectExplainPackageVisitRulesFocus,
  enrichExplainPackageVisitRulesParamsFromPrompt,
  isExplainPackageVisitRulesIntent,
  isExplainPackageVisitRulesPrompt,
  isPackageVisitRulesQuestionPrompt,
  parseExplainPackageVisitRulesFromPrompt,
  rescueExplainPackageVisitRulesIntent,
} from './ai-explain-package-visit-rules.util.js';
import { EXPLAIN_PACKAGE_VISIT_RULES_MULTILINGUAL_SCENARIOS } from './ai-explain-package-visit-rules-multilingual.fixtures.js';
import { isCancelPackageVisitSelfPrompt } from './ai-cancel-package-visit-self.util.js';
import { isListMyPackageVisitsCustomerPrompt } from './ai-self-service-booking.util.js';
import { AI_COMMAND_EVAL_EXPLAIN_PACKAGE_VISIT_RULES_CASES } from './eval/ai-command-eval.cases.js';
import { evaluateDeterministicEvalCase } from './eval/ai-command-eval.runner.js';

describe('ai-explain-package-visit-rules.util (ai-cmd-customer-4.15.4)', () => {
  it('exports classifier rules for explain_package_visit_rules', () => {
    expect(CUSTOMER_EXPLAIN_PACKAGE_VISIT_RULES_CLASSIFIER_RULES).toContain(
      'explain_package_visit_rules',
    );
    expect(CUSTOMER_EXPLAIN_PACKAGE_VISIT_RULES_CLASSIFIER_RULES).toContain(
      'NOT cancel_package_visit_self',
    );
  });

  it.each(EXPLAIN_PACKAGE_VISIT_RULES_PROMPTS)(
    'detects explain_package_visit_rules for $id',
    ({ prompt, packageName, focus }) => {
      expect(isExplainPackageVisitRulesPrompt(prompt)).toBe(true);
      const parsed = parseExplainPackageVisitRulesFromPrompt(prompt);
      expect(parsed).not.toBeNull();
      if (packageName) expect(parsed?.packageName).toBe(packageName);
      if (focus) expect(parsed?.focus).toBe(focus);
    },
  );

  it.each(EXPLAIN_PACKAGE_VISIT_RULES_MULTILINGUAL_SCENARIOS)(
    'detects multilingual explain_package_visit_rules for $id',
    ({ prompt }) => {
      expect(isExplainPackageVisitRulesPrompt(prompt)).toBe(true);
    },
  );

  it.each(EXPLAIN_PACKAGE_VISIT_RULES_RESCUE_SCENARIOS)(
    'rescues misclassified action for $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueExplainPackageVisitRulesIntent(prompt, misclassifiedAction)
          ?.action,
      ).toBe(expectedAction);
    },
  );

  it('does not steal mutate cancel or list remaining visits prompts', () => {
    expect(
      isExplainPackageVisitRulesPrompt(
        'Can I cancel one visit and keep the package?',
      ),
    ).toBe(true);
    expect(
      isCancelPackageVisitSelfPrompt(
        'Can I cancel one visit and keep the package?',
      ),
    ).toBe(false);
    expect(isExplainPackageVisitRulesPrompt('Do unused visits expire?')).toBe(
      true,
    );
    expect(
      isListMyPackageVisitsCustomerPrompt('Do unused visits expire?'),
    ).toBe(false);
    expect(isCancelPackageVisitSelfPrompt('Cancel visit 2 of my package')).toBe(
      true,
    );
    expect(
      isExplainPackageVisitRulesPrompt('Cancel visit 2 of my package'),
    ).toBe(false);
  });

  it('detects heuristic focus and question phrasing', () => {
    expect(
      isPackageVisitRulesQuestionPrompt(
        'Explain cancel package visit policy for my bundle',
      ),
    ).toBe(true);
    expect(
      detectExplainPackageVisitRulesFocus('Do unused visits expire?'),
    ).toBe('expiration');
    expect(
      detectExplainPackageVisitRulesFocus(
        'Can I reschedule just one visit in my package?',
      ),
    ).toBe('rescheduleRules');
    expect(
      detectExplainPackageVisitRulesFocus(
        'Do I lose my package if I cancel one visit?',
      ),
    ).toBe('cancelKeepPackage');
    expect(
      isPackageVisitRulesQuestionPrompt(
        'What is the policy for package visits?',
      ),
    ).toBe(true);
  });

  it('builds catalog and policy summaries', () => {
    const pkg = {
      name: 'Spa Day',
      description: 'Use all visits within 12 months.',
      expiresAt: '2026-12-31T23:59:59.000Z',
      items: [
        { serviceName: 'Massage', quantity: 2 },
        { serviceName: 'Facial', quantity: 1 },
      ],
    };
    const barePkg = { name: 'Wellness Bundle', items: [] };
    expect(buildPackageVisitStructureLine(pkg)).toContain('3 visit block');
    expect(buildPackageVisitStructureLine(barePkg)).toContain(
      'bundles multiple',
    );
    expect(buildPackageVisitCatalogTermsLines(pkg)[0]).toContain('12 months');
    expect(
      buildPackageVisitCatalogTermsLines({ name: 'Open Bundle', items: [] })[0],
    ).toContain('no catalog expiration');
    expect(buildPackageVisitRulesFocusLines('expiration')[0]).toContain(
      'auto-expire',
    );
    expect(buildPackageVisitRulesFocusLines('rescheduleRules')[0]).toContain(
      'visit block',
    );
    expect(buildPackageVisitRulesFocusLines('general')[0]).toContain(
      'same-day blocks',
    );
    const settings = {
      allowCancel: false,
      allowReschedule: false,
      minimumNoticeHours: 24,
      maxReschedulesPerBooking: 2,
      allowProviderChangeOnReschedule: false,
    };
    expect(buildPackageVisitSelfServiceLines(settings)[0]).toContain(
      'disabled',
    );
    const settingsEnabled = {
      allowCancel: true,
      allowReschedule: true,
      minimumNoticeHours: 24,
      maxReschedulesPerBooking: 2,
      allowProviderChangeOnReschedule: false,
    };
    expect(buildPackageVisitSelfServiceLines(settingsEnabled)[0]).toContain(
      'Online cancellation',
    );
    const built = buildPackageVisitRulesSummaryFromCatalog(
      pkg,
      {
        publicBooking: {
          customerSelfService: settingsEnabled,
        },
      },
      'cancelKeepPackage',
    );
    expect(built.summary).toContain('without losing the rest');
    expect(
      assemblePackageVisitRulesSummary(
        built.catalogLines,
        built.selfServiceLines,
        built.policyLines,
      ),
    ).toBe(built.summary);
    expect(
      enrichExplainPackageVisitRulesParamsFromPrompt(
        {},
        'Can I cancel one spa day and keep the bundle?',
      ).packageName,
    ).toBe('Spa Day');
  });

  it('recognizes intent and eval cases', () => {
    expect(
      isExplainPackageVisitRulesIntent('explain_package_visit_rules'),
    ).toBe(true);
    expect(isExplainPackageVisitRulesIntent('explain_cancel_policy')).toBe(
      false,
    );
    expect(AI_COMMAND_EVAL_EXPLAIN_PACKAGE_VISIT_RULES_CASES.length).toBe(
      EXPLAIN_PACKAGE_VISIT_RULES_PROMPTS.length +
        EXPLAIN_PACKAGE_VISIT_RULES_MULTILINGUAL_SCENARIOS.length,
    );
    for (const evalCase of AI_COMMAND_EVAL_EXPLAIN_PACKAGE_VISIT_RULES_CASES) {
      expect(evaluateDeterministicEvalCase(evalCase).errors).toEqual([]);
    }
  });
});
