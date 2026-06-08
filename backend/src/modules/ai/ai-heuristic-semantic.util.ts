import { tokenizeForRag } from './ai-rag.util.js';
import {
  HEURISTIC_SEMANTIC_MIN_SCORE,
  HEURISTIC_SEMANTIC_PHRASES,
  type HeuristicSemanticPhrase,
  type HeuristicSemanticTag,
} from './ai-heuristic-semantic.fixtures.js';

export { HEURISTIC_SEMANTIC_MIN_SCORE, HEURISTIC_SEMANTIC_PHRASES } from './ai-heuristic-semantic.fixtures.js';

function normalizeHeuristicPrompt(prompt: string): string {
  return prompt.trim().toLowerCase();
}

/** Phrase-coverage score: fraction of canonical phrase tokens found in the user prompt. */
export function scoreHeuristicPhraseCoverage(
  prompt: string,
  phrase: string,
): number {
  const promptLower = normalizeHeuristicPrompt(prompt);
  const phraseTokens = tokenizeForRag(phrase);
  if (phraseTokens.length === 0) return 0;

  const normalizedPhrase = phrase.trim().toLowerCase();
  if (normalizedPhrase.length >= 8 && promptLower.includes(normalizedPhrase)) {
    return 1;
  }

  let hits = 0;
  for (const token of phraseTokens) {
    if (promptLower.includes(token)) hits += 1;
  }
  return hits / phraseTokens.length;
}

export function rankHeuristicSemanticPhrases(
  prompt: string,
  bank: HeuristicSemanticPhrase[] = HEURISTIC_SEMANTIC_PHRASES,
  tag?: HeuristicSemanticTag,
): Array<{ entry: HeuristicSemanticPhrase; score: number }> {
  const filtered = tag ? bank.filter((entry) => entry.tag === tag) : bank;
  return filtered
    .map((entry) => ({
      entry,
      score: scoreHeuristicPhraseCoverage(prompt, entry.phrase),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id));
}

export function matchHeuristicSemanticBoolean(
  prompt: string,
  tag: 'first_available_booking' | 'team_wide_provider_availability',
  minScore = HEURISTIC_SEMANTIC_MIN_SCORE,
): boolean {
  const ranked = rankHeuristicSemanticPhrases(prompt, HEURISTIC_SEMANTIC_PHRASES, tag);
  return (ranked[0]?.score ?? 0) >= minScore;
}

export function matchHeuristicSemanticMetric<T extends string>(
  prompt: string,
  tag:
    | 'booking_metric'
    | 'staff_metric'
    | 'service_metric'
    | 'customer_metric'
    | 'appointment_metric',
  minScore = HEURISTIC_SEMANTIC_MIN_SCORE,
): T | null {
  const ranked = rankHeuristicSemanticPhrases(
    prompt,
    HEURISTIC_SEMANTIC_PHRASES.filter((entry) => entry.tag === tag && entry.value),
    tag,
  );
  const best = ranked[0];
  if (!best || best.score < minScore || !best.entry.value) return null;
  return best.entry.value as T;
}
