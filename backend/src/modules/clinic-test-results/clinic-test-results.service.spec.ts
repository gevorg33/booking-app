import { ForbiddenException } from '@nestjs/common';
import { ClinicTestResultsService } from './clinic-test-results.service.js';

describe('ClinicTestResultsService', () => {
  const businessService = {
    findOne: jest.fn(),
  };
  const orderRepo = { find: jest.fn() };
  const resultRepo = { find: jest.fn() };
  const observationRepo = { find: jest.fn() };
  const specimenRepo = { find: jest.fn() };

  const service = new ClinicTestResultsService(
    businessService as any,
    orderRepo as any,
    resultRepo as any,
    observationRepo as any,
    specimenRepo as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'clinic' },
    });
    observationRepo.find.mockResolvedValue([]);
  });

  it('returns disabled module status for non-clinic tenants', async () => {
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'hair_salon' },
    });
    await expect(service.getModuleStatus('biz-1')).resolves.toEqual({
      enabled: false,
      businessType: 'hair_salon',
    });
  });

  it('returns disabled module status when business type missing', async () => {
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {},
    });
    await expect(service.getModuleStatus('biz-1')).resolves.toEqual({
      enabled: false,
      businessType: null,
    });
  });

  it('returns module status for clinic tenants', async () => {
    await expect(service.getModuleStatus('biz-1')).resolves.toEqual({
      enabled: true,
      businessType: 'clinic',
    });
  });

  it('falls back to generic lab order title', async () => {
    orderRepo.find.mockResolvedValue([
      {
        id: 'order-2',
        status: 'NotCollected',
        displayNames: null,
      },
    ]);
    resultRepo.find.mockResolvedValue([]);
    specimenRepo.find.mockResolvedValue([]);

    await expect(
      service.listBookingLabSummaries('biz-1', 'booking-1'),
    ).resolves.toEqual([
      {
        id: 'order-2',
        testName: 'Lab order',
        orderStatus: 'NotCollected',
      },
    ]);
  });

  it('blocks non-clinic tenants', async () => {
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'hair_salon' },
    });
    await expect(
      service.listBookingLabSummaries('biz-1', 'booking-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('maps booking lab summaries from orders, results, and specimens', async () => {
    orderRepo.find.mockResolvedValue([
      {
        id: 'order-1',
        status: 'AwaitingResults',
        displayNames: 'CBC',
      },
    ]);
    resultRepo.find.mockResolvedValue([
      {
        orderId: 'order-1',
        status: 'Pending',
        measurementFlag: 'Normal',
      },
    ]);
    specimenRepo.find.mockResolvedValue([
      {
        orderId: 'order-1',
        status: 'Collected',
      },
    ]);

    await expect(
      service.listBookingLabSummaries('biz-1', 'booking-1'),
    ).resolves.toEqual([
      {
        id: 'order-1',
        testName: 'CBC',
        orderStatus: 'AwaitingResults',
        resultStatus: 'Pending',
        specimenStatus: 'Collected',
        measurementFlag: 'Normal',
      },
    ]);
  });

  it('returns empty summaries when booking has no orders', async () => {
    orderRepo.find.mockResolvedValue([]);
    await expect(
      service.listBookingLabSummaries('biz-1', 'booking-1'),
    ).resolves.toEqual([]);
  });

  it('returns released results with measurements and reference ranges', async () => {
    resultRepo.find.mockResolvedValue([
      {
        id: 'result-1',
        orderId: 'order-1',
        bookingId: 'booking-1',
        status: 'Released',
        measurementFlag: 'Normal',
        releasedAt: new Date('2026-06-01T12:00:00.000Z'),
        order: { displayNames: 'CBC' },
        testType: { title: 'Complete blood count' },
        measurements: [
          {
            id: 'm-1',
            value: '120',
            measurementFlag: 'High',
            testType: { title: 'Glucose', code: 'GLU' },
          },
        ],
      },
    ]);
    observationRepo.find.mockResolvedValue([
      {
        clinicTestResultMeasurementId: 'm-1',
        referenceRange: '70-100',
        unit: 'mg/dL',
        abnormalFlags: 'H',
        testName: 'Glucose',
      },
    ]);

    await expect(
      service.listReleasedResultsForCustomer('biz-1', 'cust-1'),
    ).resolves.toEqual([
      {
        id: 'result-1',
        orderId: 'order-1',
        bookingId: 'booking-1',
        status: 'Released',
        testName: 'Complete blood count',
        measurementFlag: 'High',
        releasedAt: '2026-06-01T12:00:00.000Z',
        measurements: [
          {
            id: 'm-1',
            name: 'Glucose',
            value: '120',
            unit: 'mg/dL',
            referenceRange: '70-100',
            measurementFlag: 'High',
          },
        ],
      },
    ]);
  });

  it('skips observation lookup when released results have no measurements', async () => {
    resultRepo.find.mockResolvedValue([
      {
        id: 'result-1',
        orderId: 'order-1',
        bookingId: 'booking-1',
        status: 'Released',
        measurementFlag: 'Normal',
        releasedAt: new Date('2026-06-01T12:00:00.000Z'),
        order: { displayNames: 'CBC' },
        testType: { title: 'Complete blood count' },
        measurements: [],
      },
    ]);

    await expect(
      service.listReleasedResultsForCustomer('biz-1', 'cust-1'),
    ).resolves.toEqual([
      {
        id: 'result-1',
        orderId: 'order-1',
        bookingId: 'booking-1',
        status: 'Released',
        testName: 'Complete blood count',
        measurementFlag: 'Normal',
        releasedAt: '2026-06-01T12:00:00.000Z',
        measurements: [],
      },
    ]);
    expect(observationRepo.find).not.toHaveBeenCalled();
  });
});
