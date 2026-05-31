import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { SchedulingResourcesService } from './scheduling-resources.service.js';

describe('SchedulingResourcesService', () => {
  const resourceRepo = { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), create: jest.fn() };
  const requirementRepo = { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), create: jest.fn(), delete: jest.fn() };
  const bookingResourceRepo = { find: jest.fn(), delete: jest.fn(), createQueryBuilder: jest.fn() };
  const bookingRepo = {};
  const serviceRepo = { findOne: jest.fn() };

  const service = new SchedulingResourcesService(
    resourceRepo as any,
    requirementRepo as any,
    bookingResourceRepo as any,
    bookingRepo as any,
    serviceRepo as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    resourceRepo.create.mockImplementation((v) => v);
    resourceRepo.save.mockImplementation(async (v) => ({ id: 'res-1', ...v }));
    requirementRepo.create.mockImplementation((v) => v);
    requirementRepo.save.mockImplementation(async (v) => v);
    serviceRepo.findOne.mockResolvedValue({ id: 'svc-1', businessId: 'biz-1' });
  });

  it('lists active resources', async () => {
    resourceRepo.find.mockResolvedValue([{ id: 'r1' }]);
    await expect(service.listResources('biz-1')).resolves.toEqual([{ id: 'r1' }]);
  });

  it('creates resource', async () => {
    const created = await service.createResource('biz-1', { name: 'Room A', resourceType: 'room' });
    expect(created.name).toBe('Room A');
  });

  it('sets service requirements', async () => {
    resourceRepo.find.mockResolvedValue([{ id: 'res-1' }]);
    requirementRepo.delete.mockResolvedValue(undefined);
    requirementRepo.save.mockResolvedValue([{ serviceId: 'svc-1', resourceId: 'res-1' }]);

    await service.setServiceRequirements('biz-1', 'svc-1', ['res-1']);
    expect(requirementRepo.delete).toHaveBeenCalledWith({ businessId: 'biz-1', serviceId: 'svc-1' });
  });

  it('rejects invalid resources on requirements', async () => {
    resourceRepo.find.mockResolvedValue([]);
    await expect(
      service.setServiceRequirements('biz-1', 'svc-1', ['bad']),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('asserts resource availability', async () => {
    resourceRepo.find.mockResolvedValue([{ id: 'res-1', name: 'Room A' }]);
    jest.spyOn(service, 'findConflictingResourceIds').mockResolvedValue([]);

    await expect(
      service.assertResourcesAvailable(
        'biz-1',
        ['res-1'],
        new Date('2026-06-01T10:00:00Z'),
        new Date('2026-06-01T11:00:00Z'),
      ),
    ).resolves.toBeUndefined();
  });

  it('throws when resources conflict', async () => {
    resourceRepo.find.mockResolvedValue([{ id: 'res-1', name: 'Room A' }]);
    jest.spyOn(service, 'findConflictingResourceIds').mockResolvedValue(['res-1']);

    await expect(
      service.assertResourcesAvailable(
        'biz-1',
        ['res-1'],
        new Date('2026-06-01T10:00:00Z'),
        new Date('2026-06-01T11:00:00Z'),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('finds conflicts via query builder', async () => {
    const qb = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          resourceId: 'res-1',
          bookingId: 'b1',
          startTime: new Date('2026-06-01T10:00:00Z'),
          endTime: new Date('2026-06-01T11:00:00Z'),
        },
      ]),
    };
    bookingResourceRepo.createQueryBuilder.mockReturnValue(qb);

    const conflicts = await service.findConflictingResourceIds(
      'biz-1',
      ['res-1'],
      new Date('2026-06-01T10:30:00Z'),
      new Date('2026-06-01T11:30:00Z'),
    );
    expect(conflicts).toEqual(['res-1']);
    expect(bookingResourceRepo.createQueryBuilder).toHaveBeenCalled();
  });

  it('excludes booking id from conflict search', async () => {
    const qb = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };
    bookingResourceRepo.createQueryBuilder.mockReturnValue(qb);

    await service.findConflictingResourceIds(
      'biz-1',
      ['res-1'],
      new Date('2026-06-01T10:30:00Z'),
      new Date('2026-06-01T11:30:00Z'),
      'booking-1',
    );
    expect(qb.andWhere).toHaveBeenCalledWith('booking.id != :excludeBookingId', {
      excludeBookingId: 'booking-1',
    });
  });

  it('assigns resources to booking in transaction', async () => {
    const manager = {
      create: jest.fn().mockImplementation((_entity, v) => v),
      save: jest.fn().mockImplementation(async (_entity, v) => v),
    };
    await service.assignToBooking(manager as any, 'booking-1', ['res-1', 'res-2', 'res-1']);
    expect(manager.save).toHaveBeenCalledTimes(2);
  });

  it('returns required resource ids for service', async () => {
    requirementRepo.find.mockResolvedValue([{ resourceId: 'res-1' }, { resourceId: 'res-2' }]);
    await expect(service.getRequiredResourceIds('biz-1', 'svc-1')).resolves.toEqual([
      'res-1',
      'res-2',
    ]);
  });

  it('updates resource', async () => {
    resourceRepo.findOne.mockResolvedValue({ id: 'res-1', businessId: 'biz-1', name: 'Old' });
    resourceRepo.save.mockImplementation(async (v) => v);
    const updated = await service.updateResource('biz-1', 'res-1', { name: 'New' });
    expect(updated.name).toBe('New');
  });

  it('deactivates resource', async () => {
    resourceRepo.findOne.mockResolvedValue({ id: 'res-1', businessId: 'biz-1', isActive: true });
    resourceRepo.save.mockImplementation(async (v) => v);
    const updated = await service.deactivateResource('biz-1', 'res-1');
    expect(updated.isActive).toBe(false);
  });

  it('throws when resource missing on update', async () => {
    resourceRepo.findOne.mockResolvedValue(null);
    await expect(service.updateResource('biz-1', 'res-x', { name: 'X' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('gets booking resources', async () => {
    bookingResourceRepo.find.mockResolvedValue([{ id: 'br-1' }]);
    await expect(service.getBookingResources('booking-1')).resolves.toEqual([{ id: 'br-1' }]);
  });

  it('releases booking resources', async () => {
    bookingResourceRepo.delete.mockResolvedValue(undefined);
    await service.releaseBookingResources('booking-1');
    expect(bookingResourceRepo.delete).toHaveBeenCalledWith({ bookingId: 'booking-1' });
  });

  it('clears requirements when empty list passed', async () => {
    requirementRepo.delete.mockResolvedValue(undefined);
    await expect(service.setServiceRequirements('biz-1', 'svc-1', [])).resolves.toEqual([]);
  });

  it('gets service requirements', async () => {
    requirementRepo.find.mockResolvedValue([{ resourceId: 'res-1' }]);
    await expect(service.getServiceRequirements('biz-1', 'svc-1')).resolves.toHaveLength(1);
  });

  it('throws when service missing on requirements', async () => {
    serviceRepo.findOne.mockResolvedValue(null);
    await expect(service.getServiceRequirements('biz-1', 'svc-x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects invalid resources on availability check', async () => {
    resourceRepo.find.mockResolvedValue([]);
    await expect(
      service.assertResourcesAvailable(
        'biz-1',
        ['bad'],
        new Date('2026-06-01T10:00:00Z'),
        new Date('2026-06-01T11:00:00Z'),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
