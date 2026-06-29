/** NL navigation prompts for multi-turn guide sessions (ai-guide-1.8.2). */
export const GUIDE_MULTITURN_NEXT_PROMPTS = [
  'next step',
  'what is the next step',
  "what's next",
  'continue',
  'go on',
  'keep going',
] as const;

export const GUIDE_MULTITURN_BACK_PROMPTS = [
  'go back',
  'previous step',
  'back one step',
  'step back',
] as const;

export const GUIDE_MULTITURN_RESTART_PROMPTS = [
  'start over',
  'restart',
  'from the beginning',
  'begin again',
] as const;

export const GUIDE_MULTITURN_SCENARIO_FIXTURES = [
  ...GUIDE_MULTITURN_NEXT_PROMPTS.map((prompt, index) => ({
    id: `guide-multiturn-next-${index + 1}`,
    prompt,
    navigation: 'next' as const,
  })),
  ...GUIDE_MULTITURN_BACK_PROMPTS.map((prompt, index) => ({
    id: `guide-multiturn-back-${index + 1}`,
    prompt,
    navigation: 'back' as const,
  })),
  ...GUIDE_MULTITURN_RESTART_PROMPTS.map((prompt, index) => ({
    id: `guide-multiturn-restart-${index + 1}`,
    prompt,
    navigation: 'restart' as const,
  })),
];
