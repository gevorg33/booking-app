export type FixCheckoutValidationErrorMultilingualScenario = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  locale: 'hy' | 'ru';
  expectedAction: 'fix_checkout_validation_error';
  rescueReason: 'checkout_validation_error';
  paramsPartial?: { aspect: string };
};

export const FIX_CHECKOUT_VALIDATION_ERROR_MULTILINGUAL_CLASSIFIER_RULES = `
  - fix_checkout_validation_error: hy «ասում է գրիր էլ. փոստ բայց արդեն լրացրել եմ», «սխալ էլ. փոստ checkout-ում», «մուտք գործած եմ բայց contact details missing»; ru «уже ввел email но просит ввести», «ошибка email на checkout», «вошел но просит контактные данные». Validation troubleshooting — NOT explain_guest_checkout_fields proactive why.`;

export const FIX_CHECKOUT_VALIDATION_ERROR_MULTILINGUAL_SCENARIOS: readonly FixCheckoutValidationErrorMultilingualScenario[] =
  [
    {
      id: 'email-filled-hy-customer',
      prompt: 'Ասում է գրիր էլ. փոստ, բայց արդեն լրացրել եմ checkout-ում',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'fix_checkout_validation_error',
      rescueReason: 'checkout_validation_error',
      paramsPartial: { aspect: 'email' },
    },
    {
      id: 'invalid-email-hy-customer',
      prompt: 'Սխալ էլ. փոստ է ցույց տալիս գրանցման ձևում',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'fix_checkout_validation_error',
      rescueReason: 'checkout_validation_error',
      paramsPartial: { aspect: 'email' },
    },
    {
      id: 'profile-merge-hy-customer',
      prompt:
        'Մուտք եմ գործել, բայց checkout-ը դեռ contact details է պահանջում',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'fix_checkout_validation_error',
      rescueReason: 'checkout_validation_error',
      paramsPartial: { aspect: 'profile_merge' },
    },
    {
      id: 'email-filled-ru-public',
      prompt: 'Уже ввел email, но checkout просит ввести email снова',
      surface: 'public',
      locale: 'ru',
      expectedAction: 'fix_checkout_validation_error',
      rescueReason: 'checkout_validation_error',
      paramsPartial: { aspect: 'email' },
    },
    {
      id: 'invalid-email-ru-public',
      prompt: 'Ошибка email при подтверждении записи на checkout',
      surface: 'public',
      locale: 'ru',
      expectedAction: 'fix_checkout_validation_error',
      rescueReason: 'checkout_validation_error',
      paramsPartial: { aspect: 'email' },
    },
    {
      id: 'contact-or-ru-customer',
      prompt:
        'Ошибка валидации: введите email или телефон, хотя оба поля заполнены',
      surface: 'customer',
      locale: 'ru',
      expectedAction: 'fix_checkout_validation_error',
      rescueReason: 'checkout_validation_error',
      paramsPartial: { aspect: 'contact_or' },
    },
    {
      id: 'profile-merge-ru-customer',
      prompt:
        'Я вошел в аккаунт, но checkout все равно просит контактные данные',
      surface: 'customer',
      locale: 'ru',
      expectedAction: 'fix_checkout_validation_error',
      rescueReason: 'checkout_validation_error',
      paramsPartial: { aspect: 'profile_merge' },
    },
    {
      id: 'name-error-hy-public',
      prompt:
        'Checkout validation error — անունը լրացված է, բայց կրկին է պահանջում',
      surface: 'public',
      locale: 'hy',
      expectedAction: 'fix_checkout_validation_error',
      rescueReason: 'checkout_validation_error',
      paramsPartial: { aspect: 'name' },
    },
  ];
