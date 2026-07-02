import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type FindServicesUnderBudgetMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'find_services_under_budget';
  expectedParams?: Record<string, unknown>;
  rescueReason: 'budget_discover_chip';
};

export const FIND_SERVICES_UNDER_BUDGET_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian budget discover chip (customer + public booking):
  - find_services_under_budget: hy «$50-ից ցած ծառայություններ», «Ինչ կարող եմ $50-ից ցած»; ru «Услуги до $50», «Что можно до 50 долларов». READ budget ceiling catalog browse — NOT list_services general menu, NOT recommend_specialists.`;

export const FIND_SERVICES_UNDER_BUDGET_MULTILINGUAL_SCENARIOS: readonly FindServicesUnderBudgetMultilingualScenario[] =
  [
    {
      id: 'under-50-hy-customer',
      locale: 'hy',
      prompt: 'Ինչ կարող եմ $50-ից ցած',
      surface: 'customer',
      expectedAction: 'find_services_under_budget',
      expectedParams: { maxPrice: 50 },
      rescueReason: 'budget_discover_chip',
    },
    {
      id: 'under-50-hy-public',
      locale: 'hy',
      prompt: 'Ինչ կարող եմ $50-ից ցած',
      surface: 'public',
      expectedAction: 'find_services_under_budget',
      expectedParams: { maxPrice: 50 },
      rescueReason: 'budget_discover_chip',
    },
    {
      id: 'services-under-50-ru-customer',
      locale: 'ru',
      prompt: 'Услуги до $50',
      surface: 'customer',
      expectedAction: 'find_services_under_budget',
      expectedParams: { maxPrice: 50 },
      rescueReason: 'budget_discover_chip',
    },
    {
      id: 'services-under-50-ru-public',
      locale: 'ru',
      prompt: 'Услуги до $50',
      surface: 'public',
      expectedAction: 'find_services_under_budget',
      expectedParams: { maxPrice: 50 },
      rescueReason: 'budget_discover_chip',
    },
    {
      id: 'anything-under-50-ru-customer',
      locale: 'ru',
      prompt: 'Что можно до 50 долларов?',
      surface: 'customer',
      expectedAction: 'find_services_under_budget',
      expectedParams: { maxPrice: 50 },
      rescueReason: 'budget_discover_chip',
    },
    {
      id: 'anything-under-50-ru-public',
      locale: 'ru',
      prompt: 'Что можно до 50 долларов?',
      surface: 'public',
      expectedAction: 'find_services_under_budget',
      expectedParams: { maxPrice: 50 },
      rescueReason: 'budget_discover_chip',
    },
  ];
