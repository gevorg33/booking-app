export type GiveAiFeedbackAspect =
  | 'negative'
  | 'positive'
  | 'reason_given'
  | 'generic';

export type GiveAiFeedbackRating = 'up' | 'down';

export type GiveAiFeedbackReason =
  | 'wrong_action'
  | 'wrong_date'
  | 'wrong_person'
  | 'wrong_service'
  | 'did_not_understand';

export type GiveAiFeedbackPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'give_ai_feedback';
  rescueReason: 'give_ai_feedback';
  aspect?: GiveAiFeedbackAspect;
  rating?: GiveAiFeedbackRating;
  reason?: GiveAiFeedbackReason;
};

export const CUSTOMER_PUBLIC_GIVE_AI_FEEDBACK_CLASSIFIER_RULES = `- give_ai_feedback: MUTATE — customer app or public booking web: thumbs up/down on the last assistant answer with optional reason chips (Wrong action, Wrong date, Wrong person, Wrong service, Didn't understand). Triggers: "That was wrong", "Wrong date picked", "Not helpful", "That was helpful". Uses feedbackRating (up|down) and feedbackReason from session when present. NOT speak_assistant_reply (read aloud), NOT explain_voice_input (mic help), NOT contact_support (human support ticket), NOT booking_help (general funnel).`;

export const GIVE_AI_FEEDBACK_PROMPTS: readonly GiveAiFeedbackPromptFixture[] =
  [
    {
      id: 'that-was-wrong-customer',
      prompt: 'That was wrong',
      surface: 'customer',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'negative',
      rating: 'down',
    },
    {
      id: 'wrong-date-picked-customer',
      prompt: 'Wrong date picked',
      surface: 'customer',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'reason_given',
      rating: 'down',
      reason: 'wrong_date',
    },
    {
      id: 'wrong-service-customer',
      prompt: 'Wrong service',
      surface: 'customer',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'reason_given',
      rating: 'down',
      reason: 'wrong_service',
    },
    {
      id: 'wrong-person-customer',
      prompt: 'Wrong person picked',
      surface: 'customer',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'reason_given',
      rating: 'down',
      reason: 'wrong_person',
    },
    {
      id: 'wrong-action-customer',
      prompt: 'Wrong action',
      surface: 'customer',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'reason_given',
      rating: 'down',
      reason: 'wrong_action',
    },
    {
      id: 'did-not-understand-customer',
      prompt: "You didn't understand me",
      surface: 'customer',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'reason_given',
      rating: 'down',
      reason: 'did_not_understand',
    },
    {
      id: 'not-helpful-customer',
      prompt: 'Not helpful',
      surface: 'customer',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'negative',
      rating: 'down',
    },
    {
      id: 'bad-answer-customer',
      prompt: 'Bad answer',
      surface: 'customer',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'negative',
      rating: 'down',
    },
    {
      id: 'that-was-helpful-customer',
      prompt: 'That was helpful',
      surface: 'customer',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'positive',
      rating: 'up',
    },
    {
      id: 'good-answer-customer',
      prompt: 'Good answer',
      surface: 'customer',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'positive',
      rating: 'up',
    },
    {
      id: 'wrong-stylist-customer',
      prompt: 'You picked the wrong stylist',
      surface: 'customer',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'reason_given',
      rating: 'down',
      reason: 'wrong_person',
    },
    {
      id: 'incorrect-booking-customer',
      prompt: 'That booking answer was incorrect',
      surface: 'customer',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'negative',
      rating: 'down',
    },
    {
      id: 'that-was-wrong-public',
      prompt: 'That was wrong',
      surface: 'public',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'negative',
      rating: 'down',
    },
    {
      id: 'wrong-date-picked-public',
      prompt: 'Wrong date picked',
      surface: 'public',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'reason_given',
      rating: 'down',
      reason: 'wrong_date',
    },
    {
      id: 'wrong-service-public',
      prompt: 'Wrong service',
      surface: 'public',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'reason_given',
      rating: 'down',
      reason: 'wrong_service',
    },
    {
      id: 'wrong-person-public',
      prompt: 'Wrong person picked',
      surface: 'public',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'reason_given',
      rating: 'down',
      reason: 'wrong_person',
    },
    {
      id: 'wrong-action-public',
      prompt: 'Wrong action',
      surface: 'public',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'reason_given',
      rating: 'down',
      reason: 'wrong_action',
    },
    {
      id: 'did-not-understand-public',
      prompt: "You didn't understand me",
      surface: 'public',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'reason_given',
      rating: 'down',
      reason: 'did_not_understand',
    },
    {
      id: 'not-helpful-public',
      prompt: 'Not helpful',
      surface: 'public',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'negative',
      rating: 'down',
    },
    {
      id: 'bad-answer-public',
      prompt: 'Bad answer',
      surface: 'public',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'negative',
      rating: 'down',
    },
    {
      id: 'that-was-helpful-public',
      prompt: 'That was helpful',
      surface: 'public',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'positive',
      rating: 'up',
    },
    {
      id: 'good-answer-public',
      prompt: 'Good answer',
      surface: 'public',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'positive',
      rating: 'up',
    },
    {
      id: 'wrong-stylist-public',
      prompt: 'You picked the wrong stylist',
      surface: 'public',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'reason_given',
      rating: 'down',
      reason: 'wrong_person',
    },
    {
      id: 'incorrect-booking-public',
      prompt: 'That booking answer was incorrect',
      surface: 'public',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'negative',
      rating: 'down',
    },
    // e2e-bug.293 — chip-label synonyms
    {
      id: 'thumbs-up-public',
      prompt: 'Thumbs up',
      surface: 'public',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'positive',
      rating: 'up',
    },
    {
      id: 'thumbs-down-public',
      prompt: 'Thumbs down',
      surface: 'public',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'negative',
      rating: 'down',
    },
    {
      id: 'thumbs-up-customer',
      prompt: 'Thumbs up',
      surface: 'customer',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'positive',
      rating: 'up',
    },
    {
      id: 'thumbs-down-customer',
      prompt: 'Thumbs down',
      surface: 'customer',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'negative',
      rating: 'down',
    },
    // e2e-bug.300 — shorthand +1 / -1
    {
      id: 'plus-one-public',
      prompt: '+1',
      surface: 'public',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'positive',
      rating: 'up',
    },
    {
      id: 'minus-one-public',
      prompt: '-1',
      surface: 'public',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'negative',
      rating: 'down',
    },
    {
      id: 'plus-one-customer',
      prompt: '+1',
      surface: 'customer',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'positive',
      rating: 'up',
    },
    {
      id: 'minus-one-customer',
      prompt: '-1',
      surface: 'customer',
      expectedAction: 'give_ai_feedback',
      rescueReason: 'give_ai_feedback',
      aspect: 'negative',
      rating: 'down',
    },
  ] as const;

