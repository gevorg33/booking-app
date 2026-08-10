/**
 * e2e-bug.325 — provider `give_provider_ai_feedback` chip/summary labels must
 * localize under `locale:hy|ru`, mirroring the public/customer fix from
 * e2e-bug.299.
 */

export type E2e325ProviderFeedbackLocaleCase = {
  id: string;
  locale: 'hy' | 'ru';
  expectUpLabel: string;
  expectDownLabel: string;
  expectThanks: string;
  expectReasonWrongClient: string;
};

export const E2E325_PROVIDER_FEEDBACK_LOCALE_CASES: readonly E2e325ProviderFeedbackLocaleCase[] =
  [
    {
      id: 'e325-hy',
      locale: 'hy',
      expectUpLabel: 'Օգտակար',
      expectDownLabel: 'Օգտակար չէ',
      expectThanks:
        'Շնորհակալություն — սա օգնում է բարելավել մասնագետի օգնականին։',
      expectReasonWrongClient: 'Սխալ հաճախորդ',
    },
    {
      id: 'e325-ru',
      locale: 'ru',
      expectUpLabel: 'Полезно',
      expectDownLabel: 'Не полезно',
      expectThanks: 'Спасибо — это помогает улучшить ассистента провайдера.',
      expectReasonWrongClient: 'Неверный клиент',
    },
  ] as const;
