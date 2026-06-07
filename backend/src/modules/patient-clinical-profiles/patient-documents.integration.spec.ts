import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MemberRole } from '../business/entities/business-member.entity.js';
import {
  deriveBusinessPhiEncryptionKey,
  generateBusinessPhiEncryptionKeyMaterial,
} from '../../common/utils/phi-encryption.util.js';
import { PatientClinicalProfileAccessService } from './shared/patient-clinical-profile-access.service.js';
import { PatientDocumentPhiService } from './shared/patient-document-phi.service.js';
import { PatientDocumentsService } from './patient-documents.service.js';
import { PhiAccessAuditService } from '../compliance/phi-access-audit.service.js';
import { PhiFieldService } from '../compliance/phi-field.service.js';

describe('Patient chart documents (integration)', () => {
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
      settings: { businessType: 'clinic', hipaa: { enabled: true } },
    })),
    ensureMember: jest.fn(async () => ({ role: MemberRole.STAFF })),
  };
  const employeeRepo = {
    findOne: jest.fn(async () => ({ id: 'emp-provider', isActive: true })),
  };
  const customerRepo = {
    findOne: jest.fn(async () => ({ id: 'cust-1' })),
  };
  const bookingRepoAccess = {
    find: jest.fn(async () => [
      { employeeId: 'emp-provider', linkedEmployeeIds: [] },
    ]),
  };
  const storedDocuments: Array<Record<string, unknown>> = [];
  const documentRepo = {
    find: jest.fn(async (query: { where: Record<string, unknown> }) =>
      storedDocuments
        .filter((row) => {
          if (
            query.where.businessId &&
            row.businessId !== query.where.businessId
          ) {
            return false;
          }
          if (
            query.where.customerId &&
            row.customerId !== query.where.customerId
          ) {
            return false;
          }
          if (query.where.category && row.category !== query.where.category) {
            return false;
          }
          return true;
        })
        .map((row) => ({ ...row, uploadedBy: { name: 'Dr. Lee' } })),
    ),
    findOne: jest.fn(async (query: { where: Record<string, unknown> }) => {
      const document = storedDocuments.find((row) => {
        for (const [key, value] of Object.entries(query.where)) {
          if (row[key] !== value) return false;
        }
        return true;
      });
      return document ? { ...document, uploadedBy: { name: 'Dr. Lee' } } : null;
    }),
    create: jest.fn((value) => value),
    save: jest.fn(async (value: Record<string, unknown>) => {
      const saved = {
        ...value,
        id: value.id ?? `doc-${storedDocuments.length + 1}`,
        createdAt: value.createdAt ?? new Date('2026-06-05T10:00:00.000Z'),
        releasedToPatient: value.releasedToPatient ?? false,
      };
      const index = storedDocuments.findIndex((row) => row.id === saved.id);
      if (index >= 0) storedDocuments[index] = saved;
      else storedDocuments.push(saved);
      return saved;
    }),
  };
  const bookingRepo = {
    findOne: jest.fn(async () => ({
      id: 'booking-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
    })),
  };
  const uploadService = {
    uploadPatientChartDocument: jest.fn(async () => ({
      url: 'https://res.cloudinary.com/demo/raw/upload/lab.pdf',
      publicId: 'booking/biz-1/patient-documents/cust-1/lab',
      bytes: 1200,
      mimeType: 'application/pdf',
    })),
  };
  const phiFieldService = {
    isHipaaActiveForBusiness: jest.fn(() => true),
    resolveBusinessEncryptionKey: jest.fn(async () => businessKey),
  };
  const phiAccessAudit = new PhiAccessAuditService({
    create: jest.fn(),
    save: jest.fn(),
  } as never);
  const phiService = new PatientDocumentPhiService(
    phiFieldService as unknown as PhiFieldService,
    phiAccessAudit,
  );
  const accessService = new PatientClinicalProfileAccessService(
    businessService as any,
    employeeRepo as any,
    customerRepo as any,
    bookingRepoAccess as any,
  );
  const documentsService = new PatientDocumentsService(
    documentRepo as any,
    bookingRepo as any,
    businessService as any,
    accessService,
    phiService,
    uploadService as any,
  );

  const pdfFile = {
    originalname: 'cbc-results.pdf',
    mimetype: 'application/pdf',
    size: 1200,
    buffer: Buffer.from('pdf'),
  } as Express.Multer.File;

  beforeEach(() => {
    jest.clearAllMocks();
    storedDocuments.length = 0;
    businessService.ensureMember.mockResolvedValue({ role: MemberRole.STAFF });
    employeeRepo.findOne.mockResolvedValue({
      id: 'emp-provider',
      isActive: true,
    });
    bookingRepoAccess.find.mockResolvedValue([
      { employeeId: 'emp-provider', linkedEmployeeIds: [] },
    ]);
  });

  it('uploads and lists documents by category taxonomy', async () => {
    const access = await accessService.assertCustomerClinicalProfileAccess(
      'biz-1',
      'user-1',
      'cust-1',
    );

    const uploaded = await documentsService.uploadDocumentForCustomer(
      'biz-1',
      'cust-1',
      access,
      { category: 'lab_report', title: 'CBC March 2026' },
      pdfFile,
    );
    expect(uploaded.category).toBe('lab_report');
    expect(uploaded.originalFileName).toBe('cbc-results.pdf');
    expect(uploaded.downloadUrl).toContain('cloudinary.com');

    const list = await documentsService.listDocumentsForCustomer(
      'biz-1',
      'cust-1',
      access,
    );
    expect(list.documents).toHaveLength(1);
    expect(list.categories).toContain('imaging_report');
    expect(list.canUpload).toBe(true);

    const filtered = await documentsService.listDocumentsForCustomer(
      'biz-1',
      'cust-1',
      access,
      'referral_letter',
    );
    expect(filtered.documents).toHaveLength(0);

    const detail = await documentsService.getDocumentForCustomer(
      'biz-1',
      'cust-1',
      uploaded.id,
      access,
    );
    expect(detail.id).toBe(uploaded.id);
  });

  it('validates booking linkage on upload', async () => {
    const access = await accessService.assertCustomerClinicalProfileAccess(
      'biz-1',
      'user-1',
      'cust-1',
    );
    bookingRepo.findOne.mockResolvedValueOnce(null);
    await expect(
      documentsService.uploadDocumentForCustomer(
        'biz-1',
        'cust-1',
        access,
        { category: 'referral_letter', bookingId: 'missing-booking' },
        pdfFile,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks unassigned provider from chart documents', async () => {
    bookingRepoAccess.find.mockResolvedValueOnce([]);
    await expect(
      accessService.assertCustomerClinicalProfileAccess(
        'biz-1',
        'user-1',
        'cust-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns not found for missing document', async () => {
    const access = await accessService.assertCustomerClinicalProfileAccess(
      'biz-1',
      'user-1',
      'cust-1',
    );
    await expect(
      documentsService.getDocumentForCustomer(
        'biz-1',
        'cust-1',
        'missing-doc',
        access,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
