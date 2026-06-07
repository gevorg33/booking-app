import { BadRequestException } from '@nestjs/common';
import { ServiceService } from './service.service.js';
import { PrepaymentMode } from './entities/service.entity.js';
import { CLINIC_DIAGNOSTIC_CODE_LINK_FIXTURES } from '../../common/utils/clinic-diagnostic-code-link.fixtures.js';

describe('ServiceService clinic diagnostic code links', () => {
  const services: Array<Record<string, unknown>> = [];

  const serviceRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value: Record<string, unknown>) => {
      const id = (value.id as string) ?? `svc-${services.length + 1}`;
      const saved = {
        isActive: true,
        prepaymentMode: PrepaymentMode.NONE,
        metadata: {},
        ...value,
        id,
      };
      services.push(saved);
      return saved;
    }),
    find: jest.fn(async () => []),
    findOne: jest.fn(async ({ where }: { where: { id: string } }) => {
      const svc = services.find((s) => s.id === where.id);
      return svc ? { ...svc, category: null } : null;
    }),
    update: jest.fn(),
  };

  const clinicDiagnosticCodesService = {
    resolveActiveClinicDiagnosticCode: jest.fn(
      async (_businessId: string, codeId: string) => {
        if (codeId === CLINIC_DIAGNOSTIC_CODE_LINK_FIXTURES.labProcedure.id) {
          return CLINIC_DIAGNOSTIC_CODE_LINK_FIXTURES.labProcedure;
        }
        if (
          codeId ===
          CLINIC_DIAGNOSTIC_CODE_LINK_FIXTURES.consultationDiagnostic.id
        ) {
          return CLINIC_DIAGNOSTIC_CODE_LINK_FIXTURES.consultationDiagnostic;
        }
        return null;
      },
    ),
  };

  const serviceService = new ServiceService(
    serviceRepo as any,
    { findOne: jest.fn() } as any,
    {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        settings: { stripeConnect: { chargesEnabled: true } },
      })),
    } as any,
    { publish: jest.fn() } as any,
    { isConnectReady: jest.fn().mockReturnValue(true) } as any,
    clinicDiagnosticCodesService as any,
  );

  beforeEach(() => {
    services.length = 0;
    jest.clearAllMocks();
  });

  it('stores a procedure billing code on lab test services', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'Lipid panel',
      durationMinutes: 15,
      price: 35,
      serviceType: 'lab_test',
      clinicDiagnosticCodeId:
        CLINIC_DIAGNOSTIC_CODE_LINK_FIXTURES.labProcedure.id,
    });

    expect(created.metadata?.clinicDiagnosticCodeId).toBe(
      CLINIC_DIAGNOSTIC_CODE_LINK_FIXTURES.labProcedure.id,
    );
    expect(created.diagnosticCode).toEqual(
      CLINIC_DIAGNOSTIC_CODE_LINK_FIXTURES.labProcedure,
    );
  });

  it('stores a diagnostic billing code on consultation services', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'Initial consultation',
      durationMinutes: 30,
      price: 0,
      serviceType: 'consultation',
      clinicDiagnosticCodeId:
        CLINIC_DIAGNOSTIC_CODE_LINK_FIXTURES.consultationDiagnostic.id,
    });

    expect(created.diagnosticCode?.codeKind).toBe('diagnostic');
  });

  it('rejects mismatched billing code kinds for the service type', async () => {
    await expect(
      serviceService.create('biz-1', {
        name: 'Initial consultation',
        durationMinutes: 30,
        price: 0,
        serviceType: 'consultation',
        clinicDiagnosticCodeId:
          CLINIC_DIAGNOSTIC_CODE_LINK_FIXTURES.labProcedure.id,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('clears billing code metadata when clinic service type is removed', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'Lipid panel',
      durationMinutes: 15,
      price: 35,
      serviceType: 'lab_test',
      clinicDiagnosticCodeId:
        CLINIC_DIAGNOSTIC_CODE_LINK_FIXTURES.labProcedure.id,
    });

    const cleared = await serviceService.update(created.id, {
      serviceType: '',
    });

    expect(cleared.metadata?.clinicDiagnosticCodeId).toBeUndefined();
    expect(cleared.diagnosticCode).toBeNull();
  });
});
