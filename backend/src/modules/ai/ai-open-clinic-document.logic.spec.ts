import type { PatientReleasedDocumentCustomerView } from '../../common/utils/patient-customer-document-access.util.js';
import {
  handleOpenClinicDocumentLogic,
  type OpenClinicDocumentLogicDeps,
} from './ai-open-clinic-document.logic.js';

const sampleDocument: PatientReleasedDocumentCustomerView = {
  id: 'doc-1',
  category: 'referral_letter',
  title: 'Cardiology referral',
  originalFileName: 'referral.pdf',
  mimeType: 'application/pdf',
  fileSizeBytes: 1200,
  downloadUrl: 'https://example.com/doc-1',
  createdAt: '2026-06-01T10:00:00.000Z',
};

function buildDeps(
  overrides: Partial<OpenClinicDocumentLogicDeps> = {},
): OpenClinicDocumentLogicDeps {
  return {
    patientDocumentsService: {
      getReleasedDocumentForCustomerAccount: jest
        .fn()
        .mockResolvedValue(sampleDocument),
    },
    ...overrides,
  } as OpenClinicDocumentLogicDeps;
}

describe('handleOpenClinicDocumentLogic', () => {
  it('opens a released document by id', async () => {
    const deps = buildDeps();
    const result = await handleOpenClinicDocumentLogic(deps, 'biz-1', {
      sessionCustomerId: 'cust-1',
      documentId: 'doc-1',
    });
    expect(result.success).toBe(true);
    expect(result.action).toBe('open_clinic_document');
    expect(result.summary).toContain('Cardiology referral');
    expect(
      deps.patientDocumentsService.getReleasedDocumentForCustomerAccount,
    ).toHaveBeenCalledWith('biz-1', 'cust-1', 'doc-1', 'cust-1');
  });

  it('requires sign-in', async () => {
    const result = await handleOpenClinicDocumentLogic(buildDeps(), 'biz-1', {
      documentId: 'doc-1',
    });
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('requires a documentId', async () => {
    const result = await handleOpenClinicDocumentLogic(buildDeps(), 'biz-1', {
      sessionCustomerId: 'cust-1',
    });
    expect(result.success).toBe(false);
    expect(result.details?.missing).toEqual(['documentId']);
  });

  it('surfaces a not-found error', async () => {
    const result = await handleOpenClinicDocumentLogic(
      buildDeps({
        patientDocumentsService: {
          getReleasedDocumentForCustomerAccount: jest
            .fn()
            .mockRejectedValue(new Error('Document not found')),
        },
      }),
      'biz-1',
      { sessionCustomerId: 'cust-1', documentId: 'missing' },
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('not found');
  });
});
