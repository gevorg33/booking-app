/**
 * e2e-bug.273 — public bookable-dates/slots GET must not persist schedule
 * roll-forward (e2e-bug.254 residual). Availability may still use ephemeral
 * projections; materialization belongs on booking POST / owner template paths.
 */

export const E2E273_UNIT_CASES = [
  {
    id: 'index-projected-start-times',
    description: 'indexProjectedMicroSlotStartTimes keys employee+date',
  },
  {
    id: 'start-time-matches-projection',
    description: 'startTimeMatchesProjection finds exact projected instants',
  },
  {
    id: 'plan-without-persist-saves-nothing',
    description: 'planAssignedProvidersUpcomingHours does not call slot/period save',
  },
  {
    id: 'bookable-dates-get-no-persist',
    description: 'getServiceBookableDates does not persist periods/slots',
  },
  {
    id: 'day-slots-get-no-persist',
    description: 'getServiceDaySlots does not persist periods/slots',
  },
  {
    id: 'bookable-dates-still-nonempty-via-ephemeral',
    description: 'GET bookable-dates still returns dates from ephemeral projection',
  },
  {
    id: 'materialize-on-persist-true',
    description: 'ensureAssignedProvidersUpcomingHours({persist:true}) still saves',
  },
] as const;

export const E2E273_LIVE_CASES = [
  {
    id: 'get-bookable-dates-no-new-periods',
    description: 'Face Pilling bookable-dates GET does not insert scheduling_periods',
  },
  {
    id: 'get-bookable-dates-no-new-slots',
    description: 'Face Pilling bookable-dates GET does not insert scheduling_slots',
  },
  {
    id: 'get-day-slots-no-new-rows',
    description: 'Face Pilling day slots GET does not insert periods/slots',
  },
  {
    id: 'ephemeral-dates-still-nonempty-when-assignee-future-wiped',
    description: 'After wiping assignee future hours, GET still returns dates (ephemeral)',
  },
  {
    id: 'ephemeral-slots-still-nonempty',
    description: 'Day slots still non-empty after wipe without persisting',
  },
  {
    id: 'swedish-control-unaffected',
    description: 'Swedish massage bookable-dates still works (control)',
  },
  {
    id: 'empty-reason-when-no-past-pattern',
    description: 'Service with assignees but no past SERVICE_BLOCK gets emptyReason',
  },
  {
    id: 'second-get-still-no-persist',
    description: 'Second bookable-dates GET still adds zero rows',
  },
] as const;
