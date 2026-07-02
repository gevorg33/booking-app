import type { CancelPackageVisitSelfPromptFixture } from './ai-cancel-package-visit-self.fixtures.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type CancelPackageVisitSelfMultilingualScenario =
  CancelPackageVisitSelfPromptFixture & {
    locale: AiEvalLocale;
  };

export const CANCEL_PACKAGE_VISIT_SELF_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian cancel package visit (customer only):
  - cancel_package_visit_self: hy «Չեղարկել package visit-ը», «Չեղարկել իմ spa day package visit-ը»; ru «Отменить мой пакетный визит», «Отменить мой визит по spa day пакету». MUTATE one bundle visit — NOT cancel_my_booking, NOT cancel_package_visit (staff).`;

export const CANCEL_PACKAGE_VISIT_SELF_MULTILINGUAL_SCENARIOS: readonly CancelPackageVisitSelfMultilingualScenario[] =
  [
    {
      id: 'cancel-package-visit-hy',
      locale: 'hy',
      prompt: 'Չեղարկել իմ spa day package visit-ը',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
      packageName: 'Spa Day',
    },
    {
      id: 'cancel-package-visit-hy-2',
      locale: 'hy',
      prompt: 'Չեղարկել package visit-ը',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
    },
    {
      id: 'cancel-package-visit-ru',
      locale: 'ru',
      prompt: 'Отменить мой визит по spa day пакету',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
      packageName: 'Spa Day',
    },
    {
      id: 'cancel-package-visit-ru-2',
      locale: 'ru',
      prompt: 'Отменить мой пакетный визит',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
    },
    {
      id: 'skip-package-visit-hy',
      locale: 'hy',
      prompt: 'Բաց թողիր իմ հաջորդ package visit-ը',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
    },
    {
      id: 'skip-package-visit-ru',
      locale: 'ru',
      prompt: 'Пропустить следующий пакетный визит',
      surface: 'customer',
      expectedAction: 'cancel_package_visit_self',
      rescueReason: 'cancel_package_self',
    },
  ];
