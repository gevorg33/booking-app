import type { CommandSurface } from './ai-command-registry.types.js';

/** acc-3.14 — recommend specialists disambiguation corpus. */
export const RECOMMEND_SPECIALISTS_SEMANTIC_PIPE_MARKER = 'acc-3.14';

export type RecommendSpecialistsSemanticScenario = {
  id: string;
  prompt: string;
  surface?: CommandSurface;
  mustDetect: boolean;
};

export const RECOMMEND_SPECIALISTS_POSITIVE_PROMPTS: RecommendSpecialistsSemanticScenario[] =
  [
    {
      id: 'en-best-rated',
      prompt: 'best rated specialists for massage this week',
      mustDetect: true,
    },
    {
      id: 'en-suggest-top',
      prompt: 'suggest top specialists for haircut on Monday',
      mustDetect: true,
    },
    {
      id: 'en-highest-rated',
      prompt: 'who are the highest rated lash specialists',
      mustDetect: true,
    },
    {
      id: 'en-recommend-providers',
      prompt: 'recommend the best providers for color services',
      mustDetect: true,
    },
    {
      id: 'en-top-stylists',
      prompt: 'show me the top stylists for highlights',
      mustDetect: true,
    },
    {
      id: 'en-best-specialists',
      prompt: 'best specialists for facial tomorrow',
      mustDetect: true,
    },
    {
      id: 'en-highly-reviewed',
      prompt: 'highly reviewed therapists for massage',
      mustDetect: true,
    },
    {
      id: 'en-who-is-best',
      prompt: 'who is the best specialist for brows',
      mustDetect: true,
    },
    {
      id: 'hy-best-specialist',
      prompt: 'առաջարկիր լավագույն մասնագետներին մերսման համար',
      mustDetect: true,
    },
    {
      id: 'ru-best-specialist',
      prompt: 'порекомендуй лучших мастеров для массажа',
      mustDetect: true,
    },
    {
      id: 'public-best-rated',
      prompt: 'best rated massage therapist this week',
      surface: 'public',
      mustDetect: true,
    },
  ];

export const RECOMMEND_SPECIALISTS_NEGATIVE_PROMPTS: RecommendSpecialistsSemanticScenario[] =
  [
    {
      id: 'en-plain-availability',
      prompt: 'free slots on Monday for Gevorg',
      mustDetect: false,
    },
    {
      id: 'en-team-wide-free',
      prompt: 'who is free tomorrow evening for lashes',
      mustDetect: false,
    },
    {
      id: 'en-staff-revenue',
      prompt: 'Top 3 specialists by revenue last week',
      mustDetect: false,
    },
    {
      id: 'en-named-check',
      prompt: 'is Gevorg available for massage tomorrow at 09:00',
      mustDetect: false,
    },
  ];

export const RECOMMEND_SPECIALISTS_SEMANTIC_SCENARIOS: RecommendSpecialistsSemanticScenario[] =
  [
    ...RECOMMEND_SPECIALISTS_POSITIVE_PROMPTS,
    ...RECOMMEND_SPECIALISTS_NEGATIVE_PROMPTS,
  ];
