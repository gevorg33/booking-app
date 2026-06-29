import {
  CONSUMER_COPY_EN,
  CONSUMER_COPY_HY,
  CONSUMER_COPY_RU,
  CONSUMER_DISCOVERY_CHIP_COPY_CATALOG,
} from './consumer-copy-catalog.js';
import {
  CONSUMER_DISCOVERY_CHIP_IDS,
  getConsumerDiscoveryChips,
} from './consumer-discovery-chips.js';
import { interpolateAssistantTemplate } from './assistant-example-tenant.util.js';

describe('consumer-discovery-chips (discover-1.4 / discover-exit-4)', () => {
  it('documents discover chips in copy catalog with backend fixture ids', () => {
    expect(CONSUMER_DISCOVERY_CHIP_COPY_CATALOG.map((row) => row.id)).toEqual([
      'discover-chip-under-50-en',
      'discover-chip-premium-en',
      'discover-chip-evening-weekend-en',
    ]);
    expect(CONSUMER_DISCOVERY_CHIP_IDS).toEqual(
      CONSUMER_DISCOVERY_CHIP_COPY_CATALOG.map((row) => row.id),
    );
    expect(CONSUMER_DISCOVERY_CHIP_COPY_CATALOG.map((row) => row.fixtureId)).toEqual([
      'budget-voice-chip-en',
      'rank-voice-chip-en',
      'avail-voice-chip-en',
    ]);
    expect(CONSUMER_DISCOVERY_CHIP_COPY_CATALOG.map((row) => row.domain)).toEqual([
      'budget',
      'rank',
      'availability',
    ]);
  });

  it('ships three discover chips with labels and fixture prompts', () => {
    const chips = getConsumerDiscoveryChips(CONSUMER_COPY_EN);
    expect(chips.map((chip) => chip.id)).toEqual([...CONSUMER_DISCOVERY_CHIP_IDS]);
    for (const row of CONSUMER_DISCOVERY_CHIP_COPY_CATALOG) {
      const chip = chips.find((entry) => entry.id === row.id);
      expect(chip?.label).toBe(row.en.label);
      const expectedPrompt =
        row.id === 'discover-chip-evening-weekend-en'
          ? interpolateAssistantTemplate(row.en.prompt, {
              service: CONSUMER_COPY_EN.assistantFallbackService,
            })
          : row.en.prompt;
      expect(chip?.prompt).toBe(expectedPrompt);
    }
  });

  it('documents backend eval golden prompt for availability chip', () => {
    const row = CONSUMER_DISCOVERY_CHIP_COPY_CATALOG.find(
      (entry) => entry.id === 'discover-chip-evening-weekend-en',
    );
    expect(row?.fixturePrompt).toBe('Evening or weekend slots for a facial');
    expect(row?.en.prompt).toBe('Evening or weekend slots for {service}');
  });

  it('keeps EN prompt templates on hy and ru locales', () => {
    for (const localeCopy of [CONSUMER_COPY_HY, CONSUMER_COPY_RU]) {
      for (const row of CONSUMER_DISCOVERY_CHIP_COPY_CATALOG) {
        expect(localeCopy[row.promptKey]).toBe(row.en.prompt);
      }
    }
  });
});
