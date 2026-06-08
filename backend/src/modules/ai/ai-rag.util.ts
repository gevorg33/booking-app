import type { AiRagSettings } from './ai-settings.types.js';

export type RagDocumentType =
  | 'sop'
  | 'playbook_note'
  | 'business_note'
  | 'past_plan';

export interface RagDocument {
  id: string;
  title: string;
  content: string;
  type: RagDocumentType;
  enabled: boolean;
  keywords?: string[];
}

export const DEFAULT_RAG_CHUNK_LIMIT = 3;
export const RAG_CONTENT_SNIPPET_LIMIT = 800;

export function tokenizeForRag(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 2);
}

export function scoreRagDocument(doc: RagDocument, prompt: string): number {
  if (!doc.enabled) return 0;

  const tokens = tokenizeForRag(prompt);
  const haystack =
    `${doc.title} ${doc.content} ${(doc.keywords ?? []).join(' ')}`.toLowerCase();

  let score = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) score += 1;
  }
  return score;
}

export function selectRagDocuments(
  documents: RagDocument[],
  prompt: string,
  limit = DEFAULT_RAG_CHUNK_LIMIT,
): RagDocument[] {
  return documents
    .map((doc) => ({ doc, score: scoreRagDocument(doc, prompt) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.doc);
}

export function buildRagContextBlock(documents: RagDocument[]): string {
  if (documents.length === 0) return '';

  const sections = documents.map(
    (doc) =>
      `### ${doc.title} (${doc.type})\n${doc.content.slice(0, RAG_CONTENT_SNIPPET_LIMIT)}`,
  );

  return `Relevant business knowledge (optional context for planning):\n${sections.join('\n\n')}`;
}

export function resolveRagContextFromSettings(
  settings: { rag?: AiRagSettings },
  prompt: string,
): string {
  const rag = settings.rag;
  if (!rag || !rag.enabled) return '';
  return buildRagContextBlock(selectRagDocuments(rag.documents ?? [], prompt));
}
