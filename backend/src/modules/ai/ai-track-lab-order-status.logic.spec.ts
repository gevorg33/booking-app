import { TRACK_LAB_ORDER_STATUS_PROMPTS } from './ai-track-lab-order-status.fixtures.js';
import { handleTrackLabOrderStatusLogic } from './ai-track-lab-order-status.logic.js';

describe('ai-track-lab-order-status.logic', () => {
  const businessRepo = {
    findOne: jest.fn(),
  };
  const clinicTestResultsService = {
    listCustomerResultsForTracking: jest.fn(),
  };
  const deps = { businessRepo, clinicTestResultsService };

  beforeEach(() => {
    jest.resetAllMocks();
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'clinic' },
    });
  });

  it('returns business not found', async () => {
    businessRepo.findOne.mockResolvedValue(null);

    const result = await handleTrackLabOrderStatusLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Are my results ready?',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toBe('Business not found.');
  });

  it('requires sign-in', async () => {
    const result = await handleTrackLabOrderStatusLogic(
      deps,
      'biz-1',
      {},
      'Are my results ready?',
    );
    expect(result.success).toBe(false);
    expect(result.action).toBe('track_lab_order_status');
    expect(result.details?.missing).toEqual(['customerId']);
  });

  it('returns tracking summary for signed-in customer', async () => {
    clinicTestResultsService.listCustomerResultsForTracking.mockResolvedValue([
      {
        id: 'r1',
        testName: 'CBC',
        status: 'Released',
        releasedAt: '2026-06-01T12:00:00.000Z',
        createdAt: '2026-05-30T12:00:00.000Z',
      },
    ]);

    const result = await handleTrackLabOrderStatusLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Are my results ready?',
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe('track_lab_order_status');
    expect(result.summary).toContain('ready');
    expect(
      clinicTestResultsService.listCustomerResultsForTracking,
    ).toHaveBeenCalledWith('biz-1', 'cust-1');
  });

  it('rejects non-track prompts', async () => {
    const result = await handleTrackLabOrderStatusLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Show my lab test results',
    );

    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('rejects non-clinic businesses', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'salon' },
    });

    const result = await handleTrackLabOrderStatusLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Are my results ready?',
    );

    expect(result.success).toBe(false);
    expect(result.details?.clinicOnly).toBe(true);
  });

  it('handles service errors', async () => {
    clinicTestResultsService.listCustomerResultsForTracking.mockRejectedValue(
      new Error('Database unavailable'),
    );

    const result = await handleTrackLabOrderStatusLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Are my results ready?',
    );

    expect(result.success).toBe(false);
    expect(result.summary).toContain('Database unavailable');
  });

  it('filters summary when named test has no matches', async () => {
    clinicTestResultsService.listCustomerResultsForTracking.mockResolvedValue([
      {
        id: 'r1',
        testName: 'CBC',
        status: 'Released',
        releasedAt: '2026-06-01T12:00:00.000Z',
        createdAt: '2026-05-30T12:00:00.000Z',
      },
    ]);

    const result = await handleTrackLabOrderStatusLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Is my lipid panel ready yet?',
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('No lab results found for lipid panel');
  });

  it.each(
    TRACK_LAB_ORDER_STATUS_PROMPTS.filter((row) => row.testName).slice(0, 2),
  )('filters by testName for $id', async ({ prompt, testName }) => {
    clinicTestResultsService.listCustomerResultsForTracking.mockResolvedValue([
      {
        id: 'r1',
        testName: 'CBC',
        status: 'Pending',
        releasedAt: null,
        createdAt: '2026-05-30T12:00:00.000Z',
      },
      {
        id: 'r2',
        testName: 'Lipid panel',
        status: 'Released',
        releasedAt: '2026-06-01T12:00:00.000Z',
        createdAt: '2026-05-29T12:00:00.000Z',
      },
    ]);

    const result = await handleTrackLabOrderStatusLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      prompt,
    );

    expect(result.success).toBe(true);
    expect(result.details?.testName).toBe(testName);
  });
});
