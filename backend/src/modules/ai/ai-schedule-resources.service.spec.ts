import { AiScheduleResourcesService } from './ai-schedule-resources.service.js';

describe('AiScheduleResourcesService (thin wrapper)', () => {
  const services = [
    { id: 's1', name: 'Massage' },
    { id: 's2', name: 'Facial' },
  ] as any[];

  const deps = {
    resourcesService: {
      listResources: jest.fn(async () => [{ id: 'r1', name: 'Room 1' }]),
      createResource: jest.fn(async (_b, dto) => ({ id: 'r-new', ...dto })),
      updateResource: jest.fn(async (_b, _id, dto) => ({
        id: 'r1',
        name: dto.name ?? 'Room 1',
      })),
      deactivateResource: jest.fn(),
      setServiceRequirements: jest.fn(async () => [
        { resourceId: 'r1', serviceId: 's1' },
      ]),
      findConflictingResourceIds: jest.fn(async () => ['r1']),
      getBookingResources: jest.fn(async () => [{ id: 'r1', name: 'Room 1' }]),
    },
    multiServiceBookingsService: {
      resolveSettingsFromBusiness: jest.fn(() => ({
        enabled: true,
        maxServiceCount: 3,
        schedulingMode: 'same_visit',
      })),
    },
    publicBookingService: {
      getMultiServiceBlockDaySlots: jest.fn(async () => ({
        slots: [{ startTime: '2026-06-05T10:00:00Z' }],
      })),
      suggestMultiServiceBlock: jest.fn(async () => ({
        startTime: '2026-06-05T10:00:00Z',
        employeeName: 'Anna',
      })),
      suggestPackageLineSlots: jest.fn(async () => ({
        lines: [{ serviceName: 'Massage' }],
      })),
      getMultiServiceBlockProviders: jest.fn(async () => ({
        providers: [{ id: 'e1', name: 'Anna' }],
      })),
    },
    businessRepo: {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        slug: 'salon',
        settings: {},
      })),
      save: jest.fn(async (b) => b),
    },
    serviceRepo: { find: jest.fn(async () => services) },
    resourceRepo: {
      find: jest.fn(async () => [{ id: 'r1', name: 'Room 1' }]),
      findOne: jest.fn(async () => ({ id: 'r1', name: 'Room 1' })),
    },
    bookingRepo: {
      find: jest.fn(async () => [
        {
          id: 'b1',
          employeeId: 'e1',
          startTime: new Date('2026-06-06T10:00:00Z'),
          status: 'confirmed',
        },
      ]),
    },
  };

  const service = new AiScheduleResourcesService(
    deps.resourcesService as any,
    deps.multiServiceBookingsService as any,
    deps.publicBookingService as any,
    deps.businessRepo as any,
    deps.serviceRepo as any,
    deps.resourceRepo as any,
    deps.bookingRepo as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it('rescues and decomposes schedule/resource intents', () => {
    expect(
      service.rescueScheduleResourceIntent(
        'List scheduling resources',
        'unknown',
      )?.action,
    ).toBe('list_scheduling_resources');
    expect(service.rescueScheduleResourceIntent('hello', 'unknown')).toBeNull();
    expect(
      service.isScheduleResourceCompound(
        'List scheduling resources and create room Alpha',
      ),
    ).toBe(true);
    expect(service.isScheduleResourceCompound('short')).toBe(false);
    expect(
      service.decomposeScheduleResourceCompound(
        'List scheduling resources and create room Alpha',
      ).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it('delegates all dashboard resource handlers', async () => {
    expect((await service.handleListSchedulingResources('biz-1')).success).toBe(
      true,
    );
    expect(
      (
        await service.handleCreateResource('biz-1', {
          resourceName: 'Treatment 2',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleUpdateResource('biz-1', {
          resourceName: 'Room 1',
          newName: 'Room Alpha',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleDeactivateResource('biz-1', {
          resourceName: 'Room 1',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleAssignResourceHours(
          'biz-1',
          { resourceName: 'Room 1', serviceName: 'Massage' },
          services,
        )
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleListResourceConflicts('biz-1', {
          startTime: '2026-06-05T10:00:00Z',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleExplainResourceConflict('biz-1', {
          startTime: '2026-06-05T10:00:00Z',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleConfigureMultiServiceSchedulingMode('biz-1', {
          schedulingMode: 'same_visit',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleBlockResourceUnavailable('biz-1', {
          resourceName: 'Room 1',
        })
      ).success,
    ).toBe(true);
  });

  it('delegates provider and availability handlers', async () => {
    expect(
      (
        await service.handleMyResourceAssignments('biz-1', {
          sessionEmployeeId: 'e1',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleCheckMultiServiceBlockAvailability('biz-1', {
          serviceNames: ['Massage'],
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleCheckPackageLineAvailability('biz-1', {
          packageId: 'pkg-1',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleEarliestSlotAllServices('biz-1', {
          serviceNames: ['Massage', 'Facial'],
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleProvidersAvailableLaterDays('biz-1', {
          serviceNames: ['Massage'],
          startTime: '2026-06-05T10:00:00Z',
        })
      ).success,
    ).toBe(true);
    expect(
      (
        await service.handleExplainWhyNoSlots('biz-1', {
          serviceNames: ['Massage', 'Facial'],
        })
      ).success,
    ).toBe(true);
  });

  it('delegates compound handler', async () => {
    expect(
      (
        await service.handleScheduleResourceCompound(
          'biz-1',
          'List scheduling resources and create room Treatment 2',
          {},
          services,
          'user-1',
        )
      ).success,
    ).toBe(true);
  });
});
