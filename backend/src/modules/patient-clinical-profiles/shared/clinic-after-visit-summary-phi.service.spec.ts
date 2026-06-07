import {
  deriveBusinessPhiEncryptionKey,
  generateBusinessPhiEncryptionKeyMaterial,
} from '../../../common/utils/phi-encryption.util.js';
import { ClinicAfterVisitSummaryPhiService } from './clinic-after-visit-summary-phi.service.js';
import { PhiAccessAuditService } from '../../compliance/phi-access-audit.service.js';
import { PhiFieldService } from '../../compliance/phi-field.service.js';

describe('ClinicAfterVisitSummaryPhiService', () => {
  const masterKey = 'test-master-key';
  const material = generateBusinessPhiEncryptionKeyMaterial(masterKey);
  const businessKey = deriveBusinessPhiEncryptionKey(
    'biz-1',
    material,
    masterKey,
  );
  const business = {
    id: 'biz-1',
    settings: { hipaa: { enabled: true } },
  } as never;

  const phiFieldService = {
    isHipaaActiveForBusiness: jest.fn(() => true),
    resolveBusinessEncryptionKey: jest.fn(async () => businessKey),
  };
  const phiAccessAudit = new PhiAccessAuditService({
    create: jest.fn(),
    save: jest.fn(),
  } as never);
  const service = new ClinicAfterVisitSummaryPhiService(
    phiFieldService as unknown as PhiFieldService,
    phiAccessAudit,
  );

  it('masks summary when staff lacks phi access', async () => {
    const decrypted = await service.decryptSummaryForStaff(
      business,
      {
        id: 'avs-1',
        businessId: 'biz-1',
        description: 'secret summary',
      },
      { userId: 'user-1', role: 'staff', employeeId: 'emp-other' },
      { hasAssignedBooking: false },
    );

    expect(decrypted.description).toBeNull();
  });
});
