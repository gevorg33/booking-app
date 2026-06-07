import { ForbiddenException, NotFoundException } from '@nestjs/common';
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

describe('Patient customer documents (integration)', () => {
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
    ensureMember: jest.fn(async () => ({ role: MemberRole.MANAGER })),
  };
  const employeeRepo = { findOne: jest.fn(async () => null) };
  const customerRepo = { findOne: jest.fn(async () => ({ id: 'cust-1' })) };
  const bookingRepoAccess = { find: jest.fn(async () => []) };
  const storedDocuments: Array<Record<string, unknown>> = [
    {
      id: 'doc-released',
      businessId: 'biz-1',
      customerId: 'cust-1',
      category: 'lab_report',
      title: 'CBC report',
      originalFileName: 'cbc.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 1200,
      storagePublicId: 'public-id',
      storageUrl: 'https://res.cloudinary.com/demo/raw/upload/cbc.pdf',
      releasedToPatient: true,
      createdAt: new Date('2026-06-05T10:00:00.000Z'),
    },
    {
      id: 'doc-internal',
      businessId: 'biz-1',
      customerId: 'cust-1',
      category: 'referral_letter',
      title: 'Internal referral',
      originalFileName: 'referral.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 900,
      storagePublicId: 'public-id-2',
      storageUrl: 'https://res.cloudinary.com/demo/raw/upload/referral.pdf',
      releasedToPatient: false,
      createdAt: new Date('2026-06-04T10:00:00.000Z'),
    },
  ];
  const documentRepo = {
    find: jest.fn(async (query: { where: Record<string, unknown> }) =>
      storedDocuments.filter((row) => {
        for (const [key, value] of Object.entries(query.where)) {
          if (row[key] !== value) return false;
        }
        return true;
      }),
    ),
    findOne: jest.fn(
      async (query: { where: Record<string, unknown> }) =>
        storedDocuments.find((row) => {
          for (const [key, value] of Object.entries(query.where)) {
            if (row[key] !== value) return false;
          }
          return true;
        }) ?? null,
    ),
    save: jest.fn(async (value: Record<string, unknown>) => {
      const index = storedDocuments.findIndex((row) => row.id === value.id);
      if (index >= 0)
        storedDocuments[index] = { ...storedDocuments[index], ...value };
      return storedDocuments[index];
    }),
  };
  const bookingRepo = { findOne: jest.fn() };
  const uploadService = { uploadPatientChartDocument: jest.fn() };
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

  it('lists only released documents for the signed-in customer', async () => {
    const docs = await documentsService.listReleasedDocumentsForCustomerAccount(
      'biz-1',
      'cust-1',
      'user-customer-1',
    );
    expect(docs).toHaveLength(1);
    expect(docs[0]?.id).toBe('doc-released');
    expect(docs[0]?.downloadUrl).toContain('cloudinary.com');

    const detail = await documentsService.getReleasedDocumentForCustomerAccount(
      'biz-1',
      'cust-1',
      'doc-released',
      'user-customer-1',
    );
    expect(detail.title).toBe('CBC report');
  });

  it('blocks unreleased document detail for customers', async () => {
    await expect(
      documentsService.getReleasedDocumentForCustomerAccount(
        'biz-1',
        'cust-1',
        'doc-internal',
        'user-customer-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows staff to toggle patient release without exposing staff notes', async () => {
    const access = await accessService.assertCustomerClinicalProfileAccess(
      'biz-1',
      'user-manager',
      'cust-1',
    );
    const updated = await documentsService.updateDocumentReleaseForCustomer(
      'biz-1',
      'cust-1',
      'doc-internal',
      access,
      true,
    );
    expect(updated.releasedToPatient).toBe(true);

    const docs = await documentsService.listReleasedDocumentsForCustomerAccount(
      'biz-1',
      'cust-1',
      'user-customer-1',
    );
    expect(docs.some((doc) => doc.id === 'doc-internal')).toBe(true);
  });

  it('does not expose staff-note routes on the public customer surface', () => {
    const publicPaths = [
      'public/:slug/me/clinic-test-results',
      'public/:slug/me/clinic-documents',
    ];
    const staffNotePaths = [
      'businesses/:businessId/customers/:customerId/staff-notes',
    ];
    expect(publicPaths.some((path) => path.includes('staff-notes'))).toBe(
      false,
    );
    expect(staffNotePaths.some((path) => path.startsWith('public/'))).toBe(
      false,
    );
  });
});
