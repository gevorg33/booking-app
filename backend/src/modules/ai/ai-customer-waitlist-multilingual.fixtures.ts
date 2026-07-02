import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type CustomerWaitlistMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'join_waitlist' | 'check_waitlist_status';
  rescueReason: 'join_waitlist' | 'check_waitlist_status';
  serviceName?: string;
};

export const CUSTOMER_WAITLIST_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian customer waitlist (customer + public booking):
  - join_waitlist: hy «տեղեկացրեք եթե բացվի», «միացրեք սպասման ցուցակին»; ru «уведомьте если освободится», «запишите в лист ожидания». Customer self join — NOT offer_waitlist_slot (staff).
  - check_waitlist_status: hy «սպասման ցուցակում եմ՞», «սպասման ցուցակի կարգավիճակ»; ru «я в листе ожидания?», «статус листа ожидания». Customer self status — NOT list_waitlist_entries (staff).`;

export const CUSTOMER_WAITLIST_MULTILINGUAL_SCENARIOS: readonly CustomerWaitlistMultilingualScenario[] =
  [
    {
      id: 'notify-opens-hy-customer',
      locale: 'hy',
      prompt: 'Տեղեկացրեք եթե բացվի ուրբաթ',
      surface: 'customer',
      expectedAction: 'join_waitlist',
      rescueReason: 'join_waitlist',
    },
    {
      id: 'join-waitlist-hy-customer',
      locale: 'hy',
      prompt: 'Միացրեք սպասման ցուցակին massage-ի համար',
      surface: 'customer',
      expectedAction: 'join_waitlist',
      rescueReason: 'join_waitlist',
      serviceName: 'massage',
    },
    {
      id: 'waitlist-status-hy-customer',
      locale: 'hy',
      prompt: 'Սպասման ցուցակում եմ՞',
      surface: 'customer',
      expectedAction: 'check_waitlist_status',
      rescueReason: 'check_waitlist_status',
    },
    {
      id: 'notify-opens-ru-public',
      locale: 'ru',
      prompt: 'Уведомьте если освободится слот в пятницу',
      surface: 'public',
      expectedAction: 'join_waitlist',
      rescueReason: 'join_waitlist',
    },
    {
      id: 'join-waitlist-ru-public',
      locale: 'ru',
      prompt: 'Запишите меня в лист ожидания на массаж',
      surface: 'public',
      expectedAction: 'join_waitlist',
      rescueReason: 'join_waitlist',
      serviceName: 'massage',
    },
    {
      id: 'waitlist-status-ru-public',
      locale: 'ru',
      prompt: 'Я в листе ожидания?',
      surface: 'public',
      expectedAction: 'check_waitlist_status',
      rescueReason: 'check_waitlist_status',
    },
  ];
