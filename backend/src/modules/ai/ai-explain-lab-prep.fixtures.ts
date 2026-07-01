export type ExplainLabPrepPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_lab_prep';
  rescueReason: 'lab_prep';
  serviceName?: string;
};

export const CUSTOMER_PUBLIC_EXPLAIN_LAB_PREP_CLASSIFIER_RULES = `- explain_lab_prep: READ — clinic vertical only: explain lab-test preparation from catalog metadata (requiresFasting, preparationNotes) before or while browsing services. Triggers: do I need to fast for blood work, does CBC require fasting, prep instructions for lipid panel, which lab tests require fasting, should I fast for lab work. Set serviceName when a specific test/panel is named. Summarize fasting flag and preparation notes from the service catalog. NOT explain_clinic_booking (checkout form fields, symptoms/referral, "this blood draw on checkout"), NOT explain_clinic_booking_fields (ID/DOB/insurance registration fields), NOT explain_preparation_notes (post-booking visit prep for my appointment), NOT explain_clinic_services (dashboard staff catalog breakdown), NOT book_lab_collection (mutate booking), NOT list_my_test_results (result status).`;

export const EXPLAIN_LAB_PREP_PROMPTS: readonly ExplainLabPrepPromptFixture[] =
  [
    {
      id: 'fast-for-blood-work-public',
      prompt: 'Do I need to fast for blood work?',
      surface: 'public',
      expectedAction: 'explain_lab_prep',
      rescueReason: 'lab_prep',
    },
    {
      id: 'cbc-fasting-public',
      prompt: 'Does CBC require fasting?',
      surface: 'public',
      expectedAction: 'explain_lab_prep',
      rescueReason: 'lab_prep',
      serviceName: 'CBC',
    },
    {
      id: 'lipid-prep-public',
      prompt: 'What are the prep instructions for Lipid panel?',
      surface: 'public',
      expectedAction: 'explain_lab_prep',
      rescueReason: 'lab_prep',
      serviceName: 'Lipid panel',
    },
    {
      id: 'which-tests-fasting-public',
      prompt: 'Which lab tests require fasting?',
      surface: 'public',
      expectedAction: 'explain_lab_prep',
      rescueReason: 'lab_prep',
    },
    {
      id: 'fast-for-lab-work-public',
      prompt: 'Should I fast for lab work?',
      surface: 'public',
      expectedAction: 'explain_lab_prep',
      rescueReason: 'lab_prep',
    },
    {
      id: 'metabolic-fasting-public',
      prompt: 'Is fasting required for metabolic panel?',
      surface: 'public',
      expectedAction: 'explain_lab_prep',
      rescueReason: 'lab_prep',
      serviceName: 'metabolic panel',
    },
    {
      id: 'fast-for-blood-work-customer',
      prompt: 'Do I need to fast for blood work?',
      surface: 'customer',
      expectedAction: 'explain_lab_prep',
      rescueReason: 'lab_prep',
    },
    {
      id: 'cbc-fasting-customer',
      prompt: 'Does the CBC lab test require fasting?',
      surface: 'customer',
      expectedAction: 'explain_lab_prep',
      rescueReason: 'lab_prep',
      serviceName: 'CBC',
    },
    {
      id: 'lipid-prep-customer',
      prompt: 'Explain prep for Lipid panel',
      surface: 'customer',
      expectedAction: 'explain_lab_prep',
      rescueReason: 'lab_prep',
      serviceName: 'Lipid panel',
    },
    {
      id: 'which-tests-fasting-customer',
      prompt: 'Which tests need fasting?',
      surface: 'customer',
      expectedAction: 'explain_lab_prep',
      rescueReason: 'lab_prep',
    },
    {
      id: 'blood-test-prep-customer',
      prompt: 'What is the preparation for blood tests?',
      surface: 'customer',
      expectedAction: 'explain_lab_prep',
      rescueReason: 'lab_prep',
    },
    {
      id: 'tsh-fasting-customer',
      prompt: 'Do I need to fast before TSH blood test?',
      surface: 'customer',
      expectedAction: 'explain_lab_prep',
      rescueReason: 'lab_prep',
      serviceName: 'TSH',
    },
  ];

export const EXPLAIN_LAB_PREP_RESCUE_SCENARIOS = [
  {
    id: 'misclassified-clinic-booking',
    prompt: 'Do I need to fast for blood work?',
    misclassifiedAction: 'explain_clinic_booking',
    surface: 'public' as const,
  },
  {
    id: 'misclassified-preparation-notes',
    prompt: 'Does CBC require fasting?',
    misclassifiedAction: 'explain_preparation_notes',
    surface: 'customer' as const,
  },
  {
    id: 'misclassified-test-results',
    prompt: 'Which lab tests require fasting?',
    misclassifiedAction: 'list_my_test_results',
    surface: 'public' as const,
  },
  {
    id: 'misclassified-clinic-services',
    prompt: 'What are the prep instructions for Lipid panel?',
    misclassifiedAction: 'explain_clinic_services',
    surface: 'customer' as const,
  },
] as const;
