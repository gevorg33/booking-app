import { EmbeddingIndex } from './ai-embedding-index.util.js';

describe('EmbeddingIndex', () => {
  it('searches by cosine similarity', () => {
    const index = new EmbeddingIndex<{ action: string }>();
    index.register({
      id: 'a',
      text: 'book first available',
      embedding: [1, 0, 0],
      metadata: { action: 'create_booking' },
    });
    index.register({
      id: 'b',
      text: 'clear schedule',
      embedding: [0, 1, 0],
      metadata: { action: 'clear_schedule' },
    });

    const hits = index.searchByEmbedding([0.95, 0.05, 0], { limit: 1 });
    expect(hits[0]?.id).toBe('a');
    expect(hits[0]?.score).toBeGreaterThan(0.9);
  });
});
