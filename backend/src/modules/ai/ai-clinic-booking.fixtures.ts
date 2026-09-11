/** Customer + public classifier rules for clinic checkout fields (ai-cmd-clinic-5). */
export const CLINIC_BOOKING_CLASSIFIER_RULES = `- explain_clinic_booking: READ — clinic vertical only: explain optional checkout fields on the public booking page or consumer app — symptoms/reason for visit, referral notes, and lab fasting/prep instructions on checkout. Optional serviceName for service-specific prep. Triggers on checkout/booking page: what to put in symptoms, referral field, do I need to fast before this blood draw on checkout, preparation before lab test. NOT explain_clinic_booking_fields (ID/DOB/insurance/emergency contact/address registration fields), NOT explain_public_intake_form (optional pre-visit health questionnaire — publicIntakeCheckout), NOT explain_lab_prep (catalog lab prep/fasting before booking), NOT explain_preparation_notes (post-booking visit prep/meeting point), NOT explain_data_rights, NOT list_my_test_results, NOT explain_result_status, NOT book_lab_collection, NOT explain_checkout_tax, NOT dashboard explain_clinic_services (staff catalog).
- Examples:
  - "What should I put in the symptoms field on checkout?" → explain_clinic_booking, aspect=symptoms
  - "Do I need to fast before this blood draw?" → explain_clinic_booking, aspect=preparation
  - "What are referral notes for on the booking form?" → explain_clinic_booking, aspect=referralNotes
  - "Why is there a pre-visit intake step before checkout?" → explain_clinic_booking, aspect=preVisitIntake
  - "Explain the lab prep for Lipid panel on checkout" → explain_clinic_booking, serviceName=Lipid panel, aspect=preparation
  - "Что писать в поле симптомов при записи?" → explain_clinic_booking, aspect=symptoms
  - "Պետք է լինեմ ծոմավորո՞ւմ այս լաբ թեստից առաջ" → explain_clinic_booking, aspect=preparation`;

/** Declared so the array is one type, not a union of twelve literal shapes. */
export type ExplainClinicBookingPromptFixture = {
  id: string;
  prompt: string;
  aspect:
    | 'all'
    | 'preVisitIntake'
    | 'preparation'
    | 'referralNotes'
    | 'symptoms';
  serviceName?: string;
};

export const EXPLAIN_CLINIC_BOOKING_PROMPTS: readonly ExplainClinicBookingPromptFixture[] = [
  {
    id: 'symptoms-field',
    prompt: 'What should I put in the symptoms field on checkout?',
    aspect: 'symptoms',
  },
  {
    id: 'reason-for-visit',
    prompt: 'What is the reason for visit field for on this booking page?',
    aspect: 'symptoms',
  },
  {
    id: 'referral-notes',
    prompt: 'What are referral notes for on the booking form?',
    aspect: 'referralNotes',
  },
  {
    id: 'referring-doctor',
    prompt: 'Where do I enter my referring doctor on checkout?',
    aspect: 'referralNotes',
  },
  {
    id: 'fasting-required',
    prompt: 'Do I need to fast before this blood draw?',
    aspect: 'preparation',
  },
  {
    id: 'lab-prep-generic',
    prompt: 'How should I prepare for this lab test on checkout?',
    aspect: 'preparation',
  },
  {
    id: 'lipid-prep',
    prompt: 'Explain the lab prep for Lipid panel on checkout',
    aspect: 'preparation',
    serviceName: 'Lipid panel',
  },
  {
    id: 'pre-visit-intake',
    prompt: 'Why is there a pre-visit intake step before checkout?',
    aspect: 'preVisitIntake',
  },
  {
    id: 'intake-questionnaire',
    prompt: 'What is the pre-visit questionnaire on the booking page?',
    aspect: 'preVisitIntake',
  },
  {
    id: 'checkout-fields-overview',
    prompt: 'Explain the clinic checkout fields on this page',
    aspect: 'all',
  },
  {
    id: 'optional-symptoms',
    prompt: 'Are symptoms required when I book a clinic visit here?',
    aspect: 'symptoms',
  },
  {
    id: 'cbc-fasting',
    prompt: 'Does CBC require fasting on this booking page?',
    aspect: 'preparation',
    serviceName: 'CBC',
  },
];

export const CLINIC_BOOKING_RESCUE_SCENARIOS = [
  {
    id: 'data-rights-to-clinic-booking',
    prompt: 'What should I put in the symptoms field on checkout?',
    misclassifiedAction: 'explain_data_rights',
    expectedAction: 'explain_clinic_booking' as const,
  },
  {
    id: 'result-status-to-clinic-booking',
    prompt: 'Do I need to fast before this blood draw?',
    misclassifiedAction: 'explain_result_status',
    expectedAction: 'explain_clinic_booking' as const,
  },
  {
    id: 'lab-booking-to-clinic-booking',
    prompt: 'What are referral notes for on the booking form?',
    misclassifiedAction: 'list_my_lab_booking_requests',
    expectedAction: 'explain_clinic_booking' as const,
  },
  {
    id: 'checkout-tax-to-clinic-booking',
    prompt: 'Explain the lab prep for Lipid panel on checkout',
    misclassifiedAction: 'explain_checkout_tax',
    expectedAction: 'explain_clinic_booking' as const,
  },
] as const;
