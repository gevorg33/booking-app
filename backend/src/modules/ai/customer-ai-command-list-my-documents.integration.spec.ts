import { rescueListMyDocumentsIntent } from './ai-list-my-documents.util.js';
import { LIST_MY_DOCUMENTS_PROMPTS } from './ai-list-my-documents.fixtures.js';
import { LIST_MY_DOCUMENTS_MULTILINGUAL_SCENARIOS } from './ai-list-my-documents-multilingual.fixtures.js';

describe('customer-ai-command list_my_documents integration (ai-cmd-customer-4.14.5)', () => {
  it.each(
    [
      ...LIST_MY_DOCUMENTS_PROMPTS,
      ...LIST_MY_DOCUMENTS_MULTILINGUAL_SCENARIOS,
    ].map((row) => [row.id, row.prompt] as const),
  )('rescues list_my_documents for $0', (_id, prompt) => {
    expect(rescueListMyDocumentsIntent(prompt, 'unknown')?.action).toBe(
      'list_my_documents',
    );
  });
});
