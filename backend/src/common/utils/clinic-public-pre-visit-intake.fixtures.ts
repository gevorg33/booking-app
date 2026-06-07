export const CLINIC_PUBLIC_PRE_VISIT_INTAKE_OFFER_SCENARIOS = [
  {
    id: 'lab-test-with-questionnaire',
    metadata: { serviceType: 'lab_test' },
    hasPublishedQuestionnaire: true,
    expectedLabTest: true,
    expectedOffer: true,
  },
  {
    id: 'lab-test-without-questionnaire',
    metadata: { serviceType: 'lab_test' },
    hasPublishedQuestionnaire: false,
    expectedLabTest: true,
    expectedOffer: false,
  },
  {
    id: 'consultation-never-offers-intake',
    metadata: { serviceType: 'consultation' },
    hasPublishedQuestionnaire: true,
    expectedLabTest: false,
    expectedOffer: false,
  },
] as const;

export const CLINIC_PUBLIC_PRE_VISIT_INTAKE_LINK_SCENARIOS = [
  {
    id: 'links-unassigned-intake',
    input: {
      intakeCustomerId: 'cust-1',
      bookingCustomerId: 'cust-1',
      intakeBookingId: null,
    },
    expected: true,
  },
  {
    id: 'rejects-other-customer',
    input: {
      intakeCustomerId: 'cust-1',
      bookingCustomerId: 'cust-2',
      intakeBookingId: null,
    },
    expected: false,
  },
  {
    id: 'rejects-already-linked-intake',
    input: {
      intakeCustomerId: 'cust-1',
      bookingCustomerId: 'cust-1',
      intakeBookingId: 'booking-1',
    },
    expected: false,
  },
] as const;

export const PUBLIC_PRE_VISIT_INTAKE_CONFIG_EXPECTED = {
  offersPreVisitIntake: true,
  questionnaire: {
    id: 'quest-2',
    title: 'Pre-visit intake',
    code: 'pre-visit-intake',
  },
} as const;
