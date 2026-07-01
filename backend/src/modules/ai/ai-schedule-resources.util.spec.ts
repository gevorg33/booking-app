import {
  rescueScheduleResourceIntent,
  isScheduleResourceCompoundPrompt,
  decomposeScheduleResourceCompoundPrompt,
  isListSchedulingResourcesPrompt,
  isCreateResourcePrompt,
  isUpdateResourcePrompt,
  isDeactivateResourcePrompt,
  isAssignResourceHoursPrompt,
  isListResourceConflictsPrompt,
  isExplainResourceConflictPrompt,
  isConfigureMultiServiceSchedulingModePrompt,
  isMyResourceAssignmentsPrompt,
  isBlockResourceUnavailablePrompt,
  isCheckMultiServiceBlockAvailabilityPrompt,
  isCheckPackageLineAvailabilityPrompt,
  isEarliestSlotAllServicesPrompt,
  isProvidersAvailableLaterDaysPrompt,
  isExplainWhyNoSlotsPrompt,
  extractResourceNameFromPrompt,
  extractResourceTypeFromPrompt,
  extractSchedulingModeFromPrompt,
  extractServiceNamesFromPrompt,
  SCHEDULE_RESOURCE_INTENTS,
  isScheduleResourceIntent,
} from './ai-schedule-resources.util.js';

