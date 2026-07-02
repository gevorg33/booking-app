import type { ExplainPackageVisitRulesPromptFixture } from './ai-explain-package-visit-rules.fixtures.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ExplainPackageVisitRulesMultilingualScenario =
  ExplainPackageVisitRulesPromptFixture & {
    locale: AiEvalLocale;
  };

export const EXPLAIN_PACKAGE_VISIT_RULES_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian package visit rules (customer only):
  - explain_package_visit_rules: hy «կարո՞ղ եմ չեղարկել մեկ այցը և պահել փաթեթը», «չօգտագործված այցերը ժամկետանց են՞»; ru «можно ли отменить один визит и сохранить пакет», «сгорают ли неиспользованные визиты». READ bundle visit policy — NOT cancel_package_visit_self, NOT list_my_package_visits.`;

export const EXPLAIN_PACKAGE_VISIT_RULES_MULTILINGUAL_SCENARIOS: readonly ExplainPackageVisitRulesMultilingualScenario[] =
  [
    {
      id: 'cancel-one-visit-keep-package-hy',
      locale: 'hy',
      prompt: 'Կարո՞ղ եմ չեղարկել մեկ այցը և պահել փաթեթը',
      surface: 'customer',
      expectedAction: 'explain_package_visit_rules',
      rescueReason: 'package_visit_rules',
      focus: 'cancelKeepPackage',
    },
    {
      id: 'unused-visits-expire-hy',
      locale: 'hy',
      prompt: 'Չօգտագործված package visit-երը ժամկետանց են՞',
      surface: 'customer',
      expectedAction: 'explain_package_visit_rules',
      rescueReason: 'package_visit_rules',
      focus: 'expiration',
    },
    {
      id: 'cancel-one-visit-keep-package-ru',
      locale: 'ru',
      prompt: 'Можно ли отменить один визит и сохранить пакет?',
      surface: 'customer',
      expectedAction: 'explain_package_visit_rules',
      rescueReason: 'package_visit_rules',
      focus: 'cancelKeepPackage',
    },
    {
      id: 'unused-visits-expire-ru',
      locale: 'ru',
      prompt: 'Сгорают ли неиспользованные визиты пакета?',
      surface: 'customer',
      expectedAction: 'explain_package_visit_rules',
      rescueReason: 'package_visit_rules',
      focus: 'expiration',
    },
    {
      id: 'package-visit-rules-hy',
      locale: 'hy',
      prompt: 'Բացատրի՛ր package visit-ի կանոնները',
      surface: 'customer',
      expectedAction: 'explain_package_visit_rules',
      rescueReason: 'package_visit_rules',
      focus: 'general',
    },
    {
      id: 'package-visit-rules-ru',
      locale: 'ru',
      prompt: 'Объясни правила пакетных визитов',
      surface: 'customer',
      expectedAction: 'explain_package_visit_rules',
      rescueReason: 'package_visit_rules',
      focus: 'general',
    },
  ];
