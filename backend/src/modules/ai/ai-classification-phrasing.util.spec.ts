import {
  applyPhrasingMemoryToClassifiedIntent,
  buildPhrasingMemoryBlock,
  extractDeterministicPhrasingAliases,
  findPhrasingMemoryHits,
  inferBookingActionFromPhrasing,
  inferIntentBiasFromPhrasing,
  matchBusinessAliasIntent,
} from './ai-classification-phrasing.util.js';

describe('ai-classification-phrasing.util (acc-3.2)', () => {
  const memory = {
    aliases: {
      gevorg: { employeeName: 'Gevorg' },
      usual: { serviceName: 'Face massage', employeeName: 'Anna' },
      'the usual': { serviceName: 'Face massage', employeeName: 'Anna' },
      facemassage: { serviceName: 'Face massage' },
    },
  };

  it('findPhrasingMemoryHits matches nicknames and multi-word aliases', () => {
    const hits = findPhrasingMemoryHits(
      'book the usual with gevorg tomorrow',
      memory,
      'dashboard',
    );
    expect(hits.map((hit) => hit.alias)).toEqual(
      expect.arrayContaining(['gevorg', 'the usual']),
    );
    expect(hits[0]?.suggestedAction).toBe('create_booking');
  });

  it('buildPhrasingMemoryBlock surfaces likely_action bias for classifier', () => {
    const hits = findPhrasingMemoryHits(
      'book the usual tomorrow at 14:00',
      memory,
      'dashboard',
    );
    const block = buildPhrasingMemoryBlock(hits, 'dashboard');
    expect(block).toContain('Business phrasing memory');
    expect(block).toContain('likely_action=create_booking');
    expect(block).toContain('Face massage');
  });

  it('inferIntentBiasFromPhrasing boosts booking intents on dashboard', () => {
    const hits = findPhrasingMemoryHits(
      'schedule the usual with gevorg',
      memory,
      'dashboard',
    );
    const bias = inferIntentBiasFromPhrasing(hits, 'schedule the usual with gevorg', 'dashboard');
    expect(bias.boostIntents).toContain('create_booking');
    expect(bias.suggestedParams.serviceName).toBe('Face massage');
  });

  it('inferBookingActionFromPhrasing maps customer nearest phrasing', () => {
    expect(
      inferBookingActionFromPhrasing(
        'book the nearest slot for massage',
        'customer',
        { serviceName: 'Massage' },
      ),
    ).toBe('book_nearest_slot');
  });

  it('applyPhrasingMemoryToClassifiedIntent rescues unknown with habitual phrase', () => {
    const enriched = applyPhrasingMemoryToClassifiedIntent(
      { action: 'unknown', params: {} },
      'the usual tomorrow at 2pm',
      'dashboard',
      memory,
    );
    expect(enriched.action).toBe('create_booking');
    expect(enriched.params?.serviceName).toBe('Face massage');
    expect(enriched.params?._classificationSource).toBe('phrasing_memory');
  });

  it('matchBusinessAliasIntent returns business_alias semantic match', () => {
    const match = matchBusinessAliasIntent(
      'book facemassage with gevorg',
      'dashboard',
      memory,
    );
    expect(match?.action).toBe('create_booking');
    expect(match?.source).toBe('business_alias');
  });

  it('extractDeterministicPhrasingAliases learns the usual and nicknames', () => {
    const aliases = extractDeterministicPhrasingAliases(
      'Book the usual with Gevorg tomorrow',
      {
        employee: 'Gevorg',
        service: 'Face massage',
      },
    );
    expect(aliases['the usual']).toEqual({
      employeeName: 'Gevorg',
      serviceName: 'Face massage',
      customerName: null,
    });
    expect(aliases.gevorg?.employeeName).toBe('Gevorg');
  });
});
