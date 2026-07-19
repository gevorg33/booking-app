import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AiScheduleResourcesService } from './ai-schedule-resources.service.js';
import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import { Business } from '../business/entities/business.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { SchedulingResource } from '../resources/entities/scheduling-resource.entity.js';
import { SchedulingResourcesService } from '../resources/scheduling-resources.service.js';
import { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';
import { PublicBookingService } from '../public-booking/public-booking.service.js';

describe('Sprint 29 schedule & resources AI scenarios', () => {
  const services = [
    { id: 's1', name: 'Massage' },
    { id: 's2', name: 'Facial' },
  ] as any[];

  const resourcesService = {
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
  };
  const multiServiceBookingsService = {
    resolveSettingsFromBusiness: jest.fn(() => ({
      enabled: true,
      maxServiceCount: 3,
      schedulingMode: 'same_visit',
    })),
  };
  const publicBookingService = {
    getMultiServiceBlockDaySlots: jest.fn(async () => ({
      slots: [{ startTime: '2026-06-05T10:00:00Z' }],
    })),
    suggestMultiServiceBlock: jest.fn(async () => ({
      startTime: '2026-06-05T10:00:00Z',
      employeeName: 'Anna',
    })),
    suggestPackageLineSlots: jest.fn(async () => ({
      lines: [{ serviceName: 'Massage' }, { serviceName: 'Facial' }],
    })),
    getMultiServiceBlockProviders: jest.fn(async () => ({
      providers: [{ id: 'e1', name: 'Anna' }],
    })),
  };
  const businessRepo = {
    findOne: jest.fn(async () => ({
      id: 'biz-1',
      slug: 'salon',
      settings: {},
    })),
    save: jest.fn(async (b) => b),
  };
  const serviceRepo = { find: jest.fn(async () => services) };
  const resourceRepo = {
    find: jest.fn(async () => [{ id: 'r1', name: 'Room 1' }]),
    findOne: jest.fn(async () => ({ id: 'r1', name: 'Room 1' })),
  };
  const bookingRepo = {
    find: jest.fn(async () => [
      {
        id: 'b1',
        businessId: 'biz-1',
        employeeId: 'e1',
        startTime: new Date('2026-06-06T10:00:00Z'),
        status: 'confirmed',
      },
    ]),
  };

  let scheduleResources: AiScheduleResourcesService;
  let rescue: AiIntentRescueService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AiScheduleResourcesService,
        AiIntentRescueService,
        { provide: SchedulingResourcesService, useValue: resourcesService },
        {
          provide: MultiServiceBookingsService,
          useValue: multiServiceBookingsService,
        },
        { provide: PublicBookingService, useValue: publicBookingService },
        { provide: getRepositoryToken(Business), useValue: businessRepo },
        { provide: getRepositoryToken(Service), useValue: serviceRepo },
        {
          provide: getRepositoryToken(SchedulingResource),
          useValue: resourceRepo,
        },
        { provide: getRepositoryToken(Booking), useValue: bookingRepo },
      ],
    }).compile();

    scheduleResources = module.get(AiScheduleResourcesService);
    rescue = module.get(AiIntentRescueService);
  });

  describe('intent rescue (ai-cmd-s1 dashboard resources)', () => {
    it('rescues scheduling resource CRUD and conflict intents', () => {
      expect(
        rescue.rescue({
          prompt:
            'What equipment does the deep tissue massage service require?',
          action: 'unknown',
          params: {},
        }),
      ).toEqual(
        expect.objectContaining({
          action: 'list_service_resource_requirements',
          params: expect.objectContaining({
            serviceName: expect.stringMatching(/deep tissue massage/i),
          }),
        }),
      );
      expect(
        rescue.rescue({
          prompt: 'List scheduling resources',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('list_scheduling_resources');
      expect(
        rescue.rescue({
          prompt: 'Create room Treatment 2',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('create_resource');
      expect(
        rescue.rescue({
          prompt: 'Update room Treatment 2',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('update_resource');
      expect(
        rescue.rescue({
          prompt: 'Deactivate room Treatment 2',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('deactivate_resource');
      expect(
        rescue.rescue({
          prompt: 'Assign room 2 to facial service',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('assign_resource_hours');
      expect(
        rescue.rescue({
          prompt: 'List resource conflicts tomorrow',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('list_resource_conflicts');
      expect(
        rescue.rescue({
          prompt: 'Explain resource conflict at 3pm',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('explain_resource_conflict');
      expect(
        rescue.rescue({
          prompt: 'Configure multi-service scheduling mode same visit',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('configure_multi_service_scheduling_mode');
      expect(
        rescue.rescue({
          prompt: 'Block room 2 unavailable',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('block_resource_unavailable');
      expect(
        rescue.rescue({
          prompt: 'Show my resource assignments',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('my_resource_assignments');
    });

    it('does not rescue schedule compound via single-intent rescue', () => {
      expect(
        scheduleResources.rescueScheduleResourceIntent(
          'List scheduling resources and create room Alpha',
          'unknown',
        ),
      ).toBeNull();
    });
  });

  describe('intent rescue (ai-cmd-s2 customer availability)', () => {
    it('rescues multi-service block and package availability intents', () => {
      expect(
        rescue.rescue({
          prompt: 'Check multi-service block availability',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('check_multi_service_block_availability');
      expect(
        rescue.rescue({
          prompt: 'Check package line availability',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('check_package_line_availability');
      expect(
        rescue.rescue({
          prompt: 'Soonest appointment opening for multi-service block',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('earliest_slot_all_services');
      expect(
        rescue.rescue({
          prompt: 'Which providers on later days',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('providers_available_later_days');
      expect(
        rescue.rescue({
          prompt: 'Why no slots for massage',
          action: 'unknown',
          params: {},
        })?.action,
      ).toBe('explain_why_no_slots');
    });
  });

  describe('dashboard resource handler flows', () => {
    it('lists, creates, updates, and deactivates resources', async () => {
      expect(
        (await scheduleResources.handleListSchedulingResources('biz-1'))
          .success,
      ).toBe(true);
      expect(
        (
          await scheduleResources.handleCreateResource('biz-1', {
            resourceName: 'Treatment 2',
            resourceType: 'room',
          })
        ).success,
      ).toBe(true);
      expect(resourcesService.createResource).toHaveBeenCalled();
      expect(
        (
          await scheduleResources.handleUpdateResource('biz-1', {
            resourceName: 'Room 1',
            newName: 'Room Alpha',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await scheduleResources.handleDeactivateResource('biz-1', {
            resourceName: 'Room 1',
          })
        ).success,
      ).toBe(true);
      expect(resourcesService.deactivateResource).toHaveBeenCalled();
    });

    it('assigns resources and configures scheduling mode', async () => {
      expect(
        (
          await scheduleResources.handleAssignResourceHours(
            'biz-1',
            { resourceName: 'Room 1', serviceName: 'Massage' },
            services,
          )
        ).success,
      ).toBe(true);
      expect(resourcesService.setServiceRequirements).toHaveBeenCalled();
      expect(
        (
          await scheduleResources.handleConfigureMultiServiceSchedulingMode(
            'biz-1',
            { schedulingMode: 'same_visit' },
          )
        ).success,
      ).toBe(true);
      expect(businessRepo.save).toHaveBeenCalled();
      expect(
        (
          await scheduleResources.handleListResourceConflicts('biz-1', {
            startTime: '2026-06-05T10:00:00Z',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await scheduleResources.handleExplainResourceConflict('biz-1', {
            startTime: '2026-06-05T10:00:00Z',
          })
        ).success,
      ).toBe(true);
    });
  });

  describe('customer availability handler flows', () => {
    it('checks multi-service blocks and package lines', async () => {
      expect(
        (
          await scheduleResources.handleCheckMultiServiceBlockAvailability(
            'biz-1',
            { serviceNames: ['Massage', 'Facial'] },
          )
        ).success,
      ).toBe(true);
      expect(publicBookingService.suggestMultiServiceBlock).toHaveBeenCalled();
      expect(
        (
          await scheduleResources.handleCheckPackageLineAvailability('biz-1', {
            packageId: 'pkg-1',
          })
        ).success,
      ).toBe(true);
      expect(publicBookingService.suggestPackageLineSlots).toHaveBeenCalled();
      expect(
        (
          await scheduleResources.handleEarliestSlotAllServices('biz-1', {
            serviceNames: ['Massage', 'Facial'],
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await scheduleResources.handleProvidersAvailableLaterDays('biz-1', {
            serviceNames: ['Massage'],
            startTime: '2026-06-05T10:00:00Z',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await scheduleResources.handleExplainWhyNoSlots('biz-1', {
            serviceNames: ['Massage', 'Facial'],
          })
        ).success,
      ).toBe(true);
    });

    it('handles provider resource assignments', async () => {
      expect(
        (
          await scheduleResources.handleMyResourceAssignments('biz-1', {
            sessionEmployeeId: 'e1',
          })
        ).success,
      ).toBe(true);
      expect(resourcesService.getBookingResources).toHaveBeenCalled();
      expect(
        (
          await scheduleResources.handleBlockResourceUnavailable('biz-1', {
            resourceName: 'Room 1',
          })
        ).success,
      ).toBe(true);
    });
  });

  describe('multi-command schedule/resource compound', () => {
    it('executes list + create in one command via natural decompose', async () => {
      const result = await scheduleResources.handleScheduleResourceCompound(
        'biz-1',
        'List scheduling resources and create room Treatment 2',
        {},
        services,
        'user-1',
      );
      expect(result.success).toBe(true);
      expect((result.details as any).steps).toHaveLength(2);
      expect((result.details as any).scheduleResourceCompound).toBe(true);
      expect(resourcesService.listResources).toHaveBeenCalled();
      expect(resourcesService.createResource).toHaveBeenCalled();
    });

    it('executes availability compound and stops on failed step', async () => {
      const availability =
        await scheduleResources.handleScheduleResourceCompound(
          'biz-1',
          'Check multi-service block availability and check package line availability',
          { serviceNames: ['Massage'], packageId: 'pkg-1' },
          services,
        );
      expect(availability.success).toBe(true);
      expect((availability.details as any).steps).toHaveLength(2);

      const stopped = await scheduleResources.handleScheduleResourceCompound(
        'biz-1',
        'compound',
        {
          compoundSteps: [
            { action: 'create_resource', params: {}, segment: 'a' },
            { action: 'list_scheduling_resources', params: {}, segment: 'b' },
          ],
        },
        services,
      );
      expect(stopped.success).toBe(false);
      expect((stopped.details as any).failedStep).toBe('create_resource');
    });
  });
});
