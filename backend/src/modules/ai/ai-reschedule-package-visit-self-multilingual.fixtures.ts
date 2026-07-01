import type { ReschedulePackageVisitSelfPromptFixture } from './ai-reschedule-package-visit-self.fixtures.js';
import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ReschedulePackageVisitSelfMultilingualScenario =
  ReschedulePackageVisitSelfPromptFixture & {
    locale: AiEvalLocale;
  };

export const RESCHEDULE_PACKAGE_VISIT_SELF_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian reschedule package visit (customer only):
  - reschedule_package_visit_self: hy «Վերամրագրել իմ spa day package visit-ը», «Փոխել package visit-ի ժամը»; ru «Перенести мой spa day визит», «Перенести мой пакетный визит». MUTATE one bundle visit block — NOT reschedule_my_booking, NOT reschedule_package_visit (staff).`;

export const RESCHEDULE_PACKAGE_VISIT_SELF_MULTILINGUAL_SCENARIOS: readonly ReschedulePackageVisitSelfMultilingualScenario[] =
  [
    {
      id: 'reschedule-package-visit-hy',
      locale: 'hy',
      prompt: 'Վերամրագրել իմ spa day package visit-ը',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
      packageName: 'Spa Day',
    },
    {
      id: 'reschedule-package-visit-hy-2',
      locale: 'hy',
      prompt: 'Փոխել package visit-ի ժամը',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
    },
    {
      id: 'reschedule-package-visit-ru',
      locale: 'ru',
      prompt: 'Перенести мой spa day визит',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
      packageName: 'Spa Day',
    },
    {
      id: 'reschedule-package-visit-ru-2',
      locale: 'ru',
      prompt: 'Перенести мой пакетный визит',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
    },
    {
      id: 'move-package-visit-hy',
      locale: 'hy',
      prompt: 'Տեղափոխիր իմ package visit-ը հաջորդ շաբաթ',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
    },
    {
      id: 'move-package-visit-ru',
      locale: 'ru',
      prompt: 'Перенести пакетный визит 3 на следующую неделю',
      surface: 'customer',
      expectedAction: 'reschedule_package_visit_self',
      rescueReason: 'reschedule_package_self',
      visitIndex: 3,
    },
  ];
