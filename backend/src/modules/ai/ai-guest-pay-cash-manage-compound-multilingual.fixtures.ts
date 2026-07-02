import {
  GUEST_PAY_CASH_MANAGE_STEP_ACTIONS,
  type GuestPayCashManageCompoundFixture,
} from './ai-guest-pay-cash-manage-compound.fixtures.js';

export const GUEST_PAY_CASH_MANAGE_MULTILINGUAL_CLASSIFIER_RULES = `- guest_pay_cash_manage HY/RU: hy «ամրագրել guest-ով, վճարել այցի ժամանակ, email manage link»; ru «забронировать как гость, оплатить на месте, прислать ссылку управления». Compound guest book → pay cash → manage link.`;

export const GUEST_PAY_CASH_MANAGE_MULTILINGUAL_SCENARIOS: readonly (GuestPayCashManageCompoundFixture & {
  locale: 'hy' | 'ru';
})[] = [
  {
    id: 'hy-guest-cash-email-link',
    prompt: 'Ամրագրել guest-ով, վճարել այցի ժամանակ, email manage link',
    surface: 'customer',
    locale: 'hy',
    orderedActions: GUEST_PAY_CASH_MANAGE_STEP_ACTIONS,
    expectedParams: {
      guestCheckout: true,
      paymentMethod: 'cash',
      guestLookup: true,
      delivery: 'email',
    },
  },
  {
    id: 'hy-guest-venue-send-link',
    prompt:
      'Guest checkout և book — վճարել salon-ում և ուղարկել manage link email-ով',
    surface: 'customer',
    locale: 'hy',
    orderedActions: GUEST_PAY_CASH_MANAGE_STEP_ACTIONS,
    expectedParams: {
      guestCheckout: true,
      paymentMethod: 'cash',
      guestLookup: true,
      delivery: 'email',
    },
  },
  {
    id: 'ru-guest-pay-venue-email',
    prompt:
      'Забронировать как гость, оплатить на месте, прислать manage link на email',
    surface: 'customer',
    locale: 'ru',
    orderedActions: GUEST_PAY_CASH_MANAGE_STEP_ACTIONS,
    expectedParams: {
      guestCheckout: true,
      paymentMethod: 'cash',
      guestLookup: true,
      delivery: 'email',
    },
  },
  {
    id: 'ru-guest-cash-booking-link',
    prompt:
      'Записаться без аккаунта, оплатить наличными на визите, отправить booking link',
    surface: 'customer',
    locale: 'ru',
    orderedActions: GUEST_PAY_CASH_MANAGE_STEP_ACTIONS,
    expectedParams: {
      guestCheckout: true,
      paymentMethod: 'cash',
      guestLookup: true,
      delivery: 'email',
    },
  },
];
