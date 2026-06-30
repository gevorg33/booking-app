import {
  handleListSchedulingResourcesLogic,
  handleCreateResourceLogic,
  handleUpdateResourceLogic,
  handleDeactivateResourceLogic,
  handleAssignResourceHoursLogic,
  handleListResourceConflictsLogic,
  handleExplainResourceConflictLogic,
  handleConfigureMultiServiceSchedulingModeLogic,
  handleMyResourceAssignmentsLogic,
  handleBlockResourceUnavailableLogic,
  handleCheckMultiServiceBlockAvailabilityLogic,
  handleCheckPackageLineAvailabilityLogic,
  handleEarliestSlotAllServicesLogic,
  handleProvidersAvailableLaterDaysLogic,
  handleExplainWhyNoSlotsLogic,
  handleScheduleResourceCompoundLogic,
  type Sprint29ScheduleResourceLogicDeps,
} from './ai-schedule-resources.logic.js';
import { handleExplainMultiServiceSettingsLogic } from './ai-explain-multi-service-settings.logic.js';

const services = [
  { id: 's1', name: 'Massage', businessId: 'biz-1' },
  { id: 's2', name: 'Facial', businessId: 'biz-1' },
] as any[];

const resources = [
  { id: 'r1', name: 'Room 1', businessId: 'biz-1' },
  { id: 'r2', name: 'Chair A', businessId: 'biz-1' },
] as any[];

function buildDeps(
  overrides: Partial<Sprint29ScheduleResourceLogicDeps> = {},
): Sprint29ScheduleResourceLogicDeps {
  return {
    resourcesService: {
      listResources: jest.fn(async () => resources),
      createResource: jest.fn(async (_b, dto) => ({ id: 'r-new', ...dto })),
      updateResource: jest.fn(async (_b, _id, dto) => ({
        id: 'r1',
        name: dto.name ?? 'Room 1',
        ...dto,
      })),
      deactivateResource: jest.fn(),
      setServiceRequirements: jest.fn(async () => [
        { resourceId: 'r1', serviceId: 's1' },
      ]),
      findConflictingResourceIds: jest.fn(async () => ['r1']),
      getBookingResources: jest.fn(async () => [{ id: 'r1', name: 'Room 1' }]),
    } as any,
    multiServiceBookingsService: {
      resolveSettingsFromBusiness: jest.fn(() => ({
        enabled: true,
        maxServiceCount: 3,
        schedulingMode: 'same_visit' as const,
      })),
    } as any,
    publicBookingService: {
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
    } as any,
    businessRepo: {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        slug: 'salon',
        settings: {},
      })),
      save: jest.fn(async (b) => b),
    } as any,
    serviceRepo: {
      find: jest.fn(async () => services),
    } as any,
    resourceRepo: {
      find: jest.fn(async () => resources),
      findOne: jest.fn(async ({ where }: any) =>
        resources.find(
          (r) =>
            r.id === where.id ||
            r.name.toLowerCase().includes(String(where.id ?? '').toLowerCase()),
        ),
      ),
    } as any,
    bookingRepo: {
      find: jest.fn(async () => [
        {
          id: 'b1',
          businessId: 'biz-1',
          employeeId: 'e1',
          startTime: new Date('2026-06-06T10:00:00Z'),
          status: 'confirmed',
        },
      ]),
    } as any,
    ...overrides,
  };
}

