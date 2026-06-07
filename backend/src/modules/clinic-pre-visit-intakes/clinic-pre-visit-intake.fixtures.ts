export const CLINIC_PRE_VISIT_INTAKE_FIXTURES = {
  assignedChartIntake: {
    id: 'intake-1',
    businessId: 'biz-1',
    customerId: 'cust-1',
    bookingId: null,
    questionnaireId: 'quest-1',
    responseId: null,
    status: 'assigned',
    assignedByEmployeeId: 'emp-1',
    completedAt: null,
    createdAt: '2026-06-20T12:00:00.000Z',
    updatedAt: '2026-06-20T12:00:00.000Z',
  },
  bookingIntake: {
    id: 'intake-2',
    businessId: 'biz-1',
    customerId: 'cust-1',
    bookingId: 'booking-1',
    questionnaireId: 'quest-1',
    responseId: 'resp-1',
    status: 'in_progress',
    assignedByEmployeeId: 'emp-1',
    completedAt: null,
    createdAt: '2026-06-20T12:00:00.000Z',
    updatedAt: '2026-06-20T12:05:00.000Z',
  },
} as const;

export const CLINIC_PRE_VISIT_INTAKE_STATUS_SCENARIOS = [
  {
    id: 'response-completed-maps-intake-completed',
    responseStatus: 'completed',
    currentStatus: 'in_progress',
    expected: 'completed',
  },
  {
    id: 'response-in-progress-maps-intake-in-progress',
    responseStatus: 'in_progress',
    currentStatus: 'assigned',
    expected: 'in_progress',
  },
  {
    id: 'missing-response-keeps-status',
    responseStatus: null,
    currentStatus: 'assigned',
    expected: 'assigned',
  },
] as const;

export const CLINIC_DEFAULT_QUESTIONNAIRE_SCENARIOS = [
  {
    id: 'prefers-explicit-id',
    preferredQuestionnaireId: 'quest-custom',
    questionnaires: [
      {
        id: 'quest-1',
        code: 'referral-intake',
        status: 'published',
        isActive: true,
      },
    ],
    expectedId: 'quest-custom',
  },
  {
    id: 'prefers-pre-visit-code',
    preferredQuestionnaireId: null,
    questionnaires: [
      {
        id: 'quest-1',
        code: 'referral-intake',
        status: 'published',
        isActive: true,
      },
      {
        id: 'quest-2',
        code: 'pre-visit-intake',
        status: 'published',
        isActive: true,
      },
    ],
    expectedId: 'quest-2',
  },
  {
    id: 'falls-back-to-first-published',
    preferredQuestionnaireId: null,
    questionnaires: [
      { id: 'quest-1', code: 'other', status: 'published', isActive: true },
    ],
    expectedId: 'quest-1',
  },
  {
    id: 'returns-null-without-published',
    preferredQuestionnaireId: null,
    questionnaires: [
      {
        id: 'quest-1',
        code: 'referral-intake',
        status: 'draft',
        isActive: true,
      },
    ],
    expectedId: null,
  },
] as const;

export const ASSIGN_CLINIC_PRE_VISIT_INTAKE_PAYLOAD = {
  bookingId: null,
  questionnaireId: 'quest-1',
} as const;
