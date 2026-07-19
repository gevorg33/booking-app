import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { ClinicTestOrder } from '../clinic-test-results/entities/clinic-test-order.entity.js';
import { ClinicTestResult } from '../clinic-test-results/entities/clinic-test-result.entity.js';
import { ClinicTestCatalogService } from '../clinic-test-results/catalog/clinic-test-catalog.service.js';
import { ClinicLabAccessService } from '../clinic-test-results/shared/clinic-lab-access.service.js';
import { ClinicLabChangeHistoryService } from '../clinic-test-results/shared/clinic-lab-change-history.service.js';
import { ClinicTestResultActionService } from '../clinic-test-results/test-result/clinic-test-result-action.service.js';
import { ClinicTestResultService } from '../clinic-test-results/test-result/clinic-test-result.service.js';
import { ClinicSpecimenService } from '../clinic-test-results/specimen/clinic-specimen.service.js';
import { ClinicSpecimenStatusService } from '../clinic-test-results/specimen/clinic-specimen-status.service.js';
import { AiClinicTestResultService } from './ai-clinic-test-result.service.js';

describe('AiClinicTestResultService integration (ai-cmd-clinic-6-gap-3.1)', () => {
  const businessId = 'biz-1';

  const bookingRepo = {
    find: jest.fn(async () => [
      {
        id: 'booking-1',
        businessId,
        customerId: 'cust-maria',
        status: BookingStatus.CONFIRMED,
        customer: { id: 'cust-maria', name: 'Maria Lopez' },
      },
    ]),
  };

  const defaultResults = [
    {
      id: 'result-1',
      businessId,
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
          measurementFlag: 'N',
        },
      ],
    },
    {
      id: 'result-2',
      businessId,
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
  ];

  const resultRepo = {
    find: jest.fn(async () => defaultResults),
  };

  const orderRepo = {
    findOne: jest.fn(async () => ({
      id: 'order-abc123',
      businessId,
      bookingId: 'booking-1',
    })),
    find: jest.fn(async () => []),
  };

  const businessRepo = { findOne: jest.fn() };
  const clinicTestResultService = {};
  const clinicTestResultActionService = {};
  const clinicLabAccessService = {
    resolveStaffContext: jest.fn(async () => ({
      userId: 'user-1',
      membershipRole: 'owner',
      employeeId: null,
    })),
  };
  const clinicCatalogService = {
    updateReferenceRangeByCode: jest.fn(async () => ({
      id: 'type-wbc',
      code: 'WBC',
      normalLow: 4,
      normalHigh: 11,
    })),
  };
  const clinicLabChangeHistoryService = {
    listResultChangeHistory: jest.fn(async () => []),
  };
  const specimenService = {
    listSpecimens: jest.fn(async () => []),
  };
  const specimenStatusService = {
    transitionSpecimenStatus: jest.fn(async () => ({})),
  };

  let service: AiClinicTestResultService;

  beforeEach(async () => {
    jest.clearAllMocks();
    resultRepo.find.mockImplementation(async () => defaultResults);

    const module = await Test.createTestingModule({
      providers: [
        AiClinicTestResultService,
        { provide: getRepositoryToken(Business), useValue: businessRepo },
        { provide: getRepositoryToken(Booking), useValue: bookingRepo },
        { provide: getRepositoryToken(ClinicTestResult), useValue: resultRepo },
        { provide: getRepositoryToken(ClinicTestOrder), useValue: orderRepo },
        { provide: ClinicTestResultService, useValue: clinicTestResultService },
        {
          provide: ClinicTestResultActionService,
          useValue: clinicTestResultActionService,
        },
        { provide: ClinicLabAccessService, useValue: clinicLabAccessService },
        { provide: ClinicTestCatalogService, useValue: clinicCatalogService },
        {
          provide: ClinicLabChangeHistoryService,
          useValue: clinicLabChangeHistoryService,
        },
        { provide: ClinicSpecimenService, useValue: specimenService },
        {
          provide: ClinicSpecimenStatusService,
          useValue: specimenStatusService,
        },
      ],
    }).compile();

    service = module.get(AiClinicTestResultService);
  });

  describe('handleUploadPatientResult', () => {
    it('returns clarify-style failure when orderId is missing', async () => {
      const result = await service.handleUploadPatientResult(
        businessId,
        {},
        'Upload lab result',
      );

      expect(result.success).toBe(false);
      expect(result.action).toBe('upload_patient_result');
      expect(result.summary).toContain('orderId');
    });

    it('returns upload handoff with navigate when orderId is resolved from prompt', async () => {
      const result = await service.handleUploadPatientResult(
        businessId,
        {},
        'Upload lab result for order #abc123',
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('upload_patient_result');
      expect(result.summary).toContain('abc123');
      expect(result.summary).toContain('enter_test_result');
      expect(result.details?.navigate?.path).toBe('/dashboard/bookings');
      expect(result.details?.uploadHandoff?.uploadApiPath).toContain(
        'result-attachments',
      );
    });

    it('accepts orderId from params without prompt parsing', async () => {
      orderRepo.findOne.mockResolvedValueOnce(null);
      orderRepo.find.mockResolvedValueOnce([
        { id: 'order-ord-42-full', businessId, bookingId: 'booking-2' },
      ]);
      const result = await service.handleUploadPatientResult(businessId, {
        orderId: 'ord-42',
      });

      expect(result.success).toBe(true);
      expect(result.summary).toContain('ord-42');
      expect(result.details?.orderId).toBe('order-ord-42-full');
    });
  });

  describe('handleExplainPatientResults', () => {
    it('requires patient name or order id', async () => {
      const result = await service.handleExplainPatientResults(
        businessId,
        {},
        'Explain lab results',
      );

      expect(result.success).toBe(false);
      expect(result.action).toBe('explain_patient_results');
      expect(result.summary).toContain('customerName');
    });

    it('loads released results for a named patient via booking repo', async () => {
      const result = await service.handleExplainPatientResults(
        businessId,
        {},
        "Explain Maria's lab results",
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_patient_results');
      expect(result.summary).toContain('Maria');
      expect(result.summary).toContain('WBC');
      expect(bookingRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ businessId }),
        }),
      );
      expect(resultRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: 'cust-maria' }),
        }),
      );
    });

    it('loads results by order id when provided in params', async () => {
      const result = await service.handleExplainPatientResults(
        businessId,
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

    it('reports empty released queue when only reviewed rows exist', async () => {
      resultRepo.find.mockResolvedValueOnce([
        {
          id: 'result-3',
          businessId,
          customerId: 'cust-maria',
          status: 'Reviewed',
          measurements: [],
        },
      ]);

      const result = await service.handleExplainPatientResults(
        businessId,
        { customerName: 'Maria' },
        'Explain results for Maria',
      );

      expect(result.success).toBe(true);
      expect(result.summary).toContain('No released lab results');
    });
  });

  describe('handleConfigureTestReferenceRange', () => {
    it('requires measurementCode', async () => {
      const result = await service.handleConfigureTestReferenceRange(
        businessId,
        'user-1',
        {},
      );

      expect(result.success).toBe(false);
      expect(result.action).toBe('configure_test_reference_range');
      expect(result.summary).toContain('measurementCode');
    });

    it('persists reference range when params are present', async () => {
      const result = await service.handleConfigureTestReferenceRange(
        businessId,
        'user-1',
        {
          measurementCode: 'WBC',
          normalLow: '4',
          normalHigh: '11',
        },
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('configure_test_reference_range');
      expect(result.summary).toContain('WBC');
      expect(result.summary).toContain('4');
      expect(result.summary).toContain('11');
      expect(
        clinicCatalogService.updateReferenceRangeByCode,
      ).toHaveBeenCalledWith(businessId, 'WBC', '4', '11', 'owner');
    });
  });

  describe('handleListAbnormalResults', () => {
    it('lists flagged measurements from result repo', async () => {
      const result = await service.handleListAbnormalResults(businessId, {});

      expect(result.success).toBe(true);
      expect(result.action).toBe('list_abnormal_results');
      expect(result.summary).toContain('WBC');
      expect(result.summary).toContain('[H]');
      expect(result.details?.count).toBeGreaterThan(0);
      expect(resultRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ businessId }),
        }),
      );
    });

    it('scopes abnormal list to customer when customerName is provided', async () => {
      const result = await service.handleListAbnormalResults(businessId, {
        customerName: 'Maria',
      });

      expect(result.success).toBe(true);
      expect(bookingRepo.find).toHaveBeenCalled();
      expect(resultRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: 'cust-maria' }),
        }),
      );
    });

    it('reports empty abnormal list when only normal flags exist', async () => {
      resultRepo.find.mockResolvedValueOnce([
        {
          id: 'result-4',
          businessId,
          measurements: [
            {
              testType: { code: 'glucose', name: 'glucose' },
              value: '90',
              measurementFlag: 'Normal',
            },
          ],
        },
      ]);

      const result = await service.handleListAbnormalResults(businessId, {});

      expect(result.success).toBe(true);
      expect(result.summary).toContain('No abnormal measurements');
    });
  });
});
