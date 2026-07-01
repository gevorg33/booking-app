import {
  CANCEL_PACKAGE_REBOOK_SINGLE_STEP_ACTIONS,
  type CancelPackageRebookSingleCompoundFixture,
} from './ai-cancel-package-rebook-single-compound.fixtures.js';

export const CANCEL_PACKAGE_REBOOK_SINGLE_MULTILINGUAL_CLASSIFIER_RULES = `- cancel_package_rebook_single HY/RU: hy «բաց թող package visit 2-ը, ամրագրել trim instead»; ru «пропустить визит 2 пакета, записаться на стрижку вместо». Compound cancel package visit → book single service.`;

export const CANCEL_PACKAGE_REBOOK_SINGLE_MULTILINGUAL_SCENARIOS: readonly (CancelPackageRebookSingleCompoundFixture & {
  locale: 'hy' | 'ru';
})[] = [
  {
    id: 'hy-skip-visit-trim',
    prompt: 'Բաց թող package visit 2-ը և ամրագրիր trim instead',
    surface: 'customer',
    locale: 'hy',
    orderedActions: CANCEL_PACKAGE_REBOOK_SINGLE_STEP_ACTIONS,
    expectedParams: {
      visitIndex: 2,
      serviceName: 'trim',
      cancelPackageRebookSingle: true,
    },
  },
  {
    id: 'hy-cancel-package-haircut',
    prompt: 'Չեղարկիր package visit-ը և ամրագրիր haircut instead',
    surface: 'customer',
    locale: 'hy',
    orderedActions: CANCEL_PACKAGE_REBOOK_SINGLE_STEP_ACTIONS,
    expectedParams: {
      serviceName: 'haircut',
      cancelPackageRebookSingle: true,
    },
  },
  {
    id: 'ru-skip-visit-trim',
    prompt: 'Пропусти визит 2 пакета и запишись на trim instead',
    surface: 'customer',
    locale: 'ru',
    orderedActions: CANCEL_PACKAGE_REBOOK_SINGLE_STEP_ACTIONS,
    expectedParams: {
      visitIndex: 2,
      serviceName: 'trim',
      cancelPackageRebookSingle: true,
    },
  },
  {
    id: 'ru-cancel-package-manicure',
    prompt: 'Отмени package visit и запишись на manicure instead',
    surface: 'customer',
    locale: 'ru',
    orderedActions: CANCEL_PACKAGE_REBOOK_SINGLE_STEP_ACTIONS,
    expectedParams: {
      serviceName: 'manicure',
      cancelPackageRebookSingle: true,
    },
  },
];
