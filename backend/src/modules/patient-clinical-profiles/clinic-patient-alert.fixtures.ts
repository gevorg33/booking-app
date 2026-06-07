import type {
  ClinicPatientAlertListView,
  ClinicPatientAlertType,
} from '../../common/utils/clinic-patient-alert.types.js';

export const CLINIC_PATIENT_ALERT_DISMISSAL_SCENARIOS = [
  {
    id: 'dismisses-unseen-alert',
    dismissals: [] as Array<{
      alertType: ClinicPatientAlertType;
      sourceId: string;
    }>,
    alertType: 'TestResultReleased' as const,
    sourceId: 'result-1',
    expected: false,
  },
  {
    id: 'detects-dismissed-alert',
    dismissals: [
      { alertType: 'TestResultReleased' as const, sourceId: 'result-1' },
    ],
    alertType: 'TestResultReleased' as const,
    sourceId: 'result-1',
    expected: true,
  },
] as const;

export const CLINIC_PATIENT_ALERT_RESULT_FIXTURES = [
  {
    id: 'result-1',
    bookingId: 'booking-1',
    testName: 'CBC panel',
    releasedAt: new Date('2026-06-21T10:00:00.000Z'),
    patientVisibility: 'New',
    status: 'Released',
  },
  {
    id: 'result-2',
    bookingId: null,
    testName: 'Lipid panel',
    releasedAt: new Date('2026-06-20T10:00:00.000Z'),
    patientVisibility: 'Read',
    status: 'Released',
  },
] as const;

export const CLINIC_PATIENT_ALERT_LAB_BOOKING_REQUEST_FIXTURES = [
  {
    id: 'order-1',
    bookingId: 'visit-booking-1',
    displayNames: 'CBC, Lipid panel',
    collectionServiceName: 'Lab blood draw',
    status: 'NotCollected',
    bookingRequestPushedAt: new Date('2026-06-22T11:00:00.000Z'),
    collectionBookingId: null,
  },
  {
    id: 'order-2',
    bookingId: 'visit-booking-2',
    displayNames: 'Thyroid panel',
    collectionServiceName: 'Lab blood draw',
    status: 'NotCollected',
    bookingRequestPushedAt: null,
    collectionBookingId: null,
  },
  {
    id: 'order-3',
    bookingId: 'visit-booking-3',
    displayNames: 'Vitamin D',
    collectionServiceName: 'Lab blood draw',
    status: 'NotCollected',
    bookingRequestPushedAt: new Date('2026-06-21T08:00:00.000Z'),
    collectionBookingId: 'collection-booking-1',
  },
] as const;

export const CLINIC_PATIENT_ALERT_INTAKE_FIXTURES = [
  {
    id: 'intake-1',
    bookingId: 'booking-1',
    questionnaireTitle: 'Referral intake questionnaire',
    status: 'in_progress',
    updatedAt: new Date('2026-06-21T09:00:00.000Z'),
  },
  {
    id: 'intake-2',
    bookingId: null,
    questionnaireTitle: 'Pre-visit intake',
    status: 'completed',
    updatedAt: new Date('2026-06-19T09:00:00.000Z'),
  },
] as const;

export const CLINIC_PATIENT_ALERT_LIST_EXPECTED: ClinicPatientAlertListView = {
  totalCount: 2,
  alerts: [
    {
      id: 'TestResultReleased:result-1',
      type: 'TestResultReleased',
      sourceId: 'result-1',
      bookingId: 'booking-1',
      title: 'New lab result released',
      messages: [{ title: 'CBC panel is available for review.' }],
      chartTab: 'results',
      createdAt: '2026-06-21T10:00:00.000Z',
      testName: 'CBC panel',
    },
    {
      id: 'IntakeIncomplete:intake-1',
      type: 'IntakeIncomplete',
      sourceId: 'intake-1',
      bookingId: 'booking-1',
      title: 'Pre-visit intake incomplete',
      messages: [
        { title: 'Referral intake questionnaire still needs answers.' },
      ],
      chartTab: 'intake',
      createdAt: '2026-06-21T09:00:00.000Z',
      questionnaireTitle: 'Referral intake questionnaire',
    },
  ],
};
