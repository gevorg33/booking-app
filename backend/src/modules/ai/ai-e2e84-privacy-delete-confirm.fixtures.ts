/**
 * e2e-bug.84 — privacy_delete anonymized on the first turn with no confirmation.
 * First turn must preview; only confirm=true (or affirmative after pending) executes.
 */
export const E2E84_PRIVACY_DELETE_FIRST_TURN = [
  {
    id: 'e2e84-delete-all-personal-data',
    prompt: 'I want to delete all my personal data from your system',
  },
  {
    id: 'e2e84-delete-my-account-data',
    prompt: 'Delete my account data',
  },
  {
    id: 'e2e84-anonymize-my-account',
    prompt: 'Anonymize my account',
  },
] as const;

export const E2E84_PRIVACY_DELETE_AFFIRMATIONS = [
  { id: 'e2e84-yes', prompt: 'yes' },
  { id: 'e2e84-confirm', prompt: 'confirm' },
  { id: 'e2e84-go-ahead', prompt: 'go ahead' },
] as const;
