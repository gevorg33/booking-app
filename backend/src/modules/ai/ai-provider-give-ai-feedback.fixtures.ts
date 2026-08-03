import type {
  ProviderGiveAiFeedbackAspect,
  ProviderGiveAiFeedbackRating,
  ProviderGiveAiFeedbackReason,
} from './ai-provider-give-ai-feedback.util.js';

export const PROVIDER_GIVE_AI_FEEDBACK_CLASSIFIER_RULES = `- give_provider_ai_feedback: MUTATE — provider mobile only: thumbs up/down on the last assistant answer with optional reason chips (Wrong action, Wrong date, Wrong client, Wrong service, Didn't understand). Triggers: "Wrong client picked", "That wasn't my intent", "That was helpful", "Not helpful". Uses feedbackRating (up|down) and feedbackReason from session when present. NOT give_ai_feedback (customer/public surface).`;

export type ProviderGiveAiFeedbackPromptFixture = {
  id: string;
  prompt: string;
  surface: 'provider';
  expectedAction: 'give_provider_ai_feedback';
  rescueReason: 'give_provider_ai_feedback';
  aspect?: ProviderGiveAiFeedbackAspect;
  rating?: ProviderGiveAiFeedbackRating;
  reason?: ProviderGiveAiFeedbackReason;
};

export const PROVIDER_GIVE_AI_FEEDBACK_PROMPTS: readonly ProviderGiveAiFeedbackPromptFixture[] =
  [
    {
      id: 'wrong-client-picked-provider',
      prompt: 'Wrong client picked',
      surface: 'provider',
      expectedAction: 'give_provider_ai_feedback',
      rescueReason: 'give_provider_ai_feedback',
      aspect: 'reason_given',
      rating: 'down',
      reason: 'wrong_client',
    },
    {
      id: 'not-my-intent-provider',
      prompt: "That wasn't my intent",
      surface: 'provider',
      expectedAction: 'give_provider_ai_feedback',
      rescueReason: 'give_provider_ai_feedback',
      aspect: 'reason_given',
      rating: 'down',
      reason: 'did_not_understand',
    },
    {
      id: 'was-not-my-intent-provider',
      prompt: 'That was not my intent',
      surface: 'provider',
      expectedAction: 'give_provider_ai_feedback',
      rescueReason: 'give_provider_ai_feedback',
      aspect: 'reason_given',
      rating: 'down',
      reason: 'did_not_understand',
    },
    {
      id: 'not-helpful-provider',
      prompt: 'Not helpful',
      surface: 'provider',
      expectedAction: 'give_provider_ai_feedback',
      rescueReason: 'give_provider_ai_feedback',
      aspect: 'negative',
      rating: 'down',
    },
    {
      id: 'that-was-wrong-provider',
      prompt: 'That was wrong',
      surface: 'provider',
      expectedAction: 'give_provider_ai_feedback',
      rescueReason: 'give_provider_ai_feedback',
      aspect: 'negative',
      rating: 'down',
    },
    {
      id: 'that-was-helpful-provider',
      prompt: 'That was helpful',
      surface: 'provider',
      expectedAction: 'give_provider_ai_feedback',
      rescueReason: 'give_provider_ai_feedback',
      aspect: 'positive',
      rating: 'up',
    },
    {
      id: 'wrong-date-picked-provider',
      prompt: 'Wrong date picked',
      surface: 'provider',
      expectedAction: 'give_provider_ai_feedback',
      rescueReason: 'give_provider_ai_feedback',
      aspect: 'reason_given',
      rating: 'down',
      reason: 'wrong_date',
    },
  ] as const;
