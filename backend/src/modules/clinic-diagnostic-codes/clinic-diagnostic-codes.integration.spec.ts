import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { ClinicDiagnosticCodesService } from './clinic-diagnostic-codes.service.js';
import {
  CLINIC_DIAGNOSTIC_CODE_CREATE_PAYLOADS,
  CLINIC_DIAGNOSTIC_CODE_FIXTURES,
} from './clinic-diagnostic-codes.fixtures.js';

describe('ClinicDiagnosticCodesService (integration)', () => {
  const codeRepo = {
    createQueryBuilder: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({
      ...CLINIC_DIAGNOSTIC_CODE_FIXTURES[0],
      ...value,
      createdAt: CLINIC_DIAGNOSTIC_CODE_FIXTURES[0].createdAt,
      updatedAt: CLINIC_DIAGNOSTIC_CODE_FIXTURES[0].updatedAt,
    })),
    findOne: jest.fn(),
  };
  const employeeRepo = {
    findOne: jest.fn(async () => ({ id: 'emp-1' })),
  };
  const businessService = {
    ensureMember: jest.fn(),
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      settings: { businessType: 'polyclinic' },
    })),
  };

  const service = new ClinicDiagnosticCodesService(
    codeRepo as never,
    employeeRepo as never,
    businessService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.ensureMember.mockResolvedValue({
      role: MemberRole.MANAGER,
    });
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'polyclinic' },
    });
    codeRepo.findOne.mockResolvedValue(null);
  });

  it.each(CLINIC_DIAGNOSTIC_CODE_CREATE_PAYLOADS)(
    'creates catalog entry $id',
    async ({ dto }) => {
      const result = await service.createClinicDiagnosticCode(
        'biz-1',
        'user-1',
        dto,
      );

      expect(result.codeKind).toBe(dto.codeKind);
      expect(result.codeSystem).toBe(dto.codeSystem);
      expect(codeRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          businessId: 'biz-1',
          codeKind: dto.codeKind,
          codeSystem: dto.codeSystem,
          createdByEmployeeId: 'emp-1',
        }),
      );
    },
  );

  it('rejects duplicate kind/system/code combinations', async () => {
    codeRepo.findOne.mockResolvedValue(CLINIC_DIAGNOSTIC_CODE_FIXTURES[0]);

    await expect(
      service.createClinicDiagnosticCode(
        'biz-1',
        'user-1',
        CLINIC_DIAGNOSTIC_CODE_CREATE_PAYLOADS[0].dto,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects catalog management for non-lab-ops staff', async () => {
    businessService.ensureMember.mockResolvedValue({ role: MemberRole.STAFF });

    await expect(
      service.createClinicDiagnosticCode(
        'biz-1',
        'user-1',
        CLINIC_DIAGNOSTIC_CODE_CREATE_PAYLOADS[0].dto,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lists catalog entries with search and pagination', async () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest
        .fn()
        .mockResolvedValue([
          [
            CLINIC_DIAGNOSTIC_CODE_FIXTURES[0],
            CLINIC_DIAGNOSTIC_CODE_FIXTURES[1],
          ],
          2,
        ]),
    };
    codeRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.listClinicDiagnosticCodes('biz-1', 'user-1', {
      q: 'E11',
      codeKind: 'diagnostic',
      page: 1,
      pageSize: 25,
    });

    expect(result.totalItems).toBe(2);
    expect(result.items[0]?.code).toBe('E11.9');
    expect(qb.andWhere).toHaveBeenCalled();
  });

  it('updates description and deactivates catalog entries', async () => {
    codeRepo.findOne.mockResolvedValue({
      ...CLINIC_DIAGNOSTIC_CODE_FIXTURES[0],
    });

    const result = await service.updateClinicDiagnosticCode(
      'biz-1',
      'user-1',
      'code-diag-1',
      {
        description: 'Updated description',
        isActive: false,
      },
    );

    expect(result.isActive).toBe(false);
    expect(codeRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Updated description',
        isActive: false,
        updatedByEmployeeId: 'emp-1',
      }),
    );
  });

  it('rejects empty descriptions on update', async () => {
    codeRepo.findOne.mockResolvedValue({
      ...CLINIC_DIAGNOSTIC_CODE_FIXTURES[0],
    });

    await expect(
      service.updateClinicDiagnosticCode('biz-1', 'user-1', 'code-diag-1', {
        description: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns an empty gate for non-clinic businesses', async () => {
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'hair_salon' },
    });

    await expect(
      service.listClinicDiagnosticCodes('biz-1', 'user-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('loads a single catalog entry', async () => {
    codeRepo.findOne.mockResolvedValue(CLINIC_DIAGNOSTIC_CODE_FIXTURES[0]);

    const result = await service.getClinicDiagnosticCode(
      'biz-1',
      'user-1',
      'code-diag-1',
    );

    expect(result.id).toBe('code-diag-1');
  });

  it('resolves active catalog entries for downstream links', async () => {
    codeRepo.findOne.mockResolvedValue(CLINIC_DIAGNOSTIC_CODE_FIXTURES[0]);

    const summary = await service.resolveActiveClinicDiagnosticCode(
      'biz-1',
      'code-diag-1',
    );

    expect(summary?.code).toBe('E11.9');
  });

  it('throws when resolving a missing active catalog entry', async () => {
    codeRepo.findOne.mockResolvedValue(null);

    await expect(
      service.resolveActiveClinicDiagnosticCode('biz-1', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
