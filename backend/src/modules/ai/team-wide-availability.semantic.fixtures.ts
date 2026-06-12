import type { CommandSurface } from './ai-command-registry.types.js';

/** pipe-1.13.2 / acc-3.14 — team-wide availability paraphrase corpus. */
export const TEAM_WIDE_AVAILABILITY_SEMANTIC_PIPE_MARKER = 'pipe-1.13.2';

export type TeamWideAvailabilitySemanticScenario = {
  id: string;
  prompt: string;
  surface?: CommandSurface;
  mustDetect: boolean;
};

export const TEAM_WIDE_AVAILABILITY_POSITIVE_PROMPTS: TeamWideAvailabilitySemanticScenario[] =
  [
    {
      id: 'en-who-is-free',
      prompt: 'who is free tomorrow evening for permanent lashes',
      mustDetect: true,
    },
    {
      id: 'en-who-has-availability',
      prompt: 'who has availability tomorrow for massage',
      mustDetect: true,
    },
    {
      id: 'en-who-has-free-slot',
      prompt: 'who has a free slot for highlights tomorrow',
      mustDetect: true,
    },
    {
      id: 'en-free-slots-for',
      prompt: 'any free slots for facial on Friday afternoon',
      mustDetect: true,
    },
    {
      id: 'en-who-can-do',
      prompt: 'who can do color services tomorrow',
      mustDetect: true,
    },
    {
      id: 'en-who-is-doing',
      prompt: 'who is doing facemassage today',
      mustDetect: true,
    },
    {
      id: 'en-who-can-perform',
      prompt: 'who can perform brow shaping this week',
      mustDetect: true,
    },
    {
      id: 'en-check-who-free',
      prompt: 'check who is free tomorrow evening for massage',
      mustDetect: true,
    },
    {
      id: 'hy-who-is-free',
      prompt: 'Ով է ազատ վաղը երեկոյան permanent lashes-ի համար',
      mustDetect: true,
    },
    {
      id: 'ru-who-is-free',
      prompt: 'Кто свободен завтра вечером для permanent lashes',
      mustDetect: true,
    },
    {
      id: 'public-who-is-free',
      prompt: 'who is free tomorrow evening for permanent lashes',
      surface: 'public',
      mustDetect: true,
    },
    {
      id: 'customer-who-available',
      prompt: 'who is available tomorrow evening for lashes',
      surface: 'customer',
      mustDetect: true,
    },
  ];

export const TEAM_WIDE_AVAILABILITY_NEGATIVE_PROMPTS: TeamWideAvailabilitySemanticScenario[] =
  [
    {
      id: 'en-named-provider',
      prompt: 'is Gevorg available for massage tomorrow at 09:00',
      mustDetect: false,
    },
    {
      id: 'en-check-named-availability',
      prompt: 'check availability for Gevorg tomorrow at 14:00 for massage',
      mustDetect: false,
    },
    {
      id: 'en-public-named-slots',
      prompt: 'free slots on Monday for Gevorg for massage',
      mustDetect: false,
    },
    {
      id: 'en-fixed-time-booking',
      prompt: 'book massage with Gevorg tomorrow at 10:00',
      mustDetect: false,
    },
  ];

export const TEAM_WIDE_AVAILABILITY_SEMANTIC_SCENARIOS: TeamWideAvailabilitySemanticScenario[] =
  [
    ...TEAM_WIDE_AVAILABILITY_POSITIVE_PROMPTS,
    ...TEAM_WIDE_AVAILABILITY_NEGATIVE_PROMPTS,
  ];
