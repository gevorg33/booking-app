import type { CommandSurface } from './ai-command-registry.types.js';

/** acc-3.14 — any-provider booking scope corpus. */
export const ANY_PROVIDER_BOOKING_SEMANTIC_PIPE_MARKER = 'acc-3.14';

export type AnyProviderBookingSemanticScenario = {
  id: string;
  prompt: string;
  surface?: CommandSurface;
  mustDetect: boolean;
};

export const ANY_PROVIDER_BOOKING_POSITIVE_PROMPTS: AnyProviderBookingSemanticScenario[] =
  [
    {
      id: 'en-any-provider',
      prompt: 'book massage with any available provider tomorrow',
      mustDetect: true,
    },
    {
      id: 'en-any-stylist',
      prompt: 'schedule a cut with any stylist this week',
      mustDetect: true,
    },
    {
      id: 'en-whichever-specialist',
      prompt: 'reserve highlights with whichever specialist is free',
      mustDetect: true,
    },
    {
      id: 'en-whoever-available',
      prompt: 'book whoever is available for facial tomorrow',
      mustDetect: true,
    },
    {
      id: 'en-whoever-free',
      prompt: 'grab a slot with whoever is free for massage',
      mustDetect: true,
    },
    {
      id: 'en-any-employee',
      prompt: 'create booking with any employee for color services',
      mustDetect: true,
    },
    {
      id: 'en-any-specialists',
      prompt: 'book with any specialists for brows on Friday',
      mustDetect: true,
    },
    {
      id: 'hy-any-provider',
      prompt: 'ամրագրիր մասաժը ցանկացած ազատ մասնագետի հետ վաղը',
      mustDetect: true,
    },
    {
      id: 'ru-any-provider',
      prompt: 'запиши на массаж с любым свободным мастером завтра',
      mustDetect: true,
    },
    {
      id: 'customer-any-provider',
      prompt: 'book with any provider for lashes tomorrow evening',
      surface: 'customer',
      mustDetect: true,
    },
    {
      id: 'public-any-provider',
      prompt: 'schedule with any available stylist for haircut',
      surface: 'public',
      mustDetect: true,
    },
  ];

export const ANY_PROVIDER_BOOKING_NEGATIVE_PROMPTS: AnyProviderBookingSemanticScenario[] =
  [
    {
      id: 'en-named-provider',
      prompt: 'book massage with Gevorg tomorrow at 10:00',
      mustDetect: false,
    },
    {
      id: 'en-fixed-time',
      prompt: 'schedule facial with Maria at 14:30 tomorrow',
      mustDetect: false,
    },
    {
      id: 'en-team-wide-check-only',
      prompt: 'who is free tomorrow evening for permanent lashes',
      mustDetect: false,
    },
  ];

export const ANY_PROVIDER_BOOKING_SEMANTIC_SCENARIOS: AnyProviderBookingSemanticScenario[] =
  [
    ...ANY_PROVIDER_BOOKING_POSITIVE_PROMPTS,
    ...ANY_PROVIDER_BOOKING_NEGATIVE_PROMPTS,
  ];
