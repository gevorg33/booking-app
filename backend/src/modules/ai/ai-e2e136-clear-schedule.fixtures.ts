/**
 * e2e-bug.136 — unblock / remove block must route to delete_schedule_block
 * (not clear_schedule false-success on zero period deletes).
 */
export const E2E136_DELETE_SCHEDULE_BLOCK_SCENARIOS = [
  {
    id: 'unblock-tomorrow',
    prompt:
      "Unblock Gevorg's schedule for tomorrow, 18/07/2026, remove the full-day block I just created",
    expectedAction: 'delete_schedule_block' as const,
    rescueReason: 'delete_schedule_block_heuristic',
  },
  {
    id: 'remove-full-day-block',
    prompt: 'Remove the full-day block for Maria on Friday',
    expectedAction: 'delete_schedule_block' as const,
    rescueReason: 'delete_schedule_block_heuristic',
  },
  {
    id: 'delete-lunch-block',
    prompt: "Delete Gevorg's lunch block tomorrow",
    expectedAction: 'delete_schedule_block' as const,
    rescueReason: 'delete_schedule_block_heuristic',
  },
  {
    id: 'clear-the-block',
    prompt: 'Clear the schedule block for Anna on 18/07/2026',
    expectedAction: 'delete_schedule_block' as const,
    rescueReason: 'delete_schedule_block_heuristic',
  },
] as const;

/** Applied-schedule cleanup must still rescue to clear_schedule. */
export const E2E136_CLEAR_SCHEDULE_STILL_ROUTES = [
  {
    id: 'clear-applied-schedule',
    prompt: 'Clear Gevorg schedule for tomorrow',
    expectedAction: 'clear_schedule' as const,
  },
  {
    id: 'wipe-applied-schedule',
    prompt: 'Wipe Karo schedule Friday',
    expectedAction: 'clear_schedule' as const,
  },
] as const;
