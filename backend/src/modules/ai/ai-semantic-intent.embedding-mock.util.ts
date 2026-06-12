import { getIntentAnchorBank } from './intent-anchor.bank.js';

/** Deterministic unit vectors for cosine tests (pipe-1.4.3). */
const ANCHOR_EMBED_VECTORS: Record<string, number[]> = {
  'en-implied-haircut-need': [1, 0, 0],
  'en-book-first-available': [0.95, 0.05, 0],
  'en-asap-booking': [0.5, 0.5, 0],
  'en-book-gap-soonest': [0.3, 0.3, 0.4],
  'en-book-nearest-slot': [0, 1, 0],
  'en-check-who-free': [0, 0, 1],
};

const PROMPT_EMBED_VECTORS: Array<{ pattern: RegExp; vector: number[] }> = [
  {
    pattern: /\bhair\b.*\blong\b|\blong\b.*\bhair\b/i,
    vector: [0.98, 0.02, 0],
  },
  {
    pattern: /\bwho\b.*\bfree\b/i,
    vector: [0.02, 0.02, 0.98],
  },
];

function normalizeEmbedText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[,.!?;:]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function vectorForAnchorPhrase(text: string): number[] | null {
  const normalized = normalizeEmbedText(text);
  const anchor = getIntentAnchorBank().find(
    (entry) => normalizeEmbedText(entry.phrase) === normalized,
  );
  if (!anchor) return null;
  return ANCHOR_EMBED_VECTORS[anchor.id] ?? [0, 0, 0.5];
}

/**
 * Mock `OpenAiGatewayService.embedText` with stable cosine geometry for tests.
 */
export function buildDeterministicSemanticEmbedMock(): jest.Mock {
  return jest.fn(async (_context: { operation?: string }, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return null;

    const anchorVector = vectorForAnchorPhrase(trimmed);
    if (anchorVector) return anchorVector;

    for (const entry of PROMPT_EMBED_VECTORS) {
      if (entry.pattern.test(trimmed)) return entry.vector;
    }

    return [0.1, 0.1, 0.9];
  });
}
