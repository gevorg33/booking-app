/** pipe-1.8.2 — resolve + validate handoff via CommandCompletionPipelineService. */
export const COMPLETION_VALIDATE_HANDOFF_PIPE_MARKER = 'pipe-1.8.2';

export type CompletionHandoffFixtureScenario = {
  id: string;
  action: string;
  params: Record<string, unknown>;
  prompt: string;
  expectValidate: boolean;
  expectClarify: boolean;
  expectedMissingFields?: string[];
};

export const COMPLETION_HANDOFF_SCENARIOS: CompletionHandoffFixtureScenario[] =
  [
    {
      id: 'create-booking-missing-service',
      action: 'create_booking',
      params: {
        employeeName: 'Gevorg Gasparyan',
        date: '2026-06-15',
        timeSlot: '09:00',
      },
      prompt: 'Book Gevorg tomorrow at 9',
      expectValidate: true,
      expectClarify: true,
      expectedMissingFields: ['serviceName'],
    },
    {
      id: 'create-booking-first-available-complete',
      action: 'create_booking',
      params: {
        employeeName: 'Gevorg Gasparyan',
        serviceName: 'Haircut',
        bookingFirstAvailable: true,
        date: '2026-06-15',
      },
      prompt: 'Book Gevorg for a haircut tomorrow first available',
      expectValidate: true,
      expectClarify: false,
    },
    {
      id: 'summarize-bookings-skips-validate',
      action: 'summarize_bookings',
      params: { bookingMetric: 'count', date: '2026-06-15' },
      prompt: 'How many bookings today',
      expectValidate: false,
      expectClarify: false,
    },
    {
      id: 'create-service-incomplete',
      action: 'create_service',
      params: { serviceName: 'Facemassage' },
      prompt: 'Add facemassage service',
      expectValidate: true,
      expectClarify: true,
      expectedMissingFields: ['durationMinutes', 'price'],
    },
    {
      id: 'create-service-complete',
      action: 'create_service',
      params: {
        serviceName: 'Facemassage',
        durationMinutes: 60,
        price: 50,
      },
      prompt: 'Add facemassage 60 minutes for $50',
      expectValidate: true,
      expectClarify: false,
    },
  ];
