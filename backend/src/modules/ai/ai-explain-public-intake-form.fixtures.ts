export type ExplainPublicIntakeFormAspect =
  | 'why_questions'
  | 'skip_form'
  | 'what_is_form'
  | 'how_it_works'
  | 'when_shown'
  | 'sign_in_required';

export type ExplainPublicIntakeFormFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_public_intake_form';
  rescueReason: 'public_intake_form';
  aspect?: ExplainPublicIntakeFormAspect;
};

export const CUSTOMER_PUBLIC_EXPLAIN_PUBLIC_INTAKE_FORM_CLASSIFIER_RULES = `- explain_public_intake_form: READ — clinic vertical only: explain the optional pre-visit intake questionnaire step (publicIntakeCheckout* / ConsumerCheckoutIntakeStep) shown before lab-test booking checkout. Triggers: why these health questions, can I skip the form, optional pre-visit questionnaire, skip for now on intake, questionnaire before checkout. NOT explain_clinic_booking_fields (ID/DOB/insurance/emergency contact registration fields), NOT explain_clinic_booking (symptoms/referral checkout fields), NOT explain_lab_prep (catalog fasting metadata), NOT complete_intake_and_book (mutate fill+book compound).`;

export const EXPLAIN_PUBLIC_INTAKE_FORM_PROMPTS: readonly ExplainPublicIntakeFormFixture[] =
  [
    {
      id: 'why-health-questions-public',
      prompt: 'Why these health questions?',
      surface: 'public',
      expectedAction: 'explain_public_intake_form',
      rescueReason: 'public_intake_form',
      aspect: 'why_questions',
    },
    {
      id: 'skip-form-customer',
      prompt: 'Can I skip the form?',
      surface: 'customer',
      expectedAction: 'explain_public_intake_form',
      rescueReason: 'public_intake_form',
      aspect: 'skip_form',
    },
    {
      id: 'what-is-questionnaire-public',
      prompt: 'What is the optional pre-visit questionnaire?',
      surface: 'public',
      expectedAction: 'explain_public_intake_form',
      rescueReason: 'public_intake_form',
      aspect: 'what_is_form',
    },
    {
      id: 'why-before-checkout-customer',
      prompt: 'Why is there a questionnaire before checkout?',
      surface: 'customer',
      expectedAction: 'explain_public_intake_form',
      rescueReason: 'public_intake_form',
      aspect: 'why_questions',
    },
    {
      id: 'must-complete-public',
      prompt: 'Do I have to complete the intake form?',
      surface: 'public',
      expectedAction: 'explain_public_intake_form',
      rescueReason: 'public_intake_form',
      aspect: 'skip_form',
    },
    {
      id: 'skip-for-now-customer',
      prompt: 'What does Skip for now do on the intake step?',
      surface: 'customer',
      expectedAction: 'explain_public_intake_form',
      rescueReason: 'public_intake_form',
      aspect: 'skip_form',
    },
    {
      id: 'how-intake-works-public',
      prompt: 'How does the pre-visit intake work?',
      surface: 'public',
      expectedAction: 'explain_public_intake_form',
      rescueReason: 'public_intake_form',
      aspect: 'how_it_works',
    },
    {
      id: 'when-shown-customer',
      prompt: 'When do I see the intake questionnaire?',
      surface: 'customer',
      expectedAction: 'explain_public_intake_form',
      rescueReason: 'public_intake_form',
      aspect: 'when_shown',
    },
    {
      id: 'sign-in-required-public',
      prompt: 'Why do I need to sign in for the questionnaire?',
      surface: 'public',
      expectedAction: 'explain_public_intake_form',
      rescueReason: 'public_intake_form',
      aspect: 'sign_in_required',
    },
    {
      id: 'what-questions-customer',
      prompt: 'What health questions will you ask?',
      surface: 'customer',
      expectedAction: 'explain_public_intake_form',
      rescueReason: 'public_intake_form',
      aspect: 'what_is_form',
    },
    {
      id: 'book-without-public',
      prompt: 'Can I book without filling the questionnaire?',
      surface: 'public',
      expectedAction: 'explain_public_intake_form',
      rescueReason: 'public_intake_form',
      aspect: 'skip_form',
    },
    {
      id: 'after-finish-customer',
      prompt: 'What happens after I finish the questionnaire?',
      surface: 'customer',
      expectedAction: 'explain_public_intake_form',
      rescueReason: 'public_intake_form',
      aspect: 'how_it_works',
    },
  ];

export const EXPLAIN_PUBLIC_INTAKE_FORM_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-unknown',
    prompt: 'Why these health questions?',
    misclassifiedAction: 'unknown',
    expectedAction: 'explain_public_intake_form' as const,
    surface: 'public' as const,
  },
  {
    id: 'misclassified-clinic-booking',
    prompt: 'Can I skip the form?',
    misclassifiedAction: 'explain_clinic_booking',
    expectedAction: 'explain_public_intake_form' as const,
    surface: 'customer' as const,
  },
  {
    id: 'misclassified-booking-fields',
    prompt: 'What is the optional pre-visit questionnaire?',
    misclassifiedAction: 'explain_clinic_booking_fields',
    expectedAction: 'explain_public_intake_form' as const,
    surface: 'public' as const,
  },
] as const;

export const EXPLAIN_PUBLIC_INTAKE_FORM_BOUNDARY_PROMPTS = [
  {
    id: 'symptoms-field',
    prompt: 'What should I put in the symptoms field on checkout?',
    surface: 'public' as const,
  },
  {
    id: 'passport-field',
    prompt: 'Why do you ask for my passport on the clinic intake form?',
    surface: 'customer' as const,
  },
  {
    id: 'fasting-lab',
    prompt: 'Do I need to fast for blood work?',
    surface: 'public' as const,
  },
] as const;
