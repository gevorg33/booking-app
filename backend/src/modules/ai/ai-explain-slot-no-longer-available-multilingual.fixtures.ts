export type ExplainSlotNoLongerAvailableMultilingualScenario = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  locale: 'hy' | 'ru';
  expectedAction: 'explain_slot_no_longer_available';
  rescueReason: 'explain_slot_no_longer_available';
};

export const EXPLAIN_SLOT_NO_LONGER_AVAILABLE_MULTILINGUAL_CLASSIFIER_RULES = `
  - explain_slot_no_longer_available: hy «ժամանակը կորավ», «ինչ-որ մեկը վերցրեց իմ slot-ը»; ru «время пропало», «кто-то занял мой слот». Slot disappeared at checkout — NOT check_availability browse.`;

export const EXPLAIN_SLOT_NO_LONGER_AVAILABLE_MULTILINGUAL_SCENARIOS: readonly ExplainSlotNoLongerAvailableMultilingualScenario[] =
  [
    {
      id: 'hy-time-disappeared-customer',
      prompt: 'Ժամանակը կորավ',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'hy-someone-took-slot-customer',
      prompt: 'Ինչ-որ մեկը վերցրեց իմ slot-ը',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'hy-slot-gone-customer',
      prompt: 'Իմ ժամանակը այլևս հասանելի չէ',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'ru-time-disappeared-public',
      prompt: 'Время пропало',
      surface: 'public',
      locale: 'ru',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'ru-someone-took-slot-public',
      prompt: 'Кто-то занял мой слот',
      surface: 'public',
      locale: 'ru',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
    {
      id: 'ru-slot-gone-public',
      prompt: 'Моё время больше недоступно',
      surface: 'public',
      locale: 'ru',
      expectedAction: 'explain_slot_no_longer_available',
      rescueReason: 'explain_slot_no_longer_available',
    },
  ] as const;
