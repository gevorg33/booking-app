/**
 * e2e-bug.76 — question-phrased cancel/reschedule/locale prompts were stolen by
 * explain_why_sign_in (can i + my appointment / what + account).
 */
export const E2E76_SHOULD_NOT_BE_WHY_SIGN_IN = [
  {
    id: 'e2e76-can-i-cancel-appointment',
    prompt: 'can I cancel my appointment?',
    expectedAction: 'cancel_my_booking' as const,
  },
  {
    id: 'e2e76-is-it-possible-to-cancel',
    prompt: 'is it possible to cancel my booking?',
    expectedAction: 'cancel_my_booking' as const,
  },
  {
    id: 'e2e76-can-i-reschedule',
    prompt: 'can I reschedule my appointment?',
    expectedAction: 'reschedule_my_booking' as const,
  },
  {
    id: 'e2e76-what-language-account',
    prompt: 'what language is my account set to?',
    expectedAction: 'get_my_locale' as const,
  },
] as const;

/** Still true sign-in FAQ — must not regress. */
export const E2E76_STILL_WHY_SIGN_IN = [
  {
    id: 'e2e76-still-need-account',
    prompt: 'Do I need an account?',
  },
  {
    id: 'e2e76-still-past-without-sign-in',
    prompt: 'Can I see my past appointments without signing in?',
  },
] as const;
