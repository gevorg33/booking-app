export type ResumeBookingDraftMultilingualScenario = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  locale: 'hy' | 'ru';
  expectedAction: 'resume_booking_draft';
  rescueReason: 'resume_booking_draft';
};

export const RESUME_BOOKING_DRAFT_MULTILINGUAL_CLASSIFIER_RULES = `
  - resume_booking_draft: hy «շարունակել որտեղ կանգնեցի», «վերականգնել կիսատ ամրագրումը»; ru «продолжить с того места», «восстановить незавершённую запись». Device BookingDraft — NOT resume_pending_payment (оплата/checkout).`;

export const RESUME_BOOKING_DRAFT_MULTILINGUAL_SCENARIOS: readonly ResumeBookingDraftMultilingualScenario[] =
  [
    {
      id: 'hy-continue-where-left-off-customer',
      prompt: 'Շարունակել որտեղ կանգնեցի',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'hy-restore-half-booking-customer',
      prompt: 'Վերականգնել կիսատ ամրագրումը',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'hy-continue-unfinished-customer',
      prompt: 'Շարունակել իմ չավարտված ամրագրումը',
      surface: 'customer',
      locale: 'hy',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'ru-continue-where-left-off-public',
      prompt: 'Продолжить с того места, где остановился',
      surface: 'public',
      locale: 'ru',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'ru-restore-half-booking-public',
      prompt: 'Восстановить незавершённую запись',
      surface: 'public',
      locale: 'ru',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
    {
      id: 'ru-continue-unfinished-public',
      prompt: 'Продолжить мою незаконченную запись',
      surface: 'public',
      locale: 'ru',
      expectedAction: 'resume_booking_draft',
      rescueReason: 'resume_booking_draft',
    },
  ] as const;