describe('ai-schedule-resources.util', () => {
  describe('prompt classifiers', () => {
    it('detects dashboard resource read prompts', () => {
      expect(isListSchedulingResourcesPrompt('List scheduling resources')).toBe(
        true,
      );
      expect(isListSchedulingResourcesPrompt('Show resources for today')).toBe(
        true,
      );
      expect(
        isListSchedulingResourcesPrompt('List resource conflicts tomorrow'),
      ).toBe(false);
      expect(
        isListSchedulingResourcesPrompt('Show my resource assignments'),
      ).toBe(false);
      expect(
        isListResourceConflictsPrompt('List resource conflicts for tomorrow'),
      ).toBe(true);
      expect(
        isListResourceConflictsPrompt('Find resource conflict window'),
      ).toBe(true);
      expect(
        isExplainResourceConflictPrompt('Explain resource conflict at 3pm'),
      ).toBe(true);
      expect(
        isExplainResourceConflictPrompt('Why resource conflict for room 2'),
      ).toBe(true);
    });

    it('detects dashboard resource mutate prompts', () => {
      expect(isCreateResourcePrompt('Create room Treatment 2')).toBe(true);
      expect(isCreateResourcePrompt('Add chair Station A')).toBe(true);
      expect(isCreateResourcePrompt('Create schedule template')).toBe(false);
      expect(isUpdateResourcePrompt('Update room Treatment 2 name')).toBe(true);
      expect(isUpdateResourcePrompt('Rename chair Station A')).toBe(true);
      expect(isUpdateResourcePrompt('Deactivate room 2')).toBe(false);
      expect(isDeactivateResourcePrompt('Deactivate room Treatment 2')).toBe(
        true,
      );
      expect(isDeactivateResourcePrompt('Remove chair Station A')).toBe(true);
      expect(isDeactivateResourcePrompt('Block room offline')).toBe(false);
      expect(
        isAssignResourceHoursPrompt('Assign room 2 to facial service'),
      ).toBe(true);
      expect(isAssignResourceHoursPrompt('Link chair A to massage hours')).toBe(
        true,
      );
      expect(
        isConfigureMultiServiceSchedulingModePrompt(
          'Configure multi-service scheduling mode to same visit',
        ),
      ).toBe(true);
      expect(
        isConfigureMultiServiceSchedulingModePrompt(
          'Set per-service scheduling for multi service',
        ),
      ).toBe(true);
      expect(isBlockResourceUnavailablePrompt('Block room 2 unavailable')).toBe(
        true,
      );
      expect(isBlockResourceUnavailablePrompt('Mark chair A offline')).toBe(
        true,
      );
    });

    it('detects provider resource prompts', () => {
      expect(
        isMyResourceAssignmentsPrompt('Show my resource assignments'),
      ).toBe(true);
      expect(isMyResourceAssignmentsPrompt('My room bookings this week')).toBe(
        true,
      );
      expect(isMyResourceAssignmentsPrompt('List scheduling resources')).toBe(
        false,
      );
    });

    it('detects customer availability prompts', () => {
      expect(
        isCheckMultiServiceBlockAvailabilityPrompt(
          'Check multi-service block availability',
        ),
      ).toBe(true);
      expect(
        isCheckMultiServiceBlockAvailabilityPrompt(
          'What services block slots tomorrow',
        ),
      ).toBe(true);
      expect(
        isCheckMultiServiceBlockAvailabilityPrompt(
          'Check package line availability',
        ),
      ).toBe(false);
      expect(
        isCheckPackageLineAvailabilityPrompt(
          'Check package line availability for Spa Day',
        ),
      ).toBe(true);
      expect(
        isCheckPackageLineAvailabilityPrompt('Find package visit times'),
      ).toBe(true);
      expect(
        isEarliestSlotAllServicesPrompt('Earliest slot for all services'),
      ).toBe(true);
      expect(
        isEarliestSlotAllServicesPrompt('Next opening for both services'),
      ).toBe(true);
      expect(
        isProvidersAvailableLaterDaysPrompt(
          'Which providers available on later days',
        ),
      ).toBe(true);
      expect(
        isProvidersAvailableLaterDaysPrompt('Any stylists on other days'),
      ).toBe(true);
      expect(
        isExplainWhyNoSlotsPrompt('Why no slots for massage and facial'),
      ).toBe(true);
      expect(
        isExplainWhyNoSlotsPrompt("Explain why I can't book tomorrow"),
      ).toBe(true);
    });
  });

  describe('extractors', () => {
    it('extracts resource names, types, scheduling modes, and service names', () => {
      expect(extractResourceNameFromPrompt('Create room Treatment 2')).toBe(
        'Treatment 2',
      );
      expect(
        extractResourceNameFromPrompt('Assign "Room Alpha" to service'),
      ).toBe('Room Alpha');
      expect(extractResourceNameFromPrompt('nothing to extract')).toBeNull();
      expect(extractResourceTypeFromPrompt('Create chair Station A')).toBe(
        'chair',
      );
      expect(extractResourceTypeFromPrompt('Add station B')).toBe('station');
      expect(extractResourceTypeFromPrompt('Create room Alpha')).toBe('room');
      expect(extractResourceTypeFromPrompt('Create resource Alpha')).toBeNull();
      expect(
        extractSchedulingModeFromPrompt('Set per-service scheduling'),
      ).toBe('per_service');
      expect(extractSchedulingModeFromPrompt('Switch to same visit mode')).toBe(
        'same_visit',
      );
      expect(
        extractSchedulingModeFromPrompt('Configure scheduling'),
      ).toBeNull();
      expect(extractServiceNamesFromPrompt('"Massage" and "Facial"')).toEqual([
        'Massage',
        'Facial',
      ]);
      expect(extractServiceNamesFromPrompt('Massage + Facial')).toEqual([
        'Massage',
        'Facial',
      ]);
    });
  });

  describe('rescueScheduleResourceIntent', () => {
    it('rescues all schedule/resource intents from unknown', () => {
      expect(
        rescueScheduleResourceIntent('Why no slots for massage', 'unknown')
          ?.action,
      ).toBe('explain_why_no_slots');
      expect(
        rescueScheduleResourceIntent('Which providers on later days', 'unknown')
          ?.action,
      ).toBe('providers_available_later_days');
      expect(
        rescueScheduleResourceIntent(
          'Earliest slot for all services',
          'unknown',
        )?.action,
      ).toBe('earliest_slot_all_services');
      expect(
        rescueScheduleResourceIntent(
          'Check package line availability',
          'unknown',
        )?.action,
      ).toBe('check_package_line_availability');
      expect(
        rescueScheduleResourceIntent(
          'Check multi-service block availability',
          'unknown',
        )?.action,
      ).toBe('check_multi_service_block_availability');
      expect(
        rescueScheduleResourceIntent('Show my resource assignments', 'unknown')
          ?.action,
      ).toBe('my_resource_assignments');
      expect(
        rescueScheduleResourceIntent('Block room 2 unavailable', 'unknown')
          ?.action,
      ).toBe('block_resource_unavailable');
      expect(
        rescueScheduleResourceIntent(
          'Explain resource conflict at 3pm',
          'unknown',
        )?.action,
      ).toBe('explain_resource_conflict');
      expect(
        rescueScheduleResourceIntent(
          'List resource conflicts tomorrow',
          'unknown',
        )?.action,
      ).toBe('list_resource_conflicts');
      expect(
        rescueScheduleResourceIntent(
          'Configure multi-service scheduling mode same visit',
          'unknown',
        )?.action,
      ).toBe('configure_multi_service_scheduling_mode');
      expect(
        rescueScheduleResourceIntent(
          'Assign room 2 to facial service',
          'unknown',
        )?.action,
      ).toBe('assign_resource_hours');
      expect(
        rescueScheduleResourceIntent('Deactivate room Treatment 2', 'unknown')
          ?.action,
      ).toBe('deactivate_resource');
      expect(
        rescueScheduleResourceIntent('Update room Treatment 2', 'unknown')
          ?.action,
      ).toBe('update_resource');
      expect(
        rescueScheduleResourceIntent('Create room Treatment 2', 'unknown')
          ?.action,
      ).toBe('create_resource');
      expect(
        rescueScheduleResourceIntent('List scheduling resources', 'unknown')
          ?.action,
      ).toBe('list_scheduling_resources');
      expect(
        rescueScheduleResourceIntent(
          'Explain multi-service booking settings',
          'unknown',
        )?.action,
      ).toBe('explain_multi_service_settings');
    });

    it('skips rescue when action already matches or compound', () => {
      expect(
        rescueScheduleResourceIntent(
          'List scheduling resources',
          'list_scheduling_resources',
        ),
      ).toBeNull();
      expect(
        rescueScheduleResourceIntent(
          'Configure multi-service scheduling mode',
          'configure_multi_service_settings',
        ),
      ).toBeNull();
      expect(
        rescueScheduleResourceIntent(
          'List scheduling resources and create room Alpha',
          'unknown',
        ),
      ).toBeNull();
      expect(
        rescueScheduleResourceIntent(
          'List scheduling resources and create room Alpha',
          'compound_intent',
        ),
      ).not.toBeNull();
      expect(rescueScheduleResourceIntent('hello world', 'unknown')).toBeNull();
    });
  });

  describe('compound decomposition', () => {
    it('decomposes multi-command schedule/resource prompts', () => {
      const prompt = 'List scheduling resources and create room Treatment 2';
      expect(isScheduleResourceCompoundPrompt(prompt)).toBe(true);
      const steps = decomposeScheduleResourceCompoundPrompt(prompt);
      expect(steps).toHaveLength(2);
      expect(steps[0].action).toBe('list_scheduling_resources');
      expect(steps[1].action).toBe('create_resource');
      expect(steps[1].params.resourceName).toBe('Treatment 2');
    });

    it('decomposes semicolon and availability compound steps', () => {
      const steps = decomposeScheduleResourceCompoundPrompt(
        'Show my resource assignments; list resource conflicts for tomorrow',
      );
      expect(steps.map((s) => s.action)).toEqual([
        'my_resource_assignments',
        'list_resource_conflicts',
      ]);

      const availability = decomposeScheduleResourceCompoundPrompt(
        'Check multi-service block availability and check package line availability',
      );
      expect(availability.map((s) => s.action)).toContain(
        'check_multi_service_block_availability',
      );
      expect(availability.map((s) => s.action)).toContain(
        'check_package_line_availability',
      );

      const configure = decomposeScheduleResourceCompoundPrompt(
        'Configure multi-service scheduling mode same visit and assign room 2 to facial service',
      );
      expect(configure.map((s) => s.action)).toContain(
        'configure_multi_service_scheduling_mode',
      );
      expect(configure.map((s) => s.action)).toContain('assign_resource_hours');
      expect(
        configure.find(
          (s) => s.action === 'configure_multi_service_scheduling_mode',
        )?.params.schedulingMode,
      ).toBe('same_visit');

      const withServices = decomposeScheduleResourceCompoundPrompt(
        'Check multi-service block for "Massage" and "Facial" and earliest slot for all services',
      );
      expect(
        withServices.some((s) =>
          (s.params.serviceNames as string[])?.includes('Massage'),
        ),
      ).toBe(true);

      const partial = decomposeScheduleResourceCompoundPrompt(
        'List scheduling resources and list foobar widgets',
      );
      expect(partial).toHaveLength(1);

      const emptySegment = decomposeScheduleResourceCompoundPrompt(
        'List scheduling resources; ; and create room Treatment 2',
      );
      expect(emptySegment.map((s) => s.action)).toEqual([
        'list_scheduling_resources',
        'create_resource',
      ]);
    });

    it('returns empty for unclassifiable prompts', () => {
      expect(decomposeScheduleResourceCompoundPrompt('')).toEqual([]);
      expect(decomposeScheduleResourceCompoundPrompt('hello world')).toEqual(
        [],
      );
      expect(isScheduleResourceCompoundPrompt('hi')).toBe(false);
      expect(
        decomposeScheduleResourceCompoundPrompt('List scheduling resources'),
      ).toHaveLength(1);
    });
  });

  it('registers scheduleResources intents', () => {
    for (const intent of SCHEDULE_RESOURCE_INTENTS) {
      expect(isScheduleResourceIntent(intent)).toBe(true);
    }
    expect(isScheduleResourceIntent('create_booking')).toBe(false);
  });
});
