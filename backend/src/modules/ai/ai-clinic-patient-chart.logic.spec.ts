import { handleExplainPatientChartLogic } from './ai-clinic-patient-chart.logic.js';
import { EXPLAIN_PATIENT_CHART_PROMPTS } from './ai-clinic-patient-chart.fixtures.js';

describe('ai-clinic-patient-chart.logic', () => {
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: { businessType: 'clinic' },
    })),
  };
  const customerRepo = {
    find: jest.fn(async () => [
      {
        id: 'cust-maria',
        name: 'Maria Lopez',
        businessId: 'biz-1',
        isActive: true,
      },
    ]),
    findOne: jest.fn(async () => null),
  };
  const patientChartService = {
    getChartSummaryForCustomer: jest.fn(async () => ({
      customerId: 'cust-maria',
      customerName: 'Maria Lopez',
      allergies: 'Penicillin',
      chronicProblems: null,
      bloodType: 'O+',
      recentVisits: [
        {
          bookingId: 'booking-1',
          startTime: '2026-06-01T10:00:00.000Z',
          status: 'confirmed',
          serviceName: 'Annual checkup',
          employeeName: 'Dr. Smith',
        },
      ],
      pendingResults: [
        {
          id: 'result-1',
          testName: 'CBC',
          status: 'Completed',
          orderId: 'order-1',
          bookingId: 'booking-1',
        },
      ],
      pendingOrders: [],
    })),
  };

  const deps = {
    businessRepo,
    customerRepo,
    patientChartService,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(EXPLAIN_PATIENT_CHART_PROMPTS.slice(0, 3))(
    'returns chart summary for prompt $id',
    async ({ prompt, customerName }) => {
      const result = await handleExplainPatientChartLogic(
        deps,
        'biz-1',
        'user-1',
        { customerName },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_patient_chart');
      expect(result.summary).toContain('Maria Lopez');
      expect(
        patientChartService.getChartSummaryForCustomer,
      ).toHaveBeenCalledWith('biz-1', 'cust-maria', 'user-1');
    },
  );

  it('blocks non-clinic businesses', async () => {
    businessRepo.findOne.mockResolvedValueOnce({
      id: 'biz-1',
      settings: { businessType: 'hair_salon' },
    });
    const result = await handleExplainPatientChartLogic(
      deps,
      'biz-1',
      'user-1',
      { customerName: 'Maria' },
      "Explain Maria's patient chart",
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('clinic');
  });

  it('clarifies when patient is missing', async () => {
    const result = await handleExplainPatientChartLogic(
      deps,
      'biz-1',
      'user-1',
      {},
      'Explain the patient chart',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });
});
