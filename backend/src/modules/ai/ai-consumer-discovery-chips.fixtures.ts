/** Consumer assistant discover chips → canonical budget/rank/avail fixture prompts (discover-1.4). */

export type ConsumerDiscoveryChipFixture = {
  id: string;
  /** Short chip label shown in the consumer assistant empty state. */
  label: string;
  /** Full prompt sent to the customer AI pipeline on chip tap. */
  prompt: string;
  /** Source scenario id in budget / rank / avail fixture files. */
  fixtureId: string;
  domain: 'budget' | 'rank' | 'availability';
};

export const CONSUMER_DISCOVERY_CHIP_FIXTURES: readonly ConsumerDiscoveryChipFixture[] =
  [
    {
      id: 'discover-chip-under-50-en',
      label: 'Under $50',
      prompt: 'Services under $50',
      fixtureId: 'budget-voice-chip-en',
      domain: 'budget',
    },
    {
      id: 'discover-chip-premium-en',
      label: 'Premium services',
      prompt: 'Premium services',
      fixtureId: 'rank-voice-chip-en',
      domain: 'rank',
    },
    {
      id: 'discover-chip-evening-weekend-en',
      label: 'Evening or weekend slots',
      prompt: 'Evening or weekend slots for a facial',
      fixtureId: 'avail-voice-chip-en',
      domain: 'availability',
    },
  ] as const;

export const CONSUMER_DISCOVERY_CHIP_FIXTURE_IDS = CONSUMER_DISCOVERY_CHIP_FIXTURES.map(
  (chip) => chip.id,
);
