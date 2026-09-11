import {
  handleExplainResultStatusLogic,
  handleListMyTestResultsLogic,
} from './ai-consumer-clinic-test-results.logic.js';
import type { ClinicPatientReleasedResultView } from '../../common/utils/clinic-patient-released-result.util.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';
import {
  EXPLAIN_RESULT_STATUS_PROMPTS,
  LIST_MY_TEST_RESULTS_PROMPTS,
} from './ai-consumer-clinic-test-results.fixtures.js';

describe('ai-consumer-clinic-test-results.logic', () => {
  const businessRepo = {
    findOne: jest.fn(async () =>
      makeBusiness({ id: 'biz-1', settings: { businessType: 'clinic' } }),
    ),
  };
  const clinicTestResultsService = {
    // Required by the deps interface because the service forwards this object to
    // the track-lab-order-status logic, which calls it.
    listCustomerResultsForTracking: jest.fn(async () => []),
    // `measurements` is required by `ClinicPatientReleasedResultView` and was
    // absent — the field carrying the actual results, not just their summary flag.
    listReleasedResultsForCustomer: jest.fn(
      async (): Promise<ClinicPatientReleasedResultView[]> => [
        {
          id: 'result-1',
          orderId: 'order-1',
          bookingId: 'booking-1',
          status: 'Released',
          testName: 'CBC',
          measurementFlag: 'Normal',
          releasedAt: '2026-06-08T12:00:00.000Z',
          measurements: [],
        },
      ],
    ),
  };

  const deps = { businessRepo, clinicTestResultsService };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(LIST_MY_TEST_RESULTS_PROMPTS.slice(0, 3))(
    'lists released results for prompt $id',
    async ({ prompt }) => {
      const result = await handleListMyTestResultsLogic(
        deps,
        'biz-1',
        { sessionCustomerId: 'cust-1' },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('list_my_test_results');
      expect(result.summary).toContain('CBC');
    },
  );

  it('requires sign-in for list_my_test_results', async () => {
    const result = await handleListMyTestResultsLogic(
      deps,
      'biz-1',
      {},
      'Show my lab test results',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('Sign in');
  });

  it.each(EXPLAIN_RESULT_STATUS_PROMPTS.slice(0, 3))(
    'explains result status for prompt $id',
    async ({ prompt }) => {
      const result = await handleExplainResultStatusLogic(
        deps,
        'biz-1',
        { sessionCustomerId: 'cust-1' },
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_result_status');
    },
  );

  it('explains pending test by name for signed-in customer', async () => {
    clinicTestResultsService.listReleasedResultsForCustomer.mockResolvedValueOnce(
      [],
    );
    const result = await handleExplainResultStatusLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      "Why don't I see my CBC results yet?",
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('not in My Results yet');
  });

  it('blocks non-clinic businesses', async () => {
    businessRepo.findOne.mockResolvedValueOnce({
      id: 'biz-1',
      settings: { businessType: 'hair_salon' },
    });
    const result = await handleListMyTestResultsLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Show my lab test results',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('clinic');
  });

  it('returns not found when business is missing', async () => {
    businessRepo.findOne.mockResolvedValueOnce(null);
    const result = await handleListMyTestResultsLogic(
      deps,
      'missing',
      { sessionCustomerId: 'cust-1' },
      'Show my lab test results',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('Business not found');
  });

  it('surfaces service errors when loading released results', async () => {
    clinicTestResultsService.listReleasedResultsForCustomer.mockRejectedValueOnce(
      new Error('Service unavailable'),
    );
    const result = await handleListMyTestResultsLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Show my lab test results',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('Service unavailable');
  });
});