describe('ai-schedule-resources.logic', () => {
  describe('dashboard resource read handlers', () => {
    it('lists scheduling resources with empty and populated results', async () => {
      expect(
        (await handleListSchedulingResourcesLogic(buildDeps(), 'biz-1'))
          .success,
      ).toBe(true);
      const empty = await handleListSchedulingResourcesLogic(
        buildDeps({
          resourcesService: { listResources: jest.fn(async () => []) } as any,
        }),
        'biz-1',
      );
      expect(empty.success).toBe(true);
      expect(empty.summary).toContain('No active');
    });

    it('lists and explains resource conflicts', async () => {
      expect(
        (await handleListResourceConflictsLogic(buildDeps(), 'biz-1', {}))
          .success,
      ).toBe(false);
      expect(
        (
          await handleListResourceConflictsLogic(buildDeps(), 'biz-1', {
            startTime: '2026-06-05T10:00:00Z',
            endTime: '2026-06-05T11:00:00Z',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleListResourceConflictsLogic(buildDeps(), 'biz-1', {
            dateTime: '2026-06-05T10:00:00Z',
            resourceName: 'Room 1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleListResourceConflictsLogic(
            buildDeps({
              resourcesService: {
                listResources: jest.fn(async () => []),
                findConflictingResourceIds: jest.fn(async () => []),
              } as any,
            }),
            'biz-1',
            { startTime: '2026-06-05T10:00:00Z' },
          )
        ).summary,
      ).toContain('No scheduling resources');

      const noConflicts = await handleListResourceConflictsLogic(
        buildDeps({
          resourcesService: {
            listResources: jest.fn(async () => resources),
            findConflictingResourceIds: jest.fn(async () => []),
          } as any,
        }),
        'biz-1',
        { startTime: '2026-06-05T10:00:00Z' },
      );
      expect(noConflicts.summary).toContain('No resource conflicts');

      expect(
        (
          await handleExplainResourceConflictLogic(buildDeps(), 'biz-1', {
            startTime: 'invalid',
          })
        ).success,
      ).toBe(false);
      expect(
        (
          await handleExplainResourceConflictLogic(
            buildDeps({
              resourcesService: {
                listResources: jest.fn(async () => resources),
                findConflictingResourceIds: jest.fn(async () => []),
              } as any,
            }),
            'biz-1',
            { startTime: '2026-06-05T10:00:00Z' },
          )
        ).summary,
      ).toContain('No resource conflicts');
      expect(
        (
          await handleExplainResourceConflictLogic(buildDeps(), 'biz-1', {
            startTime: '2026-06-05T10:00:00Z',
          })
        ).success,
      ).toBe(true);
    });
  });

  describe('dashboard resource mutate handlers', () => {
    it('creates, updates, deactivates, and blocks resources', async () => {
      expect(
        (await handleCreateResourceLogic(buildDeps(), 'biz-1', {})).success,
      ).toBe(false);
      expect(
        (
          await handleCreateResourceLogic(buildDeps(), 'biz-1', {
            resourceName: 'Treatment 2',
          })
        ).success,
      ).toBe(true);

      expect(
        (await handleUpdateResourceLogic(buildDeps(), 'biz-1', {})).success,
      ).toBe(false);
      expect(
        (
          await handleUpdateResourceLogic(buildDeps(), 'biz-1', {
            resourceName: 'Room 1',
            newName: 'Room Alpha',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleUpdateResourceLogic(buildDeps(), 'biz-1', {
            resourceId: 'r1',
            resourceName: 'Updated',
          })
        ).success,
      ).toBe(true);

      expect(
        (await handleDeactivateResourceLogic(buildDeps(), 'biz-1', {})).success,
      ).toBe(false);
      expect(
        (
          await handleDeactivateResourceLogic(buildDeps(), 'biz-1', {
            resourceName: 'Room 1',
          })
        ).success,
      ).toBe(true);

      expect(
        (await handleBlockResourceUnavailableLogic(buildDeps(), 'biz-1', {}))
          .success,
      ).toBe(false);
      expect(
        (
          await handleBlockResourceUnavailableLogic(buildDeps(), 'biz-1', {
            resourceName: 'Room 1',
          })
        ).success,
      ).toBe(true);
    });

    it('assigns resource hours to services', async () => {
      expect(
        (
          await handleAssignResourceHoursLogic(
            buildDeps(),
            'biz-1',
            {},
            services,
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleAssignResourceHoursLogic(
            buildDeps(),
            'biz-1',
            { resourceName: 'Room 1', serviceName: 'Massage' },
            services,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleAssignResourceHoursLogic(
            buildDeps(),
            'biz-1',
            { resourceId: 'r1', serviceId: 's1' },
            services,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleAssignResourceHoursLogic(
            buildDeps(),
            'biz-1',
            { resourceName: 'Room', serviceNames: ['Facial'] },
            services,
          )
        ).success,
      ).toBe(true);
    });

    it('configures multi-service scheduling mode', async () => {
      expect(
        (
          await handleConfigureMultiServiceSchedulingModeLogic(
            buildDeps(),
            'biz-1',
            {},
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleConfigureMultiServiceSchedulingModeLogic(
            buildDeps(),
            'biz-1',
            {
              schedulingMode: 'invalid',
            },
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleConfigureMultiServiceSchedulingModeLogic(
            buildDeps(),
            'biz-1',
            {
              schedulingMode: 'same_visit',
            },
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleConfigureMultiServiceSchedulingModeLogic(
            buildDeps(),
            'biz-1',
            {
              schedulingMode: 'per_service',
            },
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleConfigureMultiServiceSchedulingModeLogic(
            buildDeps({
              businessRepo: {
                findOne: jest.fn(async () => ({
                  id: 'biz-1',
                  settings: undefined,
                })),
                save: jest.fn(async (b) => b),
              } as any,
            }),
            'biz-1',
            { schedulingMode: 'same_visit' },
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleConfigureMultiServiceSchedulingModeLogic(
            {
              businessRepo: {
                findOne: jest.fn(async () => null),
                save: jest.fn(),
              } as any,
            } as any,
            'biz-1',
            { schedulingMode: 'same_visit' },
          )
        ).success,
      ).toBe(false);
    });

    it('explains multi-service settings', async () => {
      expect(
        (
          await handleExplainMultiServiceSettingsLogic(
            buildDeps(),
            'biz-1',
            {},
            'Explain multi-service booking settings',
          )
        ).success,
      ).toBe(true);
    });
  });

  describe('provider resource handlers', () => {
    it('handles my resource assignments', async () => {
      expect(
        (await handleMyResourceAssignmentsLogic(buildDeps(), 'biz-1', {}))
          .success,
      ).toBe(false);
      expect(
        (
          await handleMyResourceAssignmentsLogic(buildDeps(), 'biz-1', {
            sessionEmployeeId: 'e1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleMyResourceAssignmentsLogic(
            buildDeps({
              bookingRepo: { find: jest.fn(async () => []) } as any,
              resourcesService: {
                getBookingResources: jest.fn(async () => []),
              } as any,
            }),
            'biz-1',
            { employeeId: 'e1' },
          )
        ).summary,
      ).toContain('No resource assignments');
      expect(
        (
          await handleMyResourceAssignmentsLogic(
            buildDeps({
              resourcesService: {
                getBookingResources: jest.fn(async () => []),
              } as any,
            }),
            'biz-1',
            { sessionEmployeeId: 'e1' },
          )
        ).summary,
      ).toContain('No resource assignments');
    });
  });

  describe('customer availability handlers', () => {
    it('checks multi-service block availability', async () => {
      expect(
        (
          await handleCheckMultiServiceBlockAvailabilityLogic(
            buildDeps(),
            'biz-1',
            {},
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleCheckMultiServiceBlockAvailabilityLogic(
            {
              businessRepo: { findOne: jest.fn(async () => null) } as any,
            } as any,
            'biz-1',
            { serviceNames: ['Massage'] },
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleCheckMultiServiceBlockAvailabilityLogic(
            buildDeps(),
            'biz-1',
            {
              serviceNames: ['Massage', 'Facial'],
            },
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleCheckMultiServiceBlockAvailabilityLogic(
            buildDeps(),
            'biz-1',
            {
              serviceIds: ['s1'],
              date: '2026-06-05',
            },
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleCheckMultiServiceBlockAvailabilityLogic(
            buildDeps({
              publicBookingService: {
                getMultiServiceBlockDaySlots: jest.fn(async () => ({
                  slots: undefined,
                })),
              } as any,
            }),
            'biz-1',
            { serviceIds: ['s1'], date: '2026-06-05' },
          )
        ).summary,
      ).toContain('0 block slot');
      expect(
        (
          await handleCheckMultiServiceBlockAvailabilityLogic(
            buildDeps({
              publicBookingService: {
                suggestMultiServiceBlock: jest.fn(async () => {
                  throw new Error('no blocks');
                }),
              } as any,
            }),
            'biz-1',
            { serviceName: 'Massage' },
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleCheckMultiServiceBlockAvailabilityLogic(
            buildDeps({
              publicBookingService: {
                suggestMultiServiceBlock: jest.fn(async () => {
                  throw {};
                }),
              } as any,
            }),
            'biz-1',
            { serviceName: 'Massage' },
          )
        ).summary,
      ).toContain('No multi-service blocks');
    });

    it('checks package line availability', async () => {
      expect(
        (
          await handleCheckPackageLineAvailabilityLogic(
            buildDeps(),
            'biz-1',
            {},
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleCheckPackageLineAvailabilityLogic(
            {
              businessRepo: { findOne: jest.fn(async () => null) } as any,
            } as any,
            'biz-1',
            { packageId: 'pkg-1' },
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleCheckPackageLineAvailabilityLogic(buildDeps(), 'biz-1', {
            packageId: 'pkg-1',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleCheckPackageLineAvailabilityLogic(
            buildDeps({
              publicBookingService: {
                suggestPackageLineSlots: jest.fn(async () => {
                  throw {};
                }),
              } as any,
            }),
            'biz-1',
            { packageId: 'pkg-1' },
          )
        ).summary,
      ).toContain('No package line slots');
    });

    it('finds earliest slot and later-day providers', async () => {
      expect(
        (await handleEarliestSlotAllServicesLogic(buildDeps(), 'biz-1', {}))
          .success,
      ).toBe(false);
      expect(
        (
          await handleEarliestSlotAllServicesLogic(
            {
              businessRepo: { findOne: jest.fn(async () => null) } as any,
            } as any,
            'biz-1',
            { serviceNames: ['Massage'] },
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleEarliestSlotAllServicesLogic(buildDeps(), 'biz-1', {
            serviceNames: ['Massage', 'Facial'],
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleEarliestSlotAllServicesLogic(
            buildDeps({
              publicBookingService: {
                suggestMultiServiceBlock: jest.fn(async () => {
                  throw {};
                }),
              } as any,
            }),
            'biz-1',
            { serviceNames: ['Massage'] },
          )
        ).summary,
      ).toContain('No earliest slot');

      expect(
        (await handleProvidersAvailableLaterDaysLogic(buildDeps(), 'biz-1', {}))
          .success,
      ).toBe(false);
      expect(
        (
          await handleProvidersAvailableLaterDaysLogic(buildDeps(), 'biz-1', {
            serviceNames: ['Massage'],
            startTime: '2026-06-05T10:00:00Z',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleProvidersAvailableLaterDaysLogic(
            buildDeps({
              publicBookingService: {
                getMultiServiceBlockProviders: jest.fn(async () => ({
                  providers: [],
                })),
              } as any,
            }),
            'biz-1',
            {
              serviceNames: ['Massage'],
              blockStartTime: '2026-06-05T10:00:00Z',
            },
          )
        ).summary,
      ).toContain('No providers');
      expect(
        (
          await handleProvidersAvailableLaterDaysLogic(
            buildDeps({
              publicBookingService: {
                getMultiServiceBlockProviders: jest.fn(async () => {
                  throw {};
                }),
              } as any,
            }),
            'biz-1',
            { serviceNames: ['Massage'], startTime: '2026-06-05T10:00:00Z' },
          )
        ).summary,
      ).toContain('Could not check');
    });

    it('explains why no slots are available', async () => {
      expect(
        (await handleExplainWhyNoSlotsLogic(buildDeps(), 'biz-1', {})).success,
      ).toBe(false);
      expect(
        (
          await handleExplainWhyNoSlotsLogic(
            {
              businessRepo: { findOne: jest.fn(async () => null) } as any,
            } as any,
            'biz-1',
            { serviceNames: ['Massage'] },
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleExplainWhyNoSlotsLogic(buildDeps(), 'biz-1', {
            serviceNames: ['Massage', 'Facial'],
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleExplainWhyNoSlotsLogic(
            buildDeps({
              publicBookingService: {
                suggestMultiServiceBlock: jest.fn(async () => {
                  throw new Error('none');
                }),
                getMultiServiceBlockDaySlots: jest.fn(async () => {
                  throw new Error('none');
                }),
              } as any,
              multiServiceBookingsService: {
                resolveSettingsFromBusiness: jest.fn(() => ({
                  enabled: false,
                  maxServiceCount: 1,
                  schedulingMode: 'same_visit' as const,
                })),
              } as any,
            }),
            'biz-1',
            { serviceNames: ['Massage', 'Facial', 'Peel', 'Wrap'] },
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleExplainWhyNoSlotsLogic(
            buildDeps({
              publicBookingService: {
                suggestMultiServiceBlock: jest.fn(async () => {
                  throw new Error('none');
                }),
              } as any,
              multiServiceBookingsService: {
                resolveSettingsFromBusiness: jest.fn(() => ({
                  enabled: true,
                  maxServiceCount: 2,
                  schedulingMode: 'same_visit' as const,
                })),
              } as any,
            }),
            'biz-1',
            { serviceNames: ['Massage', 'Facial'] },
          )
        ).details,
      ).toMatchObject({ available: false });
    });
  });

  describe('handleScheduleResourceCompoundLogic', () => {
    it('runs multi-step schedule compound and handles failures', async () => {
      const ok = await handleScheduleResourceCompoundLogic(
        buildDeps(),
        'biz-1',
        'List scheduling resources and create room Treatment 2',
        {},
        services,
        'user-1',
      );
      expect(ok.success).toBe(true);
      expect((ok.details as any).scheduleResourceCompound).toBe(true);

      const explainMultiService = await handleScheduleResourceCompoundLogic(
        buildDeps(),
        'biz-1',
        'Explain multi-service booking settings and list scheduling resources',
        {
          compoundSteps: [
            {
              action: 'explain_multi_service_settings',
              params: {},
              segment: 'Explain multi-service booking settings',
            },
            {
              action: 'list_scheduling_resources',
              params: {},
              segment: 'List scheduling resources',
            },
          ],
        },
        services,
      );
      expect(explainMultiService.success).toBe(true);

      const fail = await handleScheduleResourceCompoundLogic(
        buildDeps(),
        'biz-1',
        'hello world',
        {},
        services,
      );
      expect(fail.success).toBe(false);

      const stopped = await handleScheduleResourceCompoundLogic(
        buildDeps(),
        'biz-1',
        'unused',
        {
          compoundSteps: [
            { action: 'create_resource', params: {}, segment: 'a' },
            { action: 'list_scheduling_resources', params: {}, segment: 'b' },
          ],
        },
        services,
      );
      expect(stopped.success).toBe(false);

      const listCompound = await handleScheduleResourceCompoundLogic(
        buildDeps(),
        'biz-1',
        'x',
        {
          compoundSteps: [
            { action: 'list_scheduling_resources', params: {}, segment: 'a' },
            {
              action: 'list_resource_conflicts',
              params: { startTime: '2026-06-05T10:00:00Z' },
              segment: 'b',
            },
          ],
        },
        services,
      );
      expect(listCompound.success).toBe(true);

      const availabilityCompound = await handleScheduleResourceCompoundLogic(
        buildDeps(),
        'biz-1',
        'x',
        {
          compoundSteps: [
            {
              action: 'assign_resource_hours',
              params: { resourceName: 'Room 1', serviceName: 'Massage' },
              segment: 'a',
            },
            {
              action: 'check_multi_service_block_availability',
              params: { serviceNames: ['Massage'] },
              segment: 'b',
            },
            {
              action: 'earliest_slot_all_services',
              params: { serviceNames: ['Massage'] },
              segment: 'c',
            },
            {
              action: 'my_resource_assignments',
              params: { sessionEmployeeId: 'e1' },
              segment: 'd',
            },
          ],
        },
        services,
        'user-2',
      );
      expect(availabilityCompound.success).toBe(true);

      const fullCompound = await handleScheduleResourceCompoundLogic(
        buildDeps(),
        'biz-1',
        'x',
        {
          compoundSteps: [
            {
              action: 'update_resource',
              params: { resourceName: 'Room 1' },
              segment: 'a',
            },
            {
              action: 'deactivate_resource',
              params: { resourceName: 'Room 1' },
              segment: 'b',
            },
            {
              action: 'explain_resource_conflict',
              params: { startTime: '2026-06-05T10:00:00Z' },
              segment: 'c',
            },
            {
              action: 'block_resource_unavailable',
              params: { resourceName: 'Room 1' },
              segment: 'd',
            },
          ],
        },
        services,
      );
      expect(fullCompound.success).toBe(true);

      const customerCompound = await handleScheduleResourceCompoundLogic(
        buildDeps(),
        'biz-1',
        'x',
        {
          compoundSteps: [
            {
              action: 'configure_multi_service_scheduling_mode',
              params: { schedulingMode: 'per_service' },
              segment: 'a',
            },
            {
              action: 'check_package_line_availability',
              params: { packageId: 'pkg-1' },
              segment: 'b',
            },
            {
              action: 'providers_available_later_days',
              params: {
                serviceNames: ['Massage'],
                startTime: '2026-06-05T10:00:00Z',
              },
              segment: 'c',
            },
            {
              action: 'explain_why_no_slots',
              params: { serviceNames: ['Massage'] },
              segment: 'd',
            },
          ],
        },
        services,
      );
      expect(customerCompound.success).toBe(true);

      const unsupported = await handleScheduleResourceCompoundLogic(
        buildDeps(),
        'biz-1',
        'x',
        {
          compoundSteps: [
            { action: 'merge_customers' as any, params: {}, segment: 'a' },
            { action: 'list_scheduling_resources', params: {}, segment: 'b' },
          ],
        },
        services,
      );
      expect(unsupported.success).toBe(false);
    });
  });

  describe('resolve branches', () => {
    it('covers parseTimeRange invalid end and resolveServiceIds by name partial match', async () => {
      expect(
        (
          await handleListResourceConflictsLogic(buildDeps(), 'biz-1', {
            startTime: '2026-06-05T10:00:00Z',
            endTime: 'not-a-date',
          })
        ).success,
      ).toBe(false);

      expect(
        (
          await handleCheckMultiServiceBlockAvailabilityLogic(
            buildDeps(),
            'biz-1',
            {
              serviceNames: ['Mass'],
            },
          )
        ).success,
      ).toBe(true);

      expect(
        (
          await handleProvidersAvailableLaterDaysLogic(
            {
              businessRepo: { findOne: jest.fn(async () => null) } as any,
            } as any,
            'biz-1',
            { serviceNames: ['Massage'], startTime: '2026-06-05T10:00:00Z' },
          )
        ).success,
      ).toBe(false);
    });

    it('resolves by resourceId, serviceIds, and partial service name', async () => {
      expect(
        (
          await handleUpdateResourceLogic(
            buildDeps({
              resourceRepo: {
                findOne: jest.fn(() => null),
                find: jest.fn(async () => resources),
              } as any,
            }),
            'biz-1',
            { resourceId: 'missing' },
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleUpdateResourceLogic(buildDeps(), 'biz-1', {
            resourceName: 'Room 1',
            newName: 'Room Beta',
          })
        ).success,
      ).toBe(true);
      expect(
        (
          await handleAssignResourceHoursLogic(
            buildDeps(),
            'biz-1',
            { resourceName: 'Room 1', serviceId: 's2' },
            services,
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleCheckMultiServiceBlockAvailabilityLogic(
            buildDeps(),
            'biz-1',
            {
              serviceIds: ['s1', 's2'],
            },
          )
        ).success,
      ).toBe(true);
      expect(
        (
          await handleAssignResourceHoursLogic(
            buildDeps(),
            'biz-1',
            { resourceName: 'Room 1' },
            services,
          )
        ).success,
      ).toBe(false);
      expect(
        (
          await handleAssignResourceHoursLogic(
            buildDeps(),
            'biz-1',
            { serviceName: 'Massage' },
            services,
          )
        ).success,
      ).toBe(false);
    });
  });
});
