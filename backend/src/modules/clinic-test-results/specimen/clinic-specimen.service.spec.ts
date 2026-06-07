import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ClinicSpecimenService } from './clinic-specimen.service.js';

describe('ClinicSpecimenService', () => {
  const specimenRepo = {
    findOne: jest.fn(),
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => ({
      ...v,
      id: v.id ?? 'spec-1',
      createdAt: new Date(),
    })),
    createQueryBuilder: jest.fn(),
  };
  const orderRepo = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const businessRepo = {
    findOne: jest.fn(),
  };

  const service = new ClinicSpecimenService(
    specimenRepo as any,
    orderRepo as any,
    businessRepo as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'clinic' },
    });
  });

  it('creates a specimen when missing for an order', async () => {
    orderRepo.findOne.mockResolvedValue({
      id: 'order-1',
      businessId: 'biz-1',
      customerId: 'cust-1',
      bookingId: 'booking-1',
    });
    specimenRepo.findOne.mockResolvedValue(null);

    const specimen = await service.ensureSpecimenForOrder('order-1');

    expect(specimen?.status).toBe('NotCollected');
    expect(specimenRepo.save).toHaveBeenCalled();
  });

  it('returns existing specimen for an order', async () => {
    orderRepo.findOne.mockResolvedValue({ id: 'order-1', businessId: 'biz-1' });
    specimenRepo.findOne.mockResolvedValue({ id: 'spec-existing' });

    await expect(service.ensureSpecimenForOrder('order-1')).resolves.toEqual({
      id: 'spec-existing',
    });
    expect(specimenRepo.save).not.toHaveBeenCalled();
  });

  it('lists collection view specimens with default statuses', async () => {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: 'spec-1',
          status: 'NotCollected',
          orderId: 'order-1',
          bookingId: 'booking-1',
          specimenIdentifier: null,
          collectedAt: null,
          createdAt: new Date('2026-06-01T10:00:00.000Z'),
          order: {
            displayNames: 'CBC',
            booking: {
              startTime: new Date('2026-06-01T12:00:00.000Z'),
              customer: { name: 'Jane Doe' },
              employee: { name: 'Dr Smith' },
            },
            items: [
              { testType: { service: { category: { name: 'Laboratory' } } } },
            ],
          },
          storageLocation: null,
          transportFolder: null,
        },
      ]),
    };
    specimenRepo.createQueryBuilder.mockReturnValue(qb);
    orderRepo.createQueryBuilder.mockReturnValue({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });

    const rows = await service.listSpecimens('biz-1', { view: 'collection' });

    expect(qb.andWhere).toHaveBeenCalledWith(
      'specimen.status IN (:...statuses)',
      { statuses: ['NotCollected', 'RecollectRequired'] },
    );
    expect(rows).toEqual([
      expect.objectContaining({
        id: 'spec-1',
        customerName: 'Jane Doe',
        department: 'Laboratory',
      }),
    ]);
  });

  it('blocks non-clinic tenants', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: { businessType: 'hair_salon' },
    });

    await expect(service.listSpecimens('biz-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('returns printable label data and assigns specimen identifiers', async () => {
    specimenRepo.findOne.mockResolvedValue({
      id: 'spec-1',
      businessId: 'biz-1',
      status: 'NotCollected',
      specimenIdentifier: null,
      collectedAt: null,
      order: {
        displayNames: 'CBC',
        booking: {
          startTime: new Date('2026-06-01T12:00:00.000Z'),
          customer: { name: 'Jane Doe' },
        },
        items: [
          { testType: { service: { category: { name: 'Laboratory' } } } },
        ],
      },
    });

    const label = await service.getSpecimenLabel('biz-1', 'spec-1');

    expect(label.barcodeValue).toBe('SP-SPEC1');
    expect(label.customerName).toBe('Jane Doe');
    expect(specimenRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ specimenIdentifier: 'SP-SPEC1' }),
    );
  });

  it('throws when label specimen is missing', async () => {
    specimenRepo.findOne.mockResolvedValue(null);

    await expect(
      service.getSpecimenLabel('biz-1', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
