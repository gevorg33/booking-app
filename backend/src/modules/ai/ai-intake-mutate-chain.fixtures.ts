export const INTAKE_MUTATE_CHAIN_INTENTS = [
  'create_intake_draft',
  'get_intake_flow_status',
  'start_pre_visit_intake',
  'submit_intake_answers',
] as const;

export type IntakeMutateChainIntent =
  (typeof INTAKE_MUTATE_CHAIN_INTENTS)[number];

export const INTAKE_MUTATE_CHAIN_CLASSIFIER_RULES = `- create_intake_draft: MUTATE — signed-in customer starts a pre-visit intake questionnaire for a lab test service (creates/reuses a draft). Triggers: "Start the pre-visit intake for blood draw", "Begin my intake form for the lab test". Requires serviceName or serviceId. Sets intakeId in session for the next steps. NOT explain_public_intake_form (explains the form, doesn't start it), NOT complete_intake_and_book (compound that also books a slot).
- get_intake_flow_status: READ — check the status/next question of an in-progress pre-visit intake. Triggers: "What's the status of my intake?", "What's the next intake question?". Requires intakeId from session. NOT create_intake_draft (starts a new one).
- start_pre_visit_intake: MUTATE — begins answering the questionnaire for an already-created intake draft (starts the response, returns the first question). Triggers: "Start answering the intake questions". Requires intakeId from session. NOT create_intake_draft (creates the draft itself), NOT submit_intake_answers (answers a question).
- submit_intake_answers: MUTATE — submit one or more free-text answers to the pre-visit intake questionnaire, in order, without needing to know question ids (each answer is matched to the questionnaire's current next question). Triggers: "My answer is no allergies", "I don't smoke, no prior surgeries, not currently on medication" (submits each as a separate answer in order). Requires intakeId from session and answers (one or more strings). NOT start_pre_visit_intake (only begins the flow, no answer given).`;

export type IntakeMutateChainPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: IntakeMutateChainIntent;
  rescueReason: string;
  serviceName?: string;
  answers?: string[];
};

export const INTAKE_MUTATE_CHAIN_PROMPTS: readonly IntakeMutateChainPromptFixture[] =
  [
    {
      id: 'start-intake-blood-draw-public',
      prompt: 'Start the pre-visit intake for blood draw',
      surface: 'public',
      expectedAction: 'create_intake_draft',
      rescueReason: 'create_intake_draft',
      serviceName: 'blood draw',
    },
    {
      id: 'begin-intake-form-customer',
      prompt: 'Begin my intake form for the lab test',
      surface: 'customer',
      expectedAction: 'create_intake_draft',
      rescueReason: 'create_intake_draft',
    },
    {
      id: 'intake-status-public',
      prompt: "What's the status of my intake?",
      surface: 'public',
      expectedAction: 'get_intake_flow_status',
      rescueReason: 'intake_flow_status',
    },
    {
      id: 'intake-next-question-customer',
      prompt: "What's the next intake question?",
      surface: 'customer',
      expectedAction: 'get_intake_flow_status',
      rescueReason: 'intake_flow_status',
    },
    {
      id: 'start-answering-intake-public',
      prompt: 'Start answering the intake questions',
      surface: 'public',
      expectedAction: 'start_pre_visit_intake',
      rescueReason: 'start_pre_visit_intake',
    },
    {
      id: 'submit-single-answer-customer',
      prompt: 'My answer is no allergies',
      surface: 'customer',
      expectedAction: 'submit_intake_answers',
      rescueReason: 'submit_intake_answers',
      answers: ['no allergies'],
    },
    {
      id: 'submit-batch-answers-public',
      prompt: "I don't smoke, no prior surgeries, not currently on medication",
      surface: 'public',
      expectedAction: 'submit_intake_answers',
      rescueReason: 'submit_intake_answers',
      answers: [
        "I don't smoke",
        'no prior surgeries',
        'not currently on medication',
      ],
    },
  ];
