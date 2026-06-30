import { BadRequestException, NotFoundException } from '@nestjs/common';
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
            testType: { code: 'WBC', name: 'WBC' },
            value: '12.5',
            measurementFlag: 'H',
          },
          {
            testType: { code: 'glucose', name: 'glucose' },
            value: '95',
            measurementFlag: 'Normal',
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
            testType: { code: 'sodium', name: 'sodium' },
            value: '130',
            measurementFlag: 'L',
          },
        ],
      },
    ]),
  };
  const orderRepo = {
    findOne: jest.fn(async () => null),
    find: jest.fn(async () => []),
  };
  const deps = {
    bookingRepo,
    resultRepo,
    orderRepo,
    clinicTestResultService: {},
    clinicCatalogService: {
      updateReferenceRangeByCode: jest.fn(async () => ({
        id: 'type-wbc',
        code: 'WBC',
        normalLow: 4,
        normalHigh: 11,
      })),
    },
    clinicLabAccessService: {
      resolveStaffContext: jest.fn(async () => ({
        userId: 'user-1',
        membershipRole: 'owner',
        employeeId: null,
      })),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('upload requires order id and opens lab upload handoff', async () => {
    const missing = await handleUploadPatientResultLogic(
      deps,
      'biz-1',
      {},
      'Upload lab result',
    );
    expect(missing.success).toBe(false);

    orderRepo.findOne.mockResolvedValueOnce({
      id: 'order-abc123',
      businessId: 'biz-1',
      bookingId: 'booking-1',
    });
    const guided = await handleUploadPatientResultLogic(
      deps,
      'biz-1',
      {},
      'Upload lab result for order #abc123',
    );
    expect(guided.success).toBe(true);
    expect(guided.summary).toContain('abc123');
    expect(guided.summary).toContain('enter_test_result');
    expect(guided.details?.navigate).toEqual({
      path: '/dashboard/bookings',
      query: {
        bookingId: 'booking-1',
        labTab: 'results',
        orderId: 'order-abc123',
        uploadResult: '1',
      },
    });
    expect(guided.details?.uploadHandoff?.uploadApiPath).toContain(
      'order-abc123/result-attachments',
    );
  });

  it('upload handoff falls back to lab queue when order booking is unknown', async () => {
    const guided = await handleUploadPatientResultLogic(
      deps,
      'biz-1',
      { orderId: 'ord-42' },
      undefined,
    );
    expect(guided.success).toBe(true);
    expect(guided.details?.navigate).toEqual({
      path: '/dashboard/lab-queue',
      query: {
        orderId: 'ord-42',
        uploadResult: '1',
      },
    });
  });

  it('upload handoff resolves order id prefix from recent orders', async () => {
    orderRepo.findOne.mockResolvedValueOnce(null);
    orderRepo.find.mockResolvedValueOnce([
      { id: 'order-abc123-full', businessId: 'biz-1', bookingId: 'booking-9' },
    ]);
    const guided = await handleUploadPatientResultLogic(
      deps,
      'biz-1',
      { orderId: 'abc123' },
      undefined,
    );
    expect(guided.success).toBe(true);
    expect(guided.details?.orderId).toBe('order-abc123-full');
    expect(guided.details?.navigate?.query?.bookingId).toBe('booking-9');
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
    const missing = await handleConfigureTestReferenceRangeLogic(
      deps,
      'biz-1',
      'user-1',
      {},
    );
    expect(missing.success).toBe(false);

    const guided = await handleConfigureTestReferenceRangeLogic(
      deps,
      'biz-1',
      'user-1',
      {
        measurementCode: 'WBC',
        normalLow: '4',
        normalHigh: '11',
      },
    );
    expect(guided.success).toBe(true);
    expect(guided.summary).toContain('WBC');
    expect(guided.summary).toContain('4');
    expect(guided.summary).toContain('11');
    expect(deps.clinicCatalogService.updateReferenceRangeByCode).toHaveBeenCalledWith(
      'biz-1',
      'WBC',
      '4',
      '11',
      'owner',
    );
  });

  it('configure reference range requires bounds when measurement code is present', async () => {
    const result = await handleConfigureTestReferenceRangeLogic(
      deps,
      'biz-1',
      'user-1',
      { measurementCode: 'WBC' },
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('normalLow');
  });

  it('configure reference range requires business membership', async () => {
    deps.clinicLabAccessService.resolveStaffContext.mockRejectedValueOnce(
      new Error('not a member'),
    );
    const result = await handleConfigureTestReferenceRangeLogic(
      deps,
      'biz-1',
      'user-1',
      { measurementCode: 'WBC', normalLow: '4', normalHigh: '11' },
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('business member');
  });

  it('configure reference range surfaces catalog not-found and validation errors', async () => {
    deps.clinicCatalogService.updateReferenceRangeByCode
      .mockRejectedValueOnce(new NotFoundException('missing'))
      .mockRejectedValueOnce(new BadRequestException('invalid bounds'));

    const missing = await handleConfigureTestReferenceRangeLogic(
      deps,
      'biz-1',
      'user-1',
      { measurementCode: 'WBC', normalLow: '4', normalHigh: '11' },
    );
    expect(missing.success).toBe(false);
    expect(missing.summary).toContain('WBC');

    const invalid = await handleConfigureTestReferenceRangeLogic(
      deps,
      'biz-1',
      'user-1',
      { measurementCode: 'WBC', normalLow: '4', normalHigh: '11' },
    );
    expect(invalid.success).toBe(false);
    expect(invalid.summary).toContain('invalid bounds');
  });

  it('rethrows unexpected catalog errors from configure reference range', async () => {
    deps.clinicCatalogService.updateReferenceRangeByCode.mockRejectedValueOnce(
      new Error('database unavailable'),
    );
    await expect(
      handleConfigureTestReferenceRangeLogic(deps, 'biz-1', 'user-1', {
        measurementCode: 'WBC',
        normalLow: '4',
        normalHigh: '11',
      }),
    ).rejects.toThrow('database unavailable');
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
            testType: { code: 'glucose', name: 'glucose' },
            value: '90',
            measurementFlag: 'Normal',
          },
        ],
      },
    ]);
    const result = await handleListAbnormalResultsLogic(deps, 'biz-1', {});
    expect(result.success).toBe(true);
    expect(result.summary).toContain('No abnormal measurements');
  });
});
