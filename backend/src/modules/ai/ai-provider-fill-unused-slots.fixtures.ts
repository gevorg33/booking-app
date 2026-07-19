/** ai-cmd-provider-5.6.2 — provider mobile "fill unused slots" schedule-gap mutate (own calendar; team view for managers). */

export const PROVIDER_FILL_UNUSED_SLOTS_PROMPT_SCENARIOS = [
  {
    id: 'fill-unused-slots-today-en',
    prompt: 'Fill unused slots today',
    surface: 'provider' as const,
    expectedAction: 'fill_unused_slots',
  },
  {
    id: 'fill-unused-slots-gap-personal-en',
    prompt: 'Fill unused slots 4 to 5',
    surface: 'provider' as const,
    expectedAction: 'fill_unused_slots',
  },
  {
    id: 'fill-unused-slots-optimize-gaps-en',
    prompt: 'Optimize my open slots',
    surface: 'provider' as const,
    expectedAction: 'fill_unused_slots',
  },
  {
    id: 'fill-unused-slots-2pm-en',
    prompt: 'Fill the 2pm slot',
    surface: 'provider' as const,
    expectedAction: 'fill_unused_slots',
  },
  {
    id: 'fill-unused-slots-afternoon-en',
    prompt: 'Fill my afternoon gaps',
    surface: 'provider' as const,
    expectedAction: 'fill_unused_slots',
  },
  {
    id: 'fill-unused-slots-optimize-utilization-en',
    prompt: 'Optimize my unused slots this week',
    surface: 'provider' as const,
    expectedAction: 'fill_unused_slots',
  },
  {
    id: 'fill-unused-slots-open-slots-en',
    prompt: 'Fill my open slots',
    surface: 'provider' as const,
    expectedAction: 'fill_unused_slots',
  },
  {
    id: 'fill-unused-slots-between-en',
    prompt: 'Fill the empty slot right now',
    surface: 'provider' as const,
    expectedAction: 'fill_unused_slots',
  },
  {
    id: 'fill-unused-slots-optimize-schedule-en',
    prompt: 'Optimize my unused slots today',
    surface: 'provider' as const,
    expectedAction: 'fill_unused_slots',
  },
  {
    id: 'fill-unused-slots-3pm-en',
    prompt: 'Fill unused slot at 3pm',
    surface: 'provider' as const,
    expectedAction: 'fill_unused_slots',
  },
  {
    id: 'fill-unused-slots-hy',
    prompt: 'Fill արա իմ ազատ gaps-ը այսօր',
    surface: 'provider' as const,
    expectedAction: 'fill_unused_slots',
  },
  {
    id: 'fill-unused-slots-optimize-hy',
    prompt: 'Optimize արա իմ open slots-ը',
    surface: 'provider' as const,
    expectedAction: 'fill_unused_slots',
  },
  {
    id: 'fill-unused-slots-ru',
    prompt: 'Проведи fill для gaps в моём расписании',
    surface: 'provider' as const,
    expectedAction: 'fill_unused_slots',
  },
  {
    id: 'fill-unused-slots-optimize-ru',
    prompt: 'Optimize мои open slots',
    surface: 'provider' as const,
    expectedAction: 'fill_unused_slots',
  },
] as const;
