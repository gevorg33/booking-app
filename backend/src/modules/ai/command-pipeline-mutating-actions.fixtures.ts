/** pipe-1.9.1 — low-confidence guard for pipeline-resolved mutating intents. */
export const PIPELINE_MUTATING_ACTIONS_PIPE_MARKER = 'pipe-1.9.1';

/** Schedule intents the understand pipeline can resolve to execute paths. */
export const PIPELINE_SCHEDULE_RESOLVED_INTENTS = [
  'create_direct_schedule',
  'clear_schedule',
  'apply_schedule',
  'block_schedule',
  'fill_unused_slots',
  'setup_week_schedule',
  'swap_schedules',
  'rebalance_capacity',
  'holiday_mode',
  'onboard_provider_schedule',
  'create_schedule_template',
] as const;

export type PipelineScheduleResolvedIntent =
  (typeof PIPELINE_SCHEDULE_RESOLVED_INTENTS)[number];

export type PipelineMutatingGuardScenario = {
  id: string;
  action: string;
  confidence: number;
  lowThreshold: number;
  expectBlock: boolean;
};

export const PIPELINE_MUTATING_GUARD_SCENARIOS: PipelineMutatingGuardScenario[] =
  [
    {
      id: 'create-direct-schedule-low-confidence',
      action: 'create_direct_schedule',
      confidence: 0.42,
      lowThreshold: 0.55,
      expectBlock: true,
    },
    {
      id: 'create-direct-schedule-high-confidence',
      action: 'create_direct_schedule',
      confidence: 0.88,
      lowThreshold: 0.55,
      expectBlock: false,
    },
    {
      id: 'clear-schedule-low-confidence',
      action: 'clear_schedule',
      confidence: 0.3,
      lowThreshold: 0.55,
      expectBlock: true,
    },
    {
      id: 'apply-schedule-low-confidence',
      action: 'apply_schedule',
      confidence: 0.48,
      lowThreshold: 0.55,
      expectBlock: true,
    },
    {
      id: 'summarize-bookings-read-only',
      action: 'summarize_bookings',
      confidence: 0.2,
      lowThreshold: 0.55,
      expectBlock: false,
    },
    {
      id: 'list-bookings-read-only',
      action: 'list_bookings',
      confidence: 0.2,
      lowThreshold: 0.55,
      expectBlock: false,
    },
  ];