export const GIVE_AI_FEEDBACK_HANDLER_FIXTURES = [
  {
    id: 'negative-with-reason',
    prompt: 'Wrong date picked',
    aspect: 'reason_given',
    rating: 'down',
    reason: 'wrong_date',
    params: {
      lastAssistantReply: 'Booked you for Monday.',
      lastAction: 'create_booking',
    },
  },
  {
    id: 'positive-helpful',
    prompt: 'That was helpful',
    aspect: 'positive',
    rating: 'up',
    params: {
      lastAssistantReply: 'Three slots are open tomorrow.',
      lastAction: 'check_availability',
    },
  },
  {
    id: 'negative-needs-reason-chips',
    prompt: 'That was wrong',
    aspect: 'negative',
    rating: 'down',
    params: {
      lastAssistantReply: 'Your appointment is at 3pm.',
    },
  },
  // e2e-bug.265 — "Not helpful" must be thumbs-down (not stolen by bare "helpful")
  {
    id: 'e2e265-not-helpful-down',
    prompt: 'Not helpful',
    aspect: 'negative',
    rating: 'down',
    params: {
      lastAssistantReply: 'I booked you for Tuesday.',
      lastAction: 'book_appointment',
    },
  },
] as const;

export const GIVE_AI_FEEDBACK_RESCUE_SCENARIOS = [
  {
    id: 'unknown-to-feedback',
    prompt: 'That was wrong',
    misclassifiedAction: 'unknown',
    expectedAction: 'give_ai_feedback',
  },
  {
    id: 'booking-help-steal-guard',
    prompt: 'Wrong date picked',
    misclassifiedAction: 'booking_help',
    expectedAction: 'give_ai_feedback',
  },
  {
    id: 'explain-app-feature-steal-guard',
    prompt: 'Not helpful',
    misclassifiedAction: 'explain_app_feature',
    expectedAction: 'give_ai_feedback',
  },
] as const;
