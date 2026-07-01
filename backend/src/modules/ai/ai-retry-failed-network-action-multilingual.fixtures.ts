export type RetryFailedNetworkActionMultilingualScenario = {
  id: string;
  prompt: string;
  surface: 'customer';
  locale: 'hy' | 'ru';
  expectedAction: 'retry_failed_network_action';
  rescueReason: 'retry_failed_network_action';
};

export const RETRY_FAILED_NETWORK_ACTION_MULTILINGUAL_CLASSIFIER_RULES = `
  - retry_failed_network_action: hy «ամրագրումը չպահպանվեց — կրկին փորձե՞լ», «համաժամացումը ձախողվեց»; ru «запись не сохранилась — повторить», «синхронизация не удалась». Consumer network retry — NOT explain_offline_mode.`;

export const RETRY_FAILED_NETWORK_ACTION_MULTILINGUAL_SCENARIOS: readonly RetryFailedNetworkActionMultilingualScenario[] =
  [
    {
      id: 'hy-booking-not-saved-customer',
      prompt: 'Ամրագրումը չպահպանվեց — կրկին փորձե՞լ',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'retry_failed_network_action',
      rescueReason: 'retry_failed_network_action',
    },
    {
      id: 'hy-sync-failed-customer',
      prompt: 'Համաժամացումը ձախողվեց',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'retry_failed_network_action',
      rescueReason: 'retry_failed_network_action',
    },
    {
      id: 'hy-try-again-customer',
      prompt: 'Կրկին փորձել',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'retry_failed_network_action',
      rescueReason: 'retry_failed_network_action',
    },
    {
      id: 'ru-booking-not-saved-customer',
      prompt: 'Запись не сохранилась — повторить?',
      surface: 'customer',
      locale: 'ru',
      expectedAction: 'retry_failed_network_action',
      rescueReason: 'retry_failed_network_action',
    },
    {
      id: 'ru-sync-failed-customer',
      prompt: 'Синхронизация не удалась',
      surface: 'customer',
      locale: 'ru',
      expectedAction: 'retry_failed_network_action',
      rescueReason: 'retry_failed_network_action',
    },
    {
      id: 'ru-try-again-customer',
      prompt: 'Повторить',
      surface: 'customer',
      locale: 'ru',
      expectedAction: 'retry_failed_network_action',
      rescueReason: 'retry_failed_network_action',
    },
  ] as const;
