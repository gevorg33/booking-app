import {
  buildRagContextBlock,
  resolveRagContextFromSettings,
  scoreRagDocument,
  selectRagDocuments,
  tokenizeForRag,
} from './ai-rag.util.js';

describe('ai-rag.util', () => {
  const docs = [
    {
      id: '1',
      title: 'Holiday closure SOP',
      content:
        'Close all providers on public holidays and notify waitlist customers.',
      type: 'sop' as const,
      enabled: true,
    },
    {
      id: '2',
      title: 'Lunch break policy',
      content: 'Block 12:00-13:00 for providers on weekdays.',
      type: 'business_note' as const,
      enabled: false,
    },
  ];

  it('tokenizes and scores documents', () => {
    expect(tokenizeForRag('Holiday waitlist')).toContain('holiday');
    expect(
      scoreRagDocument(docs[0], 'holiday waitlist closure'),
    ).toBeGreaterThan(0);
    expect(scoreRagDocument(docs[1], 'holiday waitlist')).toBe(0);
  });

  it('selects top matching enabled documents', () => {
    const selected = selectRagDocuments(docs, 'holiday waitlist', 1);
    expect(selected).toHaveLength(1);
    expect(selected[0].id).toBe('1');
  });

  it('sorts equally scored documents deterministically', () => {
    const tied = [
      {
        id: 'a',
        title: 'Holiday alpha',
        content: 'holiday waitlist',
        type: 'sop' as const,
        enabled: true,
      },
      {
        id: 'b',
        title: 'Holiday beta',
        content: 'holiday waitlist',
        type: 'sop' as const,
        enabled: true,
      },
    ];
    expect(selectRagDocuments(tied, 'holiday waitlist', 2)).toHaveLength(2);
  });

  it('builds RAG context block', () => {
    expect(buildRagContextBlock([])).toBe('');
    expect(buildRagContextBlock([docs[0]])).toContain('Holiday closure SOP');
  });

  it('ignores documents with zero relevance score', () => {
    expect(selectRagDocuments(docs, 'unrelated topic xyz')).toEqual([]);
  });

  it('tokenizeForRag drops short tokens', () => {
    expect(tokenizeForRag('a be holiday')).toEqual(['holiday']);
  });

  it('tokenizeForRag preserves Cyrillic and Armenian tokens', () => {
    expect(tokenizeForRag('Запиши на ближайшее свободное время')).toContain(
      'запиши',
    );
    expect(tokenizeForRag('Ով ունի ազատ slot')).toContain('ունի');
  });

  it('resolveRagContextFromSettings handles all rag settings states', () => {
    expect(resolveRagContextFromSettings({}, 'holiday')).toBe('');
    expect(
      resolveRagContextFromSettings(
        { rag: { enabled: false, documents: [] } },
        'holiday',
      ),
    ).toBe('');
    expect(
      resolveRagContextFromSettings(
        { rag: { enabled: true } },
        'holiday waitlist',
      ),
    ).toBe('');
    expect(
      resolveRagContextFromSettings(
        {
          rag: {
            enabled: true,
            documents: [docs[0]],
          },
        },
        'holiday waitlist',
      ),
    ).toContain('Holiday closure SOP');
  });
});
