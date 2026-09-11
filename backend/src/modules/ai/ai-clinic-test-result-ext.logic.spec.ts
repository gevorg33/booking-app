import { BadRequestException, NotFoundException } from '@nestjs/common';
import { makeService } from '../service/entities/service.test-fixture.js';
import { makeBooking } from '../booking/entities/booking.test-fixture.js';
import { makeClinicTestResult } from '../clinic-test-results/entities/clinic-test-result.test-fixture.js';
import { makeClinicTestOrder } from '../clinic-test-results/entities/clinic-test-order.test-fixture.js';
import type { ClinicTestOrder } from '../clinic-test-results/entities/clinic-test-order.entity.js';
import type { ClinicTestTypeView } from '../clinic-test-results/catalog/clinic-test-catalog.service.js';
import {
  makeClinicTestResultMeasurement,
  makeClinicTestType,
} from '../clinic-test-results/entities/clinic-test-catalog.test-fixture.js';
import { makeCustomer } from '../customer/entities/customer.test-fixture.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  handleConfigureTestReferenceRangeLogic,
  handleExplainPatientResultsLogic,
  handleListAbnormalResultsLogic,
  handleUploadPatientResultLogic,
} from './ai-clinic-test-result-ext.logic.js';
import type { ClinicTestResultExtLogicDeps } from './ai-clinic-test-result-ext.logic.js';

describe('ai-clinic-test-result-ext.logic (ai-cmd-ext-2.1–2.4)', () => {
  const bookingRepo = {
    find: jest.fn(async () => [
      makeBooking({
        id: 'booking-1',
        businessId: 'biz-1',
        customerId: 'cust-maria',
        status: BookingStatus.CONFIRMED,
        customer: makeCustomer({ id: 'cust-maria', name: 'Maria Lopez' }),
      }),
    ]),
  };
  const resultRepo = {
    find: jest.fn(async () => [
      makeClinicTestResult({
        id: 'result-1',
        businessId: 'biz-1',
        customerId: 'cust-maria',
        orderId: 'order-abc123',
        status: 'Released',
        measurements: [
          makeClinicTestResultMeasurement({
            testType: makeClinicTestType({ code: 'WBC' }),
            value: '12.5',
            measurementFlag: 'High',
          }),
          makeClinicTestResultMeasurement({
            testType: makeClinicTestType({ code: 'glucose' }),
            value: '95',
            measurementFlag: 'Normal',
          }),
        ],
      }),
      makeClinicTestResult({
        id: 'result-2',
        businessId: 'biz-1',
        customerId: 'cust-other',
        orderId: 'order-xyz',
        status: 'Reviewed',
        measurements: [
          makeClinicTestResultMeasurement({
            testType: makeClinicTestType({ code: 'sodium' }),
            value: '130',
            measurementFlag: 'Low',
          }),
        ],
      }),
    ]),
  };
  const orderRepo = {
    // Declared returns, not inferred: `async () => null` infers `Promise<null>`
    // and `async () => []` infers `Promise<never[]>`, both of which reject every
    // order the tests below resolve through them.
    findOne: jest.fn(async (): Promise<ClinicTestOrder | null> => null),
    find: jest.fn(async (): Promise<ClinicTestOrder[]> => []),
  };
  const deps = {
    bookingRepo,
    resultRepo,
    orderRepo,
    // `clinicTestResultService: {}` used to sit here — an empty object for a dep
    // the logic never reads. It has been removed from the interface entirely.
    //
    // These three were absent, so this object was not a stand-in for the type it
    // is passed as. Inert stubs: no test here reaches a handler that calls them,
    // and one that does will now fail on an assertion rather than on
    // `undefined is not a function`.
    clinicLabChangeHistoryService: {
      listResultChangeHistory: jest.fn(async () => []),
    } as unknown as ClinicTestResultExtLogicDeps['clinicLabChangeHistoryService'],
    specimenService: {
      listSpecimens: jest.fn(async () => []),
    } as unknown as ClinicTestResultExtLogicDeps['specimenService'],
    specimenStatusService: {
      transitionSpecimenStatus: jest.fn(),
    } as unknown as ClinicTestResultExtLogicDeps['specimenStatusService'],
    clinicCatalogService: {
      updateReferenceRangeByCode: jest.fn(
        async (): Promise<ClinicTestTypeView> => ({
          id: 'type-wbc',
          businessId: 'biz-1',
          code: 'WBC',
          title: 'WBC',
          price: 0,
          requiresFasting: false,
          isActive: true,
          normalLow: 4,
          normalHigh: 11,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
      ),
    },
    clinicLabAccessService: {
      // `assertResultLabAccess` / `assertSpecimenLabAccess` were absent — both are
      // required by the interface and both throw to deny. No-op stubs allow, which
      // is what these tests assume.
      assertResultLabAccess: jest.fn(),
      assertSpecimenLabAccess: jest.fn(),
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

    orderRepo.findOne.mockResolvedValueOnce(
      makeClinicTestOrder({
        id: 'order-abc123',
        businessId: 'biz-1',
        bookingId: 'booking-1',
      }),
    );
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
      makeClinicTestOrder({
        id: 'order-abc123-full',
        businessId: 'biz-1',
        bookingId: 'booking-9',
      }),
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
      makeClinicTestResult({
        id: 'result-3',
        businessId: 'biz-1',
        customerId: 'cust-maria',
        status: 'Reviewed',
        measurements: [],
      }),
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
    expect(
      deps.clinicCatalogService.updateReferenceRangeByCode,
    ).toHaveBeenCalledWith('biz-1', 'WBC', '4', '11', 'owner');
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
    // `[High]`, not `[H]`: `ClinicResultMeasurementFlag` is
    // Normal/Abnormal/High/Low/… — `'H'` is not a value the column can hold, so
    // this used to pin a rendering production could never produce. The
    // abnormality filter is `flag && flag !== 'Normal'`, so the count is
    // unaffected; only the rendered string changes.
    expect(result.summary).toContain('[High]');
    expect(result.details?.count).toBe(2);
  });

  it('lists abnormal results scoped to customer when provided', async () => {
    const result = await handleListAbnormalResultsLogic(deps, 'biz-1', {
      customerName: 'Maria',
    });
    expect(result.success).toBe(true);
    expect(bookingRepo.find).toHaveBeenCalled();
  });

  it('reports empty abnormal list when only normal flags exist', async () => {
    resultRepo.find.mockResolvedValueOnce([
      makeClinicTestResult({
        id: 'result-4',
        businessId: 'biz-1',
        measurements: [
          makeClinicTestResultMeasurement({
            testType: makeClinicTestType({ code: 'glucose' }),
            value: '90',
            measurementFlag: 'Normal',
          }),
        ],
      }),
    ]);
    const result = await handleListAbnormalResultsLogic(deps, 'biz-1', {});
    expect(result.success).toBe(true);
    expect(result.summary).toContain('No abnormal measurements');
  });
});
