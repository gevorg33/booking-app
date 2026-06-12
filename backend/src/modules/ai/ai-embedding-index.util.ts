import { cosineSimilarityVectors } from './ai-semantic-intent.util.js';

export interface EmbeddingIndexEntry<TMeta = Record<string, unknown>> {
  id: string;
  text: string;
  embedding?: number[];
  metadata?: TMeta;
}

export interface EmbeddingSearchHit<TMeta = Record<string, unknown>> {
  id: string;
  text: string;
  score: number;
  metadata?: TMeta;
}

export class EmbeddingIndex<TMeta = Record<string, unknown>> {
  private readonly entries = new Map<string, EmbeddingIndexEntry<TMeta>>();

  register(entry: EmbeddingIndexEntry<TMeta>): void {
    this.entries.set(entry.id, entry);
  }

  registerMany(entries: EmbeddingIndexEntry<TMeta>[]): void {
    for (const entry of entries) this.register(entry);
  }

  setEmbedding(id: string, embedding: number[]): void {
    const entry = this.entries.get(id);
    if (!entry) return;
    entry.embedding = embedding;
  }

  get(id: string): EmbeddingIndexEntry<TMeta> | undefined {
    return this.entries.get(id);
  }

  get size(): number {
    return this.entries.size;
  }

  embeddedCount(): number {
    let count = 0;
    for (const entry of this.entries.values()) {
      if (entry.embedding?.length) count += 1;
    }
    return count;
  }

  values(): IterableIterator<EmbeddingIndexEntry<TMeta>> {
    return this.entries.values();
  }

  searchByEmbedding(
    queryEmbedding: number[],
    options: {
      limit?: number;
      minScore?: number;
      filter?: (entry: EmbeddingIndexEntry<TMeta>) => boolean;
    } = {},
  ): EmbeddingSearchHit<TMeta>[] {
    const hits: EmbeddingSearchHit<TMeta>[] = [];
    for (const entry of this.entries.values()) {
      if (!entry.embedding?.length) continue;
      if (options.filter && !options.filter(entry)) continue;
      const score = cosineSimilarityVectors(queryEmbedding, entry.embedding);
      if (options.minScore !== undefined && score < options.minScore) continue;
      hits.push({
        id: entry.id,
        text: entry.text,
        score,
        metadata: entry.metadata,
      });
    }
    hits.sort((a, b) => b.score - a.score);
    return hits.slice(0, options.limit ?? hits.length);
  }
}
