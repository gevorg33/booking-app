import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  handleConfigureTestReferenceRangeLogic,
  handleExplainPatientResultsLogic,
  handleListAbnormalResultsLogic,
  handleUploadPatientResultLogic,
} from './ai-clinic-test-result-ext.logic.js';

describe('ai-clinic-test-result-ext.logic (ai-cmd-ext-2.1–2.4)', () => {
  const bookingRepo = {
    find: jest.fn(async () => [
      {
        id: 'booking-1',
        businessId: 'biz-1',
        customerId: 'cust-maria',
        status: BookingStatus.CONFIRMED,
        customer: { id: 'cust-maria', name: 'Maria Lopez' },
      },
    ]),
  };
  const resultRepo = {
    find: jest.fn(async () => [
      {
        id: 'result-1',
        businessId: 'biz-1',
        customerId: 'cust-maria',
        orderId: 'order-abc123',
        status: 'Released',
        measurements: [
          {
            testType: { name: 'WBC' },
            value: '12.5',
            measurementFlag: 'H',
          },
          {
            testType: { name: 'glucose' },
            value: '95',
            measurementFlag: 'N',
          },
        ],
      },
      {
        id: 'result-2',
        businessId: 'biz-1',
        customerId: 'cust-other',
        orderId: 'order-xyz',
        status: 'Reviewed',
        measurements: [
          {
            testType: { name: 'sodium' },
            value: '130',
            measurementFlag: 'L',
          },
        ],
      },
    ]),
  };
  const deps = {
    bookingRepo,
    resultRepo,
    clinicTestResultService: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('upload requires order id and guides to lab UI', async () => {
    const missing = await handleUploadPatientResultLogic(
      deps,
      'biz-1',
      {},
      'Upload lab result',
    );
    expect(missing.success).toBe(false);

    const guided = await handleUploadPatientResultLogic(
      deps,
      'biz-1',
      {},
      'Upload lab result for order #abc123',
    );
    expect(guided.success).toBe(false);
    expect(guided.summary).toContain('abc123');
    expect(guided.summary).toContain('lab results UI');
  });

  it('requires patient or order for explain', async () => {
    const result = await handleExplainPatientResultsLogic(
      deps,
      'biz-1',
      {},
      'Explain lab results',
    );
    expect(result.success).toBe(false);
  });

  it('explains released results for named patient', async () => {
    const result = await handleExplainPatientResultsLogic(
      deps,
      'biz-1',
      {},
      "Explain Maria's lab results",
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('Maria');
    expect(result.summary).toContain('WBC');
    expect(bookingRepo.find).toHaveBeenCalled();
    expect(resultRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ customerId: 'cust-maria' }),
      }),
    );
  });

  it('explains by order id when provided', async () => {
    const result = await handleExplainPatientResultsLogic(
      deps,
      'biz-1',
      { orderId: 'order-abc123' },
      'Explain lab results for order #abc123',
    );
    expect(result.success).toBe(true);
    expect(resultRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ orderId: 'order-abc123' }),
      }),
    );
  });

  it('reports no released results when queue is empty', async () => {
    resultRepo.find.mockResolvedValueOnce([
      {
        id: 'result-3',
        businessId: 'biz-1',
        customerId: 'cust-maria',
        status: 'Reviewed',
        measurements: [],
      },
    ]);
    const result = await handleExplainPatientResultsLogic(
      deps,
      'biz-1',
      { customerName: 'Maria' },
      'Explain results for Maria',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('No released lab results');
  });

  it('configure reference range requires measurement code', async () => {
    const missing = await handleConfigureTestReferenceRangeLogic({});
    expect(missing.success).toBe(false);

    const guided = await handleConfigureTestReferenceRangeLogic({
      measurementCode: 'WBC',
      normalLow: '4',
      normalHigh: '11',
    });
    expect(guided.success).toBe(false);
    expect(guided.summary).toContain('WBC');
    expect(guided.summary).toContain('4');
    expect(guided.summary).toContain('11');
  });

  it('lists abnormal measurements', async () => {
    const result = await handleListAbnormalResultsLogic(deps, 'biz-1', {});
    expect(result.success).toBe(true);
    expect(result.summary).toContain('WBC');
    expect(result.summary).toContain('[H]');
    expect(result.details?.count).toBe(2);
  });

  it('lists abnormal results scoped to customer when provided', async () => {
    const result = await handleListAbnormalResultsLogic(
      deps,
      'biz-1',
      { customerName: 'Maria' },
    );
    expect(result.success).toBe(true);
    expect(bookingRepo.find).toHaveBeenCalled();
  });

  it('reports empty abnormal list when only normal flags exist', async () => {
    resultRepo.find.mockResolvedValueOnce([
      {
        id: 'result-4',
        businessId: 'biz-1',
        measurements: [
          {
            testType: { name: 'glucose' },
            value: '90',
            measurementFlag: 'N',
          },
        ],
      },
    ]);
    const result = await handleListAbnormalResultsLogic(deps, 'biz-1', {});
    expect(result.success).toBe(true);
    expect(result.summary).toContain('No abnormal measurements');
  });
});
