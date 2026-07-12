/** ai-cmd-provider-5.0.1 — provider mobile block a chunk of the calendar for something other than a booking (meeting, closure, admin), distinct from block_my_time (own break/lunch). */

export const PROVIDER_BLOCK_SCHEDULE_CLASSIFIER_RULES = `- block_schedule: MUTATE — provider mobile only: manager/team block on the calendar for a meeting, closure, or admin time — NOT the provider's own break/lunch. Triggers: block 2-3pm team meeting, block schedule Friday AM, block 14:00 to 15:00 for admin. NOT block_my_time (own break/lunch — "block my lunch/break").`;

export const PROVIDER_BLOCK_SCHEDULE_PROMPT_SCENARIOS = [
  { id: 'provider-block-schedule-team-meeting-en', prompt: 'Block 2-3pm team meeting', surface: 'provider' as const, expectedAction: 'block_schedule' },
  { id: 'provider-block-schedule-friday-am-en', prompt: 'Block schedule Friday AM', surface: 'provider' as const, expectedAction: 'block_schedule' },
  { id: 'provider-block-schedule-admin-en', prompt: 'Block 14:00 to 15:00 on the schedule for admin', surface: 'provider' as const, expectedAction: 'block_schedule' },
  { id: 'provider-block-schedule-closure-en', prompt: 'Block schedule this afternoon due to a closure', surface: 'provider' as const, expectedAction: 'block_schedule' },
  { id: 'provider-block-schedule-staff-training-en', prompt: 'Block 10-11am schedule — staff training', surface: 'provider' as const, expectedAction: 'block_schedule' },
  { id: 'provider-block-schedule-team-offsite-en', prompt: 'Block schedule Monday morning, team offsite', surface: 'provider' as const, expectedAction: 'block_schedule' },
  { id: 'provider-block-schedule-maintenance-en', prompt: 'Block the schedule 9 to 10 — equipment maintenance', surface: 'provider' as const, expectedAction: 'block_schedule' },
  { id: 'provider-block-schedule-inventory-en', prompt: 'Block schedule Thursday PM, inventory count', surface: 'provider' as const, expectedAction: 'block_schedule' },
  { id: 'provider-block-schedule-hy', prompt: 'Փակիր գրաֆիկը 14:00-15:00 թիմային հանդիպման համար', surface: 'provider' as const, expectedAction: 'block_schedule' },
  { id: 'provider-block-schedule-ru', prompt: 'Заблокируй расписание 14:00-15:00 для командной встречи', surface: 'provider' as const, expectedAction: 'block_schedule' },
] as const;
