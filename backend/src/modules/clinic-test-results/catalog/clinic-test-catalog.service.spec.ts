import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { MemberRole } from '../../business/entities/business-member.entity.js';
import { ClinicTestCatalogService } from './clinic-test-catalog.service.js';

describe('ClinicTestCatalogService', () => {
  const businessService = {
    findOne: jest.fn(),
  };
  const testTypeRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => ({
      ...v,
      id: v.id ?? 'type-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  };
  const testPanelRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => ({
      ...v,
      id: v.id ?? 'panel-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  };
  const panelItemRepo = {
    delete: jest.fn(),
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => v),
  };
  const serviceRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(async (v) => v),
  };

  const clinicDiagnosticCodesService = {
    resolveActiveClinicDiagnosticCode: jest.fn(
      async (_businessId: string, codeId: string | null) => {
        if (!codeId) return null;
        if (codeId === 'code-proc-1') {
          return {
            id: 'code-proc-1',
            codeKind: 'procedure',
            codeSystem: 'CPT',
            code: '80053',
            description: 'Comprehensive metabolic panel',
          };
        }
        return null;
      },
    ),
  };

  const catalog = new ClinicTestCatalogService(
    businessService as any,
    testTypeRepo as any,
    testPanelRepo as any,
    panelItemRepo as any,
    serviceRepo as any,
    clinicDiagnosticCodesService as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'polyclinic' },
    });
  });

  it('blocks catalog access for non-clinic tenants', async () => {
    businessService.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'hair_salon' },
    });
    await expect(catalog.listTestTypes('biz-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('creates a test type linked to a lab service', async () => {
    serviceRepo.findOne.mockResolvedValue({
      id: 'svc-1',
      businessId: 'biz-1',
      name: 'CBC',
      price: 25,
      metadata: { serviceType: 'lab_test', requiresFasting: true },
      category: { name: 'Laboratory' },
    });
    testTypeRepo.findOne.mockResolvedValue(null);
    testTypeRepo.save.mockImplementation(async (v) => ({
      ...v,
      id: 'type-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const created = await catalog.createTestType(
      'biz-1',
      { title: 'Complete blood count', serviceId: 'svc-1' },
      MemberRole.MANAGER,
    );

    expect(created.code).toBe('complete_blood_count');
    expect(created.requiresFasting).toBe(true);
    expect(created.department).toBe('Laboratory');
    expect(serviceRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ clinicTestTypeId: 'type-1' }),
      }),
    );
  });

  it('links a procedure billing code and mirrors it to the linked service metadata', async () => {
    serviceRepo.findOne.mockResolvedValue({
      id: 'svc-1',
      businessId: 'biz-1',
      name: 'CBC',
      price: 25,
      metadata: { serviceType: 'lab_test' },
      category: { name: 'Laboratory' },
    });
    testTypeRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 'type-2',
      businessId: 'biz-1',
      code: 'comprehensive_metabolic_panel',
      title: 'Comprehensive metabolic panel',
      clinicDiagnosticCodeId: 'code-proc-1',
      clinicDiagnosticCode: {
        id: 'code-proc-1',
        codeKind: 'procedure',
        codeSystem: 'CPT',
        code: '80053',
        description: 'Comprehensive metabolic panel',
      },
      serviceId: 'svc-1',
      service: { category: { name: 'Laboratory' } },
      price: 25,
      requiresFasting: false,
      preparationNotes: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    testTypeRepo.save.mockImplementation(async (v) => ({
      ...v,
      id: 'type-2',
      clinicDiagnosticCodeId: 'code-proc-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const created = await catalog.createTestType(
      'biz-1',
      {
        title: 'Comprehensive metabolic panel',
        serviceId: 'svc-1',
        clinicDiagnosticCodeId: 'code-proc-1',
      },
      MemberRole.MANAGER,
    );

    expect(created.clinicDiagnosticCodeId).toBe('code-proc-1');
    expect(created.diagnosticCode?.code).toBe('80053');
    expect(serviceRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          clinicTestTypeId: 'type-2',
          clinicDiagnosticCodeId: 'code-proc-1',
        }),
      }),
    );
  });

  it('rejects diagnostic billing codes on test types', async () => {
    clinicDiagnosticCodesService.resolveActiveClinicDiagnosticCode.mockResolvedValueOnce(
      {
        id: 'code-diag-1',
        codeKind: 'diagnostic',
        codeSystem: 'ICD-10-CM',
        code: 'E11.9',
        description: 'Type 2 diabetes mellitus without complications',
      },
    );

    await expect(
      catalog.createTestType(
        'biz-1',
        {
          title: 'CBC',
          clinicDiagnosticCodeId: 'code-diag-1',
        },
        MemberRole.MANAGER,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects catalog mutations for staff role', async () => {
    await expect(
      catalog.createTestType('biz-1', { title: 'CBC' }, MemberRole.STAFF),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('upserts panel items for active test types', async () => {
    testPanelRepo.findOne
      .mockResolvedValueOnce({ id: 'panel-1', businessId: 'biz-1' })
      .mockResolvedValueOnce({
        id: 'panel-1',
        businessId: 'biz-1',
        code: 'metabolic',
        title: 'Metabolic panel',
        price: 40,
        isActive: true,
        items: [
          {
            id: 'item-1',
            testTypeId: 'type-1',
            sortOrder: 0,
            testType: { id: 'type-1', title: 'Glucose', code: 'glucose' },
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    testTypeRepo.find.mockResolvedValue([
      { id: 'type-1', businessId: 'biz-1' },
    ]);

    const panel = await catalog.upsertPanelItems(
      'biz-1',
      'panel-1',
      { items: [{ testTypeId: 'type-1' }] },
      MemberRole.OWNER,
    );

    expect(panelItemRepo.delete).toHaveBeenCalledWith({ panelId: 'panel-1' });
    expect(panel.items).toHaveLength(1);
  });

  it('lists and loads test types with department labels', async () => {
    testTypeRepo.find.mockResolvedValue([
      {
        id: 'type-1',
        businessId: 'biz-1',
        code: 'cbc',
        title: 'CBC',
        price: 25,
        requiresFasting: true,
        isActive: true,
        service: { category: { name: 'Laboratory' } },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    testTypeRepo.findOne.mockResolvedValue({
      id: 'type-1',
      businessId: 'biz-1',
      code: 'cbc',
      title: 'CBC',
      price: 25,
      requiresFasting: true,
      isActive: true,
      service: { category: { name: 'Laboratory' } },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const list = await catalog.listTestTypes('biz-1');
    expect(list[0].department).toBe('Laboratory');

    const one = await catalog.getTestType('biz-1', 'type-1');
    expect(one.title).toBe('CBC');
  });

  it('creates and updates panels', async () => {
    testPanelRepo.findOne.mockResolvedValue(null);
    const created = await catalog.createPanel(
      'biz-1',
      { title: 'Metabolic panel', price: 40 },
      MemberRole.ADMIN,
    );
    expect(created.title).toBe('Metabolic panel');

    testPanelRepo.findOne.mockResolvedValue({
      id: 'panel-1',
      businessId: 'biz-1',
      code: 'metabolic_panel',
      title: 'Metabolic panel',
      price: 40,
      isActive: true,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const updated = await catalog.updatePanel(
      'biz-1',
      'panel-1',
      { title: 'Metabolic profile' },
      MemberRole.ADMIN,
    );
    expect(updated.title).toBe('Metabolic profile');
  });

  it('rejects duplicate test type codes and missing entities', async () => {
    testTypeRepo.findOne.mockResolvedValue({
      id: 'existing',
      businessId: 'biz-1',
    });
    await expect(
      catalog.createTestType('biz-1', { title: 'CBC' }, MemberRole.OWNER),
    ).rejects.toThrow('already exists');

    testTypeRepo.findOne.mockResolvedValue(null);
    await expect(catalog.getTestType('biz-1', 'missing')).rejects.toThrow(
      'not found',
    );

    serviceRepo.findOne.mockResolvedValue(null);
    await expect(
      catalog.createTestType(
        'biz-1',
        { title: 'CBC', serviceId: 'missing' },
        MemberRole.OWNER,
      ),
    ).rejects.toThrow('Linked service not found');
  });

  it('rejects panel item upsert when test type missing', async () => {
    testPanelRepo.findOne.mockResolvedValue({
      id: 'panel-1',
      businessId: 'biz-1',
    });
    testTypeRepo.find.mockResolvedValue([]);
    await expect(
      catalog.upsertPanelItems(
        'biz-1',
        'panel-1',
        { items: [{ testTypeId: 'missing' }] },
        MemberRole.OWNER,
      ),
    ).rejects.toThrow('not found');
  });

  it('updates test types and deactivates with service unlink', async () => {
    const baseType = {
      id: 'type-1',
      businessId: 'biz-1',
      code: 'cbc',
      title: 'CBC',
      price: 25,
      requiresFasting: true,
      isActive: true,
      serviceId: 'svc-1',
      service: { category: { name: 'Laboratory' } },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    testTypeRepo.findOne
      .mockResolvedValueOnce({ ...baseType })
      .mockResolvedValueOnce({
        ...baseType,
        title: 'Complete blood count',
        price: 30,
      });
    serviceRepo.findOne.mockResolvedValue({
      id: 'svc-1',
      businessId: 'biz-1',
      metadata: {},
    });
    testTypeRepo.save.mockImplementation(async (v) => v);

    const updated = await catalog.updateTestType(
      'biz-1',
      'type-1',
      { title: 'Complete blood count', price: 30 },
      MemberRole.MANAGER,
    );
    expect(updated.title).toBe('Complete blood count');

    testTypeRepo.findOne
      .mockResolvedValueOnce({
        ...baseType,
        title: 'Complete blood count',
        price: 30,
      })
      .mockResolvedValueOnce({
        ...baseType,
        title: 'Complete blood count',
        price: 30,
        isActive: false,
        serviceId: null,
      });
    const deactivated = await catalog.deactivateTestType(
      'biz-1',
      'type-1',
      MemberRole.MANAGER,
    );
    expect(deactivated.isActive).toBe(false);
  });

  it('lists panels and rejects duplicate panel codes', async () => {
    testPanelRepo.find.mockResolvedValue([
      {
        id: 'panel-1',
        businessId: 'biz-1',
        code: 'metabolic',
        title: 'Metabolic panel',
        price: 40,
        isActive: true,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const panels = await catalog.listPanels('biz-1');
    expect(panels).toHaveLength(1);

    testPanelRepo.findOne.mockResolvedValue({
      id: 'existing',
      businessId: 'biz-1',
    });
    await expect(
      catalog.createPanel(
        'biz-1',
        { title: 'Metabolic panel' },
        MemberRole.OWNER,
      ),
    ).rejects.toThrow('already exists');
  });

  it('rejects linking a service already tied to another test type', async () => {
    testTypeRepo.findOne.mockResolvedValue(null);
    serviceRepo.findOne
      .mockResolvedValueOnce({
        id: 'svc-1',
        businessId: 'biz-1',
        name: 'CBC',
        price: 25,
        metadata: { serviceType: 'lab_test' },
        category: { name: 'Laboratory' },
      })
      .mockResolvedValueOnce({
        id: 'svc-1',
        businessId: 'biz-1',
        metadata: { clinicTestTypeId: 'other-type' },
      });
    testTypeRepo.save.mockImplementation(async (v) => ({
      ...v,
      id: 'type-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await expect(
      catalog.createTestType(
        'biz-1',
        { title: 'CBC', serviceId: 'svc-1' },
        MemberRole.OWNER,
      ),
    ).rejects.toThrow('already linked');
  });

  it('seeds test types and panels from the clinic playbook', async () => {
    serviceRepo.find.mockResolvedValue([
      {
        id: 'svc-cbc',
        businessId: 'biz-1',
        name: 'Complete blood count',
        price: 25,
        metadata: { serviceType: 'lab_test' },
        category: { name: 'Laboratory' },
      },
      {
        id: 'svc-lipid',
        businessId: 'biz-1',
        name: 'Lipid panel',
        price: 35,
        metadata: { serviceType: 'lab_test', requiresFasting: true },
        category: { name: 'Laboratory' },
      },
      {
        id: 'svc-thyroid',
        businessId: 'biz-1',
        name: 'Thyroid panel',
        price: 40,
        metadata: { serviceType: 'lab_test' },
        category: { name: 'Laboratory' },
      },
    ]);
    testTypeRepo.find.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: 'type-complete_blood_count',
        businessId: 'biz-1',
        code: 'complete_blood_count',
        title: 'Complete blood count',
      },
      {
        id: 'type-lipid_panel',
        businessId: 'biz-1',
        code: 'lipid_panel',
        title: 'Lipid panel',
      },
      {
        id: 'type-thyroid_panel',
        businessId: 'biz-1',
        code: 'thyroid_panel',
        title: 'Thyroid panel',
      },
    ]);
    testPanelRepo.find.mockResolvedValue([]);
    testTypeRepo.findOne.mockResolvedValue(null);
    testTypeRepo.save.mockImplementation(async (v) => ({
      ...v,
      id: `type-${v.code ?? v.title}`,
      code: v.code ?? v.title,
      title: v.title,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    serviceRepo.findOne.mockImplementation(async ({ where }) => {
      const services = [
        {
          id: 'svc-cbc',
          businessId: 'biz-1',
          name: 'Complete blood count',
          price: 25,
          metadata: { serviceType: 'lab_test' },
          category: { name: 'Laboratory' },
        },
        {
          id: 'svc-lipid',
          businessId: 'biz-1',
          name: 'Lipid panel',
          price: 35,
          metadata: { serviceType: 'lab_test', requiresFasting: true },
          category: { name: 'Laboratory' },
        },
        {
          id: 'svc-thyroid',
          businessId: 'biz-1',
          name: 'Thyroid panel',
          price: 40,
          metadata: { serviceType: 'lab_test' },
          category: { name: 'Laboratory' },
        },
      ];
      return services.find((svc) => svc.id === where.id) ?? null;
    });
    testPanelRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 'panel-1',
      businessId: 'biz-1',
      code: 'laboratory_panel',
      title: 'Laboratory panel',
      price: 0,
      isActive: true,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    testPanelRepo.save.mockImplementation(async (v) => ({
      ...v,
      id: 'panel-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const summary = await catalog.seedFromPlaybook('biz-1', MemberRole.OWNER);

    expect(summary.testTypesCreated).toBe(3);
    expect(summary.panelsCreated).toBe(1);
    expect(summary.unmatchedServiceNames).toEqual([]);
  });

  it('imports catalog rows from CSV and reports unmatched services', async () => {
    serviceRepo.find.mockResolvedValue([
      {
        id: 'svc-cbc',
        businessId: 'biz-1',
        name: 'CBC',
        price: 25,
        metadata: { serviceType: 'lab_test' },
        category: { name: 'Laboratory' },
      },
    ]);
    testTypeRepo.find.mockResolvedValue([]);
    testPanelRepo.find.mockResolvedValue([]);
    testTypeRepo.findOne.mockResolvedValue(null);
    testTypeRepo.save.mockImplementation(async (v) => ({
      ...v,
      id: 'type-import',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    serviceRepo.findOne.mockResolvedValue({
      id: 'svc-cbc',
      businessId: 'biz-1',
      name: 'CBC',
      price: 25,
      metadata: { serviceType: 'lab_test' },
      category: { name: 'Laboratory' },
    });

    const summary = await catalog.importFromCsv(
      'biz-1',
      'kind,title,code,serviceName\n' +
        'type,Vitamin D,vitamin_d,Missing service\n' +
        'type,Vitamin D,vitamin_d,CBC',
      MemberRole.MANAGER,
    );

    expect(summary.testTypesCreated).toBe(1);
    expect(summary.testTypesSkipped).toBe(1);
    expect(summary.unmatchedServiceNames).toContain('Missing service');
  });
});
