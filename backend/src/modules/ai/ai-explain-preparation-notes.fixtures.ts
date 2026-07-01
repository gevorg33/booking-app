export type PreparationNotesAspect =
  | 'fasting'
  | 'preparation'
  | 'what_to_bring'
  | 'meeting_point'
  | 'all';

export type ExplainPreparationNotesPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_preparation_notes';
  aspect: PreparationNotesAspect;
  rescueReason: 'preparation_notes';
  serviceName?: string;
};

export const EXPLAIN_PREPARATION_NOTES_PROMPTS: readonly ExplainPreparationNotesPromptFixture[] =
  [
    {
      id: 'need-to-fast-customer',
      prompt: 'Do I need to fast?',
      surface: 'customer',
      expectedAction: 'explain_preparation_notes',
      aspect: 'fasting',
      rescueReason: 'preparation_notes',
    },
    {
      id: 'fast-before-appointment-customer',
      prompt: 'Should I fast before my appointment?',
      surface: 'customer',
      expectedAction: 'explain_preparation_notes',
      aspect: 'fasting',
      rescueReason: 'preparation_notes',
    },
    {
      id: 'what-to-bring-customer',
      prompt: 'What should I bring to my appointment?',
      surface: 'customer',
      expectedAction: 'explain_preparation_notes',
      aspect: 'what_to_bring',
      rescueReason: 'preparation_notes',
    },
    {
      id: 'prep-for-visit-customer',
      prompt: 'Any preparation for my visit?',
      surface: 'customer',
      expectedAction: 'explain_preparation_notes',
      aspect: 'preparation',
      rescueReason: 'preparation_notes',
    },
    {
      id: 'lab-prep-notes-customer',
      prompt: 'What are the prep notes for my lab test?',
      surface: 'customer',
      expectedAction: 'explain_preparation_notes',
      aspect: 'preparation',
      rescueReason: 'preparation_notes',
    },
    {
      id: 'blood-draw-fast-customer',
      prompt: 'Do I need to fast before my blood draw?',
      surface: 'customer',
      expectedAction: 'explain_preparation_notes',
      aspect: 'fasting',
      rescueReason: 'preparation_notes',
    },
    {
      id: 'bring-tomorrow-customer',
      prompt: 'What do I need to bring tomorrow?',
      surface: 'customer',
      expectedAction: 'explain_preparation_notes',
      aspect: 'what_to_bring',
      rescueReason: 'preparation_notes',
    },
    {
      id: 'prepare-for-visit-customer',
      prompt: 'How should I prepare for my visit?',
      surface: 'customer',
      expectedAction: 'explain_preparation_notes',
      aspect: 'all',
      rescueReason: 'preparation_notes',
    },
    {
      id: 'prep-instructions-customer',
      prompt: 'Prep instructions for my appointment',
      surface: 'customer',
      expectedAction: 'explain_preparation_notes',
      aspect: 'preparation',
      rescueReason: 'preparation_notes',
    },
    {
      id: 'need-to-fast-public',
      prompt: 'Do I need to fast?',
      surface: 'public',
      expectedAction: 'explain_preparation_notes',
      aspect: 'fasting',
      rescueReason: 'preparation_notes',
    },
    {
      id: 'fast-before-appointment-public',
      prompt: 'Should I fast before my appointment?',
      surface: 'public',
      expectedAction: 'explain_preparation_notes',
      aspect: 'fasting',
      rescueReason: 'preparation_notes',
    },
    {
      id: 'what-to-bring-public',
      prompt: 'What should I bring to my appointment?',
      surface: 'public',
      expectedAction: 'explain_preparation_notes',
      aspect: 'what_to_bring',
      rescueReason: 'preparation_notes',
    },
    {
      id: 'prep-for-visit-public',
      prompt: 'Any preparation for my visit?',
      surface: 'public',
      expectedAction: 'explain_preparation_notes',
      aspect: 'preparation',
      rescueReason: 'preparation_notes',
    },
    {
      id: 'lab-prep-notes-public',
      prompt: 'What are the prep notes for my lab test?',
      surface: 'public',
      expectedAction: 'explain_preparation_notes',
      aspect: 'preparation',
      rescueReason: 'preparation_notes',
    },
    {
      id: 'blood-draw-fast-public',
      prompt: 'Do I need to fast before my blood draw?',
      surface: 'public',
      expectedAction: 'explain_preparation_notes',
      aspect: 'fasting',
      rescueReason: 'preparation_notes',
    },
    {
      id: 'bring-tomorrow-public',
      prompt: 'What do I need to bring tomorrow?',
      surface: 'public',
      expectedAction: 'explain_preparation_notes',
      aspect: 'what_to_bring',
      rescueReason: 'preparation_notes',
    },
    {
      id: 'prepare-for-visit-public',
      prompt: 'How should I prepare for my visit?',
      surface: 'public',
      expectedAction: 'explain_preparation_notes',
      aspect: 'all',
      rescueReason: 'preparation_notes',
    },
    {
      id: 'prep-instructions-public',
      prompt: 'Prep instructions for my appointment',
      surface: 'public',
      expectedAction: 'explain_preparation_notes',
      aspect: 'preparation',
      rescueReason: 'preparation_notes',
    },
  ] as const;

export const EXPLAIN_PREPARATION_NOTES_RESCUE_SCENARIOS = [
  {
    id: 'unknown-to-prep-notes',
    prompt: 'Do I need to fast?',
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_preparation_notes',
  },
  {
    id: 'clinic-booking-to-prep-notes',
    prompt: 'What should I bring to my appointment?',
    misclassifiedAction: 'explain_clinic_booking',
    expectedAction: 'explain_preparation_notes',
  },
  {
    id: 'confirm-to-prep-notes',
    prompt: 'Should I fast before my appointment?',
    misclassifiedAction: 'confirm_my_booking_details',
    expectedAction: 'explain_preparation_notes',
  },
] as const;
