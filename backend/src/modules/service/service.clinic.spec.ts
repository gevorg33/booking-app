import { ServiceService } from './service.service.js';
import { PrepaymentMode } from './entities/service.entity.js';

describe('ServiceService clinic metadata', () => {
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
    {
      resolveActiveClinicDiagnosticCode: jest.fn(async () => null),
    } as any,
  );

  beforeEach(() => {
    services.length = 0;
    jest.clearAllMocks();
  });

  it('creates a lab test service with clinic metadata', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'Lipid panel',
      durationMinutes: 15,
      price: 35,
      serviceType: 'lab_test',
      requiresFasting: true,
      preparationNotes: 'Fast for 12 hours',
    });

    expect(created.clinic).toMatchObject({
      serviceType: 'lab_test',
      requiresFasting: true,
      preparationNotes: 'Fast for 12 hours',
    });
    expect(created.tour).toBeNull();
  });

  it('creates consultation and procedure clinic services', async () => {
    const consultation = await serviceService.create('biz-1', {
      name: 'Initial consultation',
      durationMinutes: 30,
      price: 0,
      serviceType: 'consultation',
    });
    const procedure = await serviceService.create('biz-1', {
      name: 'ECG',
      durationMinutes: 20,
      price: 45,
      serviceType: 'procedure',
    });

    expect(consultation.clinic?.serviceType).toBe('consultation');
    expect(procedure.clinic?.serviceType).toBe('procedure');
  });

  it('updates clinic fields without clearing localized names', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'CBC',
      durationMinutes: 10,
      price: 25,
      serviceType: 'lab_test',
      localizedNames: { en: ['CBC'] },
    });

    const updated = await serviceService.update(created.id, {
      requiresFasting: true,
      preparationNotes: 'No food 8 hours before',
    });

    expect(updated.clinic).toMatchObject({
      serviceType: 'lab_test',
      requiresFasting: true,
      preparationNotes: 'No food 8 hours before',
    });
    expect(updated.localizedNames).toEqual({ en: ['CBC'] });
  });

  it('clears fasting flag when requiresFasting is set false on update', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'Glucose test',
      durationMinutes: 10,
      price: 15,
      serviceType: 'lab_test',
      requiresFasting: true,
    });

    const updated = await serviceService.update(created.id, {
      requiresFasting: false,
    });

    expect(updated.clinic?.requiresFasting).toBeUndefined();
  });

  it('switches from clinic to tour clearing clinic metadata', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'Consult',
      durationMinutes: 30,
      price: 0,
      serviceType: 'consultation',
    });

    const updated = await serviceService.update(created.id, {
      serviceType: 'tour',
      maxGroupSize: 8,
    });

    expect(updated.tour?.serviceType).toBe('tour');
    expect(updated.clinic).toBeNull();
  });

  it('switches from tour to clinic clearing tour metadata', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'City walk',
      durationMinutes: 120,
      price: 50,
      serviceType: 'tour',
      maxGroupSize: 10,
    });

    const updated = await serviceService.update(created.id, {
      serviceType: 'consultation',
    });

    expect(updated.clinic?.serviceType).toBe('consultation');
    expect(updated.tour).toBeNull();
    expect(updated.metadata?.serviceType).toBe('consultation');
    expect(updated.metadata?.maxGroupSize).toBeUndefined();
  });

  it('clears clinic type when serviceType is empty on update', async () => {
    const created = await serviceService.create('biz-1', {
      name: 'Lipid panel',
      durationMinutes: 15,
      price: 35,
      serviceType: 'lab_test',
      requiresFasting: true,
    });

    const cleared = await serviceService.update(created.id, {
      serviceType: '',
    });

    expect(cleared.clinic).toBeNull();
    expect(cleared.metadata?.serviceType).toBeUndefined();
    expect(cleared.metadata?.requiresFasting).toBeUndefined();
  });
});
