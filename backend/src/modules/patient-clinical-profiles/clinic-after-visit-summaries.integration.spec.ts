import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  deriveBusinessPhiEncryptionKey,
  generateBusinessPhiEncryptionKeyMaterial,
} from '../../common/utils/phi-encryption.util.js';
import { ClinicAfterVisitSummariesService } from './clinic-after-visit-summaries.service.js';
import {
  CLINIC_AFTER_VISIT_SUMMARY_BOOKING,
  CLINIC_AFTER_VISIT_SUMMARY_FIXTURES,
  CLINIC_AFTER_VISIT_SUMMARY_UPSERT_SCENARIOS,
} from './clinic-after-visit-summaries.fixtures.js';
import { PatientClinicalProfileAccessService } from './shared/patient-clinical-profile-access.service.js';
import { ClinicAfterVisitSummaryPhiService } from './shared/clinic-after-visit-summary-phi.service.js';
import { PhiAccessAuditService } from '../compliance/phi-access-audit.service.js';
import { PhiFieldService } from '../compliance/phi-field.service.js';

describe('ClinicAfterVisitSummariesService (integration)', () => {
  const masterKey = 'test-master-key';
  const material = generateBusinessPhiEncryptionKeyMaterial(masterKey);
  const businessKey = deriveBusinessPhiEncryptionKey(
    'biz-1',
    material,
    masterKey,
  );

  const businessService = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      name: 'City Polyclinic',
      settings: {
        businessType: 'clinic',
        hipaa: { enabled: true },
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
      },
    })),
    ensureMember: jest.fn(async () => ({ role: MemberRole.STAFF })),
  };
  const employeeRepo = {
    findOne: jest.fn(async () => ({ id: 'emp-provider', isActive: true })),
  };
  const customerRepo = {
    findOne: jest.fn(async () => ({ id: 'cust-1', name: 'Jane Doe' })),
  };
  const bookingRepoAccess = {
    find: jest.fn(async () => [
      { employeeId: 'emp-provider', linkedEmployeeIds: [] },
    ]),
  };
  const summaryRepo = {
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({
      ...CLINIC_AFTER_VISIT_SUMMARY_FIXTURES[0],
      ...value,
      id: value.id ?? 'avs-1',
      createdAt: CLINIC_AFTER_VISIT_SUMMARY_FIXTURES[0].createdAt,
      updatedAt: CLINIC_AFTER_VISIT_SUMMARY_FIXTURES[0].updatedAt,
      author: { name: 'Dr. Lee' },
    })),
  };
  const bookingRepo = {
    findOne: jest.fn(async () => ({ ...CLINIC_AFTER_VISIT_SUMMARY_BOOKING })),
  };
  const phiFieldService = {
    isHipaaActiveForBusiness: jest.fn(() => true),
    resolveBusinessEncryptionKey: jest.fn(async () => businessKey),
  };
  const phiAccessAudit = new PhiAccessAuditService({
    create: jest.fn(),
    save: jest.fn(),
  } as never);
  const phiService = new ClinicAfterVisitSummaryPhiService(
    phiFieldService as unknown as PhiFieldService,
    phiAccessAudit,
  );
  const accessService = new PatientClinicalProfileAccessService(
    businessService as never,
    employeeRepo as never,
    customerRepo as never,
    bookingRepoAccess as never,
  );
  const service = new ClinicAfterVisitSummariesService(
    summaryRepo as never,
    bookingRepo as never,
    customerRepo as never,
    businessService as never,
    accessService,
    phiService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue({ role: MemberRole.STAFF });
    summaryRepo.findOne.mockResolvedValue(null);
  });

  it.each(CLINIC_AFTER_VISIT_SUMMARY_UPSERT_SCENARIOS)(
    'upserts after-visit summary $id',
    async ({ dto }) => {
      const access = await accessService.assertCustomerClinicalProfileAccess(
        'biz-1',
        'user-1',
        'cust-1',
      );

      const result = await service.upsertSummaryForBooking(
        'biz-1',
        'cust-1',
        'booking-1',
        access,
        dto,
      );

      expect(result.description).toBe(dto.description.trim());
      expect(result.canExportPdf).toBe(true);
      expect(summaryRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          businessId: 'biz-1',
          bookingId: 'booking-1',
          authorEmployeeId: 'emp-provider',
        }),
      );
    },
  );

  it('returns empty shell when summary does not exist yet', async () => {
    const access = await accessService.assertCustomerClinicalProfileAccess(
      'biz-1',
      'user-1',
      'cust-1',
    );

    const result = await service.getSummaryByBooking(
      'biz-1',
      'cust-1',
      'booking-1',
      access,
    );

    expect(result.description).toBeNull();
    expect(result.id).toBe('');
    expect(result.canAuthor).toBe(true);
  });

  it('exports printable pdf html for saved summary', async () => {
    summaryRepo.findOne.mockResolvedValue({
      ...CLINIC_AFTER_VISIT_SUMMARY_FIXTURES[0],
      description: CLINIC_AFTER_VISIT_SUMMARY_FIXTURES[0].description,
    });
    const access = await accessService.assertCustomerClinicalProfileAccess(
      'biz-1',
      'user-1',
      'cust-1',
    );

    const html = await service.exportPdfHtmlForBooking(
      'biz-1',
      'cust-1',
      'booking-1',
      access,
    );

    expect(html).toContain('After-Visit Summary');
    expect(html).toContain('Jane Doe');
    expect(html).toContain('Follow up in two weeks');
  });

  it('releases summary to patient when authored', async () => {
    summaryRepo.findOne.mockResolvedValue({
      ...CLINIC_AFTER_VISIT_SUMMARY_FIXTURES[0],
    });
    const access = await accessService.assertCustomerClinicalProfileAccess(
      'biz-1',
      'user-1',
      'cust-1',
    );

    const result = await service.updateSummaryReleaseForBooking(
      'biz-1',
      'cust-1',
      'booking-1',
      access,
      { releasedToPatient: true },
    );

    expect(result.releasedToPatient).toBe(true);
    expect(summaryRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ releasedToPatient: true }),
    );
  });

  it('rejects lab_test bookings', async () => {
    bookingRepo.findOne.mockResolvedValueOnce({
      ...CLINIC_AFTER_VISIT_SUMMARY_BOOKING,
      service: {
        name: 'CBC',
        metadata: { serviceType: 'lab_test' },
      },
    });
    const access = await accessService.assertCustomerClinicalProfileAccess(
      'biz-1',
      'user-1',
      'cust-1',
    );

    await expect(
      service.upsertSummaryForBooking('biz-1', 'cust-1', 'booking-1', access, {
        description: 'Should fail',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks unassigned provider from authoring', async () => {
    bookingRepoAccess.find.mockResolvedValueOnce([]);
    await expect(
      accessService.assertCustomerClinicalProfileAccess(
        'biz-1',
        'user-1',
        'cust-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires summary before pdf export', async () => {
    const access = await accessService.assertCustomerClinicalProfileAccess(
      'biz-1',
      'user-1',
      'cust-1',
    );

    await expect(
      service.exportPdfHtmlForBooking('biz-1', 'cust-1', 'booking-1', access),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects release when summary is missing', async () => {
    const access = await accessService.assertCustomerClinicalProfileAccess(
      'biz-1',
      'user-1',
      'cust-1',
    );

    await expect(
      service.updateSummaryReleaseForBooking(
        'biz-1',
        'cust-1',
        'booking-1',
        access,
        { releasedToPatient: true },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects release when summary has no content', async () => {
    summaryRepo.findOne.mockResolvedValue({
      ...CLINIC_AFTER_VISIT_SUMMARY_FIXTURES[0],
      description: '   ',
    });
    const access = await accessService.assertCustomerClinicalProfileAccess(
      'biz-1',
      'user-1',
      'cust-1',
    );

    await expect(
      service.updateSummaryReleaseForBooking(
        'biz-1',
        'cust-1',
        'booking-1',
        access,
        { releasedToPatient: true },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects authoring for unassigned provider with chart access', async () => {
    employeeRepo.findOne.mockResolvedValueOnce({
      id: 'emp-other',
      isActive: true,
    });
    bookingRepoAccess.find.mockResolvedValueOnce([
      { employeeId: 'emp-other', linkedEmployeeIds: [] },
    ]);
    const access = await accessService.assertCustomerClinicalProfileAccess(
      'biz-1',
      'user-1',
      'cust-1',
    );

    await expect(
      service.upsertSummaryForBooking('biz-1', 'cust-1', 'booking-1', access, {
        description: 'Not allowed',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects pdf export when summary content is empty after decrypt', async () => {
    summaryRepo.findOne.mockResolvedValue({
      ...CLINIC_AFTER_VISIT_SUMMARY_FIXTURES[0],
      description: '   ',
    });
    const access = await accessService.assertCustomerClinicalProfileAccess(
      'biz-1',
      'user-1',
      'cust-1',
    );

    await expect(
      service.exportPdfHtmlForBooking('biz-1', 'cust-1', 'booking-1', access),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects missing booking', async () => {
    bookingRepo.findOne.mockResolvedValueOnce(null);
    const access = await accessService.assertCustomerClinicalProfileAccess(
      'biz-1',
      'user-1',
      'cust-1',
    );

    await expect(
      service.getSummaryByBooking('biz-1', 'cust-1', 'missing-booking', access),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
