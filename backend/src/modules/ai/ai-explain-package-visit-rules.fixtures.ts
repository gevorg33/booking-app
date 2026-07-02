export type ExplainPackageVisitRulesFocus =
  | 'cancelKeepPackage'
  | 'expiration'
  | 'rescheduleRules'
  | 'general';

export type ExplainPackageVisitRulesPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer';
  expectedAction: 'explain_package_visit_rules';
  rescueReason: 'package_visit_rules';
  packageName?: string;
  focus?: ExplainPackageVisitRulesFocus;
};

export const CUSTOMER_EXPLAIN_PACKAGE_VISIT_RULES_CLASSIFIER_RULES = `- explain_package_visit_rules: READ — logged-in customer asks how purchased package bundles work: cancel one visit without losing the package, unused visit expiry, reschedule rules, visit-block structure, catalog terms/description. Triggers: can I cancel one visit and keep the package, do unused visits expire, package visit rules/terms, what happens if I skip a package visit. Optional packageName. Uses catalog package description + expiresAt and salon self-service notice settings. NOT cancel_package_visit_self|reschedule_package_visit_self (mutate), NOT list_my_package_visits (show my remaining visits), NOT explain_cancel_policy (single-appointment salon policy), NOT explain_package_savings (price comparison), NOT discover_packages (browse catalog).`;

export const EXPLAIN_PACKAGE_VISIT_RULES_PROMPTS: readonly ExplainPackageVisitRulesPromptFixture[] =
  [
    {
      id: 'cancel-one-visit-keep-package-customer',
      prompt: 'Can I cancel one visit and keep the package?',
      surface: 'customer',
      expectedAction: 'explain_package_visit_rules',
      rescueReason: 'package_visit_rules',
      focus: 'cancelKeepPackage',
    },
    {
      id: 'unused-visits-expire-customer',
      prompt: 'Do unused visits expire?',
      surface: 'customer',
      expectedAction: 'explain_package_visit_rules',
      rescueReason: 'package_visit_rules',
      focus: 'expiration',
    },
    {
      id: 'package-visit-rules-customer',
      prompt: 'What are the package visit rules?',
      surface: 'customer',
      expectedAction: 'explain_package_visit_rules',
      rescueReason: 'package_visit_rules',
      focus: 'general',
    },
    {
      id: 'explain-package-visit-cancellation-customer',
      prompt: 'Explain package visit cancellation rules',
      surface: 'customer',
      expectedAction: 'explain_package_visit_rules',
      rescueReason: 'package_visit_rules',
      focus: 'cancelKeepPackage',
    },
    {
      id: 'skip-visit-lose-rest-customer',
      prompt: 'If I skip a package visit do I lose the rest?',
      surface: 'customer',
      expectedAction: 'explain_package_visit_rules',
      rescueReason: 'package_visit_rules',
      focus: 'cancelKeepPackage',
    },
    {
      id: 'reschedule-one-package-visit-customer',
      prompt: 'Can I reschedule just one visit in my package?',
      surface: 'customer',
      expectedAction: 'explain_package_visit_rules',
      rescueReason: 'package_visit_rules',
      focus: 'rescheduleRules',
    },
    {
      id: 'cancel-spa-day-visit-customer',
      prompt: 'What happens when I cancel a spa day visit?',
      surface: 'customer',
      expectedAction: 'explain_package_visit_rules',
      rescueReason: 'package_visit_rules',
      packageName: 'Spa Day',
      focus: 'cancelKeepPackage',
    },
    {
      id: 'package-visits-expiration-date-customer',
      prompt: 'Do package visits have an expiration date?',
      surface: 'customer',
      expectedAction: 'explain_package_visit_rules',
      rescueReason: 'package_visit_rules',
      focus: 'expiration',
    },
    {
      id: 'package-visit-terms-customer',
      prompt: 'Package visit terms and conditions',
      surface: 'customer',
      expectedAction: 'explain_package_visit_rules',
      rescueReason: 'package_visit_rules',
      focus: 'general',
    },
    {
      id: 'cancel-spa-day-keep-bundle-customer',
      prompt: 'Can I cancel one spa day and keep the bundle?',
      surface: 'customer',
      expectedAction: 'explain_package_visit_rules',
      rescueReason: 'package_visit_rules',
      packageName: 'Spa Day',
      focus: 'cancelKeepPackage',
    },
    {
      id: 'policy-for-package-visits-customer',
      prompt: 'What is the policy for package visits?',
      surface: 'customer',
      expectedAction: 'explain_package_visit_rules',
      rescueReason: 'package_visit_rules',
      focus: 'general',
    },
    {
      id: 'lose-package-cancel-one-customer',
      prompt: 'Do I lose my package if I cancel one visit?',
      surface: 'customer',
      expectedAction: 'explain_package_visit_rules',
      rescueReason: 'package_visit_rules',
      focus: 'cancelKeepPackage',
    },
  ];

export const EXPLAIN_PACKAGE_VISIT_RULES_RESCUE_SCENARIOS = [
  {
    id: 'cancel-mutate-to-package-rules',
    prompt: 'Can I cancel one visit and keep the package?',
    misclassifiedAction: 'cancel_package_visit_self',
    expectedAction: 'explain_package_visit_rules' as const,
  },
  {
    id: 'list-visits-to-expiry-rules',
    prompt: 'Do unused visits expire?',
    misclassifiedAction: 'list_my_package_visits',
    expectedAction: 'explain_package_visit_rules' as const,
  },
  {
    id: 'cancel-policy-to-package-rules',
    prompt: 'What is the policy for package visits?',
    misclassifiedAction: 'explain_cancel_policy',
    expectedAction: 'explain_package_visit_rules' as const,
  },
  {
    id: 'unknown-to-package-visit-rules',
    prompt: 'Package visit terms and conditions',
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_package_visit_rules' as const,
  },
] as const;
