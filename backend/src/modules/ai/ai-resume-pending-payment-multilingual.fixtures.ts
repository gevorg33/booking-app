import type { AiEvalLocale } from './eval/ai-command-eval.types.js';

export type ResumePendingPaymentMultilingualScenario = {
  id: string;
  locale: AiEvalLocale;
  prompt: string;
  surface: 'customer';
  expectedAction: 'resume_pending_payment';
  rescueReason: 'resume_pending_payment';
};

export const RESUME_PENDING_PAYMENT_MULTILINGUAL_CLASSIFIER_RULES = `- Armenian/Russian resume pending payment (customer app only):
  - resume_pending_payment: hy «շարունակել վճարումը», «կիսատ checkout-ում փակեցի հավելվածը»; ru «продолжить оплату», «закрыл приложение на checkout». Device PendingCheckoutPayment — NOT pay_online.`;

export const RESUME_PENDING_PAYMENT_MULTILINGUAL_SCENARIOS: ResumePendingPaymentMultilingualScenario[] =
  [
    {
      id: 'continue-payment-hy',
      locale: 'hy',
      prompt: 'Շարունակել վճարումը',
      surface: 'customer',
      expectedAction: 'resume_pending_payment',
      rescueReason: 'resume_pending_payment',
    },
    {
      id: 'closed-app-hy',
      locale: 'hy',
      prompt: 'Կիսատ checkout-ում փակեցի հավելվածը',
      surface: 'customer',
      expectedAction: 'resume_pending_payment',
      rescueReason: 'resume_pending_payment',
    },
    {
      id: 'continue-payment-ru',
      locale: 'ru',
      prompt: 'Продолжить оплату',
      surface: 'customer',
      expectedAction: 'resume_pending_payment',
      rescueReason: 'resume_pending_payment',
    },
    {
      id: 'closed-app-ru',
      locale: 'ru',
      prompt: 'Закрыл приложение на checkout',
      surface: 'customer',
      expectedAction: 'resume_pending_payment',
      rescueReason: 'resume_pending_payment',
    },
    {
      id: 'restore-payment-hy',
      locale: 'hy',
      prompt: 'Վերականգնի՛ր կիսատ վճարումը',
      surface: 'customer',
      expectedAction: 'resume_pending_payment',
      rescueReason: 'resume_pending_payment',
    },
    {
      id: 'left-off-ru',
      locale: 'ru',
      prompt: 'Верни меня к оплате, которую я не закончил',
      surface: 'customer',
      expectedAction: 'resume_pending_payment',
      rescueReason: 'resume_pending_payment',
    },
  ];
