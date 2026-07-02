export type ExplainClinicBookingFieldsPromptFixture = {
  id: string;
  prompt: string;
  surface: 'customer' | 'public';
  expectedAction: 'explain_clinic_booking_fields';
  rescueReason: 'clinic_booking_fields';
  aspect?:
    | 'governmentId'
    | 'dateOfBirth'
    | 'insurance'
    | 'emergencyContact'
    | 'address'
    | 'intakeQuestion'
    | 'all';
};

export const CUSTOMER_PUBLIC_EXPLAIN_CLINIC_BOOKING_FIELDS_CLASSIFIER_RULES = `- explain_clinic_booking_fields: READ — clinic vertical only: explain identity, registration, and intake fields on the consumer app or public booking flow — government ID/passport, date of birth, insurance details, emergency contact, address, and pre-visit intake questionnaire items. Triggers: "Why do you ask for my ID?", "Why is date of birth required on clinic checkout?", "What is the insurance policy field for?", "Why emergency contact on the intake form?". Set aspect when clear (governmentId|dateOfBirth|insurance|emergencyContact|address|intakeQuestion|all). NOT explain_clinic_booking (symptoms/referral/fasting/prep on checkout), NOT explain_public_intake_form (optional pre-visit health questionnaire step — publicIntakeCheckout), NOT explain_guest_checkout_fields (email/phone/name/guest account), NOT explain_lab_prep (catalog fasting metadata), NOT explain_data_rights (GDPR export/delete), NOT fix_checkout_validation_error (validation troubleshooting).`;

export const EXPLAIN_CLINIC_BOOKING_FIELDS_PROMPTS: readonly ExplainClinicBookingFieldsPromptFixture[] =
  [
    {
      id: 'why-id-public',
      prompt: 'Why do you ask for my ID?',
      surface: 'public',
      expectedAction: 'explain_clinic_booking_fields',
      rescueReason: 'clinic_booking_fields',
      aspect: 'governmentId',
    },
    {
      id: 'passport-intake-public',
      prompt:
        'Why do I need to enter my passport number on the clinic intake form?',
      surface: 'public',
      expectedAction: 'explain_clinic_booking_fields',
      rescueReason: 'clinic_booking_fields',
      aspect: 'governmentId',
    },
    {
      id: 'dob-checkout-public',
      prompt: 'Why is date of birth required on clinic checkout?',
      surface: 'public',
      expectedAction: 'explain_clinic_booking_fields',
      rescueReason: 'clinic_booking_fields',
      aspect: 'dateOfBirth',
    },
    {
      id: 'insurance-field-public',
      prompt:
        'What is the insurance policy number field for on the booking form?',
      surface: 'public',
      expectedAction: 'explain_clinic_booking_fields',
      rescueReason: 'clinic_booking_fields',
      aspect: 'insurance',
    },
    {
      id: 'emergency-contact-public',
      prompt:
        'Why do you need an emergency contact on the clinic registration form?',
      surface: 'public',
      expectedAction: 'explain_clinic_booking_fields',
      rescueReason: 'clinic_booking_fields',
      aspect: 'emergencyContact',
    },
    {
      id: 'home-address-public',
      prompt:
        'Why are you asking for my home address when I book a clinic visit?',
      surface: 'public',
      expectedAction: 'explain_clinic_booking_fields',
      rescueReason: 'clinic_booking_fields',
      aspect: 'address',
    },
    {
      id: 'intake-questionnaire-public',
      prompt:
        'Why is there a pre-visit questionnaire asking for my insurance and ID?',
      surface: 'public',
      expectedAction: 'explain_clinic_booking_fields',
      rescueReason: 'clinic_booking_fields',
      aspect: 'intakeQuestion',
    },
    {
      id: 'clinic-fields-overview-public',
      prompt: 'Explain the identity fields on the clinic booking page',
      surface: 'public',
      expectedAction: 'explain_clinic_booking_fields',
      rescueReason: 'clinic_booking_fields',
      aspect: 'all',
    },
    {
      id: 'why-id-customer',
      prompt: 'Why do you ask for my ID?',
      surface: 'customer',
      expectedAction: 'explain_clinic_booking_fields',
      rescueReason: 'clinic_booking_fields',
      aspect: 'governmentId',
    },
    {
      id: 'national-id-customer',
      prompt: 'Why does the clinic app ask for my national ID number?',
      surface: 'customer',
      expectedAction: 'explain_clinic_booking_fields',
      rescueReason: 'clinic_booking_fields',
      aspect: 'governmentId',
    },
    {
      id: 'dob-customer',
      prompt: 'Why do I need to give my date of birth before booking?',
      surface: 'customer',
      expectedAction: 'explain_clinic_booking_fields',
      rescueReason: 'clinic_booking_fields',
      aspect: 'dateOfBirth',
    },
    {
      id: 'insurance-customer',
      prompt: 'What should I put in the insurance provider field?',
      surface: 'customer',
      expectedAction: 'explain_clinic_booking_fields',
      rescueReason: 'clinic_booking_fields',
      aspect: 'insurance',
    },
    {
      id: 'emergency-contact-customer',
      prompt: 'Why is emergency contact required on clinic intake?',
      surface: 'customer',
      expectedAction: 'explain_clinic_booking_fields',
      rescueReason: 'clinic_booking_fields',
      aspect: 'emergencyContact',
    },
    {
      id: 'address-customer',
      prompt: 'Why do you need my address on the clinic booking form?',
      surface: 'customer',
      expectedAction: 'explain_clinic_booking_fields',
      rescueReason: 'clinic_booking_fields',
      aspect: 'address',
    },
    {
      id: 'intake-customer',
      prompt: 'Explain why the pre-visit intake asks for personal details',
      surface: 'customer',
      expectedAction: 'explain_clinic_booking_fields',
      rescueReason: 'clinic_booking_fields',
      aspect: 'intakeQuestion',
    },
  ];

export const EXPLAIN_CLINIC_BOOKING_FIELDS_RESCUE_SCENARIOS = [
  {
    id: 'clinic-booking-to-fields',
    prompt: 'Why do you ask for my ID?',
    surface: 'customer' as const,
    misclassifiedAction: 'explain_clinic_booking',
    expectedAction: 'explain_clinic_booking_fields' as const,
  },
  {
    id: 'guest-email-to-clinic-id',
    prompt: 'Why do you ask for my ID on clinic checkout?',
    surface: 'public' as const,
    misclassifiedAction: 'explain_guest_checkout_fields',
    expectedAction: 'explain_clinic_booking_fields' as const,
  },
  {
    id: 'data-rights-to-clinic-fields',
    prompt: 'Why is date of birth required on clinic checkout?',
    surface: 'public' as const,
    misclassifiedAction: 'explain_data_rights',
    expectedAction: 'explain_clinic_booking_fields' as const,
  },
  {
    id: 'booking-help-to-insurance',
    prompt:
      'What is the insurance policy number field for on the booking form?',
    surface: 'customer' as const,
    misclassifiedAction: 'booking_help',
    expectedAction: 'explain_clinic_booking_fields' as const,
  },
] as const;
