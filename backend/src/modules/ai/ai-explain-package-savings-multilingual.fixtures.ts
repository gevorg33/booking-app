import type { ExplainPackageSavingsPromptFixture } from './ai-explain-package-savings.fixtures.js';

export const EXPLAIN_PACKAGE_SAVINGS_MULTILINGUAL_CLASSIFIER_RULES = `- explain_package_savings HY/RU: hy «փաթեթը ավելի էժան է առանձին ամրագրելուց», «spa day փաթեթի խնայողություն»; ru «пакет дешевле отдельных услуг», «сколько экономии в spa day пакете».`;

export const EXPLAIN_PACKAGE_SAVINGS_MULTILINGUAL_SCENARIOS: readonly (ExplainPackageSavingsPromptFixture & {
  locale: 'hy' | 'ru';
})[] = [
  {
    id: 'package-savings-hy-public',
    locale: 'hy',
    prompt: 'Փաթեթը ավելի էժան է առանձին ամրագրելուց',
    surface: 'public',
    expectedAction: 'explain_package_savings',
    rescueReason: 'package_savings',
  },
  {
    id: 'spa-day-savings-hy-customer',
    locale: 'hy',
    prompt: 'Spa day փաթեթի խնայողությունը',
    surface: 'customer',
    expectedAction: 'explain_package_savings',
    rescueReason: 'package_savings',
    packageName: 'Spa Day',
  },
  {
    id: 'package-cheaper-ru-public',
    locale: 'ru',
    prompt: 'Пакет дешевле отдельных услуг?',
    surface: 'public',
    expectedAction: 'explain_package_savings',
    rescueReason: 'package_savings',
  },
  {
    id: 'spa-day-savings-ru-customer',
    locale: 'ru',
    prompt: 'Сколько экономии в spa day пакете',
    surface: 'customer',
    expectedAction: 'explain_package_savings',
    rescueReason: 'package_savings',
    packageName: 'Spa Day',
  },
  {
    id: 'bundle-worth-ru-public',
    locale: 'ru',
    prompt: 'Выгоднее ли купить пакет spa day отдельно',
    surface: 'public',
    expectedAction: 'explain_package_savings',
    rescueReason: 'package_savings',
    packageName: 'Spa Day',
  },
  {
    id: 'package-deal-hy-customer',
    locale: 'hy',
    prompt: 'Wellness package-ի զեղչը առանձին գնի համեմատ',
    surface: 'customer',
    expectedAction: 'explain_package_savings',
    rescueReason: 'package_savings',
    packageName: 'wellness package',
  },
];
