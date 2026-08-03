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
  {
    id: 'e2e84-erase-my-personal-data',
    prompt: 'Erase my personal data',
  },
  {
    id: 'e2e84-gdpr-delete-my-data',
    prompt: 'GDPR delete my data',
  },
  {
    id: 'e2e84-right-to-be-forgotten',
    prompt: 'Right to be forgotten — delete my data',
  },
] as const;

export const E2E84_PRIVACY_DELETE_AFFIRMATIONS = [
  { id: 'e2e84-yes', prompt: 'yes' },
  { id: 'e2e84-confirm', prompt: 'confirm' },
  { id: 'e2e84-go-ahead', prompt: 'go ahead' },
  { id: 'e2e84-do-it', prompt: 'do it' },
  { id: 'e2e84-proceed', prompt: 'proceed' },
] as const;

export const E2E84_PRIVACY_DELETE_NEGATIONS = [
  { id: 'e2e84-no', prompt: 'no' },
  { id: 'e2e84-cancel', prompt: 'cancel' },
  { id: 'e2e84-nevermind', prompt: 'never mind' },
] as const;

/** Live cases for guru QA (e2e-bug.84 + e2e-bug.257 residual). */
export const E2E84_LIVE_CASES = [
  {
    id: 'anon-sign-in-gate',
    description: 'Unauthenticated delete ask → sign in (no mutation)',
  },
  {
    id: 'first-turn-previews',
    description: 'Signed-in first turn previews; DB unchanged; pending in sessionContext',
  },
  {
    id: 'bare-yes-without-pending-no-op',
    description: 'Bare yes without pending/history does not erase',
  },
  {
    id: 'yes-with-pending-context-erases',
    description: 'yes + privacyDeletePending context executes erasure (e2e-bug.257)',
  },
  {
    id: 'yes-with-history-erases',
    description: 'yes after preview history executes erasure',
  },
] as const;
