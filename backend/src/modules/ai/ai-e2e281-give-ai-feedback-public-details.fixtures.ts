/**
 * e2e-bug.281 — public give_ai_feedback must forward chip/label UI fields
 * through commandResultToPublicAssistantResult (not strip them).
 */

export type E2e281DetailCase = {
  id: string;
  details: Record<string, unknown>;
  expectKeys: readonly string[];
  forbidKeys?: readonly string[];
  expectShowReasonChips?: boolean;
  expectFeedbackRating?: 'up' | 'down';
  expectClientAction?: string;
  expectReasonOptionCount?: number;
};

export const E2E281_PUBLIC_DETAIL_CASES: readonly E2e281DetailCase[] = [
  {
    id: 'e2e281-down-needs-chips',
    details: {
      aspect: 'rate_answer',
      feedbackRating: 'down',
      showReasonChips: true,
      feedbackUpLabel: 'Helpful',
      feedbackDownLabel: 'Not helpful',
      feedbackThanks: 'Thanks — this helps improve the assistant.',
      feedbackReasonSkipLabel: 'Skip',
      feedbackReasonOptions: [
        { id: 'wrong_action', label: 'Wrong action' },
        { id: 'wrong_date', label: 'Wrong date' },
        { id: 'wrong_person', label: 'Wrong person' },
        { id: 'wrong_service', label: 'Wrong service' },
        { id: 'did_not_understand', label: "Didn't understand" },
      ],
      clientAction: 'openAssistantFeedback',
      assistantFeedback: true,
      lastAssistantReply: 'Here are our services…',
      lastAction: 'list_services',
      orchestrationSecret: 'strip-me',
    },
    expectKeys: [
      'showReasonChips',
      'aspect',
      'assistantFeedback',
      'feedbackUpLabel',
      'feedbackDownLabel',
      'feedbackThanks',
      'feedbackReasonSkipLabel',
      'feedbackReasonOptions',
      'clientAction',
      'feedbackRating',
      'lastAssistantReply',
      'lastAction',
    ],
    forbidKeys: ['orchestrationSecret'],
    expectShowReasonChips: true,
    expectFeedbackRating: 'down',
    expectClientAction: 'openAssistantFeedback',
    expectReasonOptionCount: 5,
  },
  {
    id: 'e2e281-up-submit',
    details: {
      aspect: 'rate_answer',
      feedbackRating: 'up',
      feedbackUpLabel: 'Helpful',
      feedbackDownLabel: 'Not helpful',
      feedbackThanks: 'Thanks — this helps improve the assistant.',
      feedbackReasonOptions: [{ id: 'wrong_date', label: 'Wrong date' }],
      clientAction: 'submitAssistantFeedback',
      assistantFeedback: true,
    },
    expectKeys: [
      'aspect',
      'assistantFeedback',
      'feedbackUpLabel',
      'feedbackDownLabel',
      'feedbackThanks',
      'feedbackReasonOptions',
      'clientAction',
      'feedbackRating',
    ],
    expectFeedbackRating: 'up',
    expectClientAction: 'submitAssistantFeedback',
    expectReasonOptionCount: 1,
  },
  {
    id: 'e2e281-down-with-reason',
    details: {
      aspect: 'rate_answer',
      feedbackRating: 'down',
      feedbackReason: 'wrong_date',
      feedbackUpLabel: 'Helpful',
      feedbackDownLabel: 'Not helpful',
      feedbackReasonOptions: [
        { id: 'wrong_date', label: 'Wrong date' },
        { id: 'wrong_service', label: 'Wrong service' },
      ],
      clientAction: 'submitAssistantFeedback',
      assistantFeedback: true,
    },
    expectKeys: [
      'aspect',
      'assistantFeedback',
      'feedbackUpLabel',
      'feedbackDownLabel',
      'feedbackReasonOptions',
      'clientAction',
      'feedbackRating',
      'feedbackReason',
    ],
    expectFeedbackRating: 'down',
    expectClientAction: 'submitAssistantFeedback',
    expectReasonOptionCount: 2,
  },
];

export type E2e281LivePromptCase = {
  id: string;
  prompt: string;
  expectRating?: 'up' | 'down';
  expectShowReasonChips?: boolean;
  expectClientAction: string;
  requireLabels: boolean;
  requireReasonOptions: boolean;
};

/** Live public prompts covering chip / label payload edges. */
export const E2E281_LIVE_PROMPT_CASES: readonly E2e281LivePromptCase[] = [
  {
    id: 'live-not-helpful-chips',
    prompt: 'Not helpful',
    expectRating: 'down',
    expectShowReasonChips: true,
    expectClientAction: 'openAssistantFeedback',
    requireLabels: true,
    requireReasonOptions: true,
  },
  {
    id: 'live-bad-answer-chips',
    prompt: 'Bad answer',
    expectRating: 'down',
    expectShowReasonChips: true,
    expectClientAction: 'openAssistantFeedback',
    requireLabels: true,
    requireReasonOptions: true,
  },
  {
    id: 'live-that-was-helpful',
    prompt: 'That was helpful',
    expectRating: 'up',
    expectClientAction: 'submitAssistantFeedback',
    requireLabels: true,
    requireReasonOptions: true,
  },
  {
    id: 'live-helpful',
    prompt: 'Helpful',
    expectRating: 'up',
    expectClientAction: 'submitAssistantFeedback',
    requireLabels: true,
    requireReasonOptions: true,
  },
  {
    id: 'live-wrong-date-picked',
    prompt: 'Wrong date picked',
    expectRating: 'down',
    expectClientAction: 'submitAssistantFeedback',
    requireLabels: true,
    requireReasonOptions: true,
  },
  {
    id: 'live-wrong-service',
    prompt: 'Wrong service',
    expectRating: 'down',
    expectClientAction: 'submitAssistantFeedback',
    requireLabels: true,
    requireReasonOptions: true,
  },
  {
    id: 'live-wrong-person',
    prompt: 'Wrong person picked',
    expectRating: 'down',
    expectClientAction: 'submitAssistantFeedback',
    requireLabels: true,
    requireReasonOptions: true,
  },
  {
    id: 'live-wrong-action',
    prompt: 'Wrong action',
    expectRating: 'down',
    expectClientAction: 'submitAssistantFeedback',
    requireLabels: true,
    requireReasonOptions: true,
  },
  {
    id: 'live-did-not-understand',
    prompt: "You didn't understand me",
    expectRating: 'down',
    expectClientAction: 'submitAssistantFeedback',
    requireLabels: true,
    requireReasonOptions: true,
  },
  {
    id: 'live-good-answer',
    prompt: 'Good answer',
    expectRating: 'up',
    expectClientAction: 'submitAssistantFeedback',
    requireLabels: true,
    requireReasonOptions: true,
  },
];
