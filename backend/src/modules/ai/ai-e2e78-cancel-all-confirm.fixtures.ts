/**
 * e2e-bug.78 — cancel_all_upcoming_bookings preview appeared, but "yes" /
 * "yes, cancel them all" never set params.confirm=true.
 */

export const E2E78_PREVIEW_SUMMARY =
  'This will cancel 2 upcoming booking(s): facemassage on Jul 18, 3:59 PM; facemassage on Jul 19, 6:35 PM. Reply yes to confirm.';

export const E2E78_AFFIRMATIONS = [
  { id: 'e2e78-yes', prompt: 'yes' },
  { id: 'e2e78-yes-cancel-them-all', prompt: 'yes, cancel them all' },
  { id: 'e2e78-confirm', prompt: 'confirm' },
  { id: 'e2e78-go-ahead', prompt: 'go ahead' },
] as const;

export const E2E78_FIRST_TURN_PROMPTS = [
  {
    id: 'e2e78-cancel-every-appointment',
    prompt: 'cancel every appointment I have',
  },
  {
    id: 'e2e78-cancel-all-my-bookings',
    prompt: 'cancel all my bookings',
  },
] as const;

export const E2E78_NON_CONFIRM = [
  {
    id: 'e2e78-bare-yes-without-pending',
    prompt: 'yes',
  },
  {
    id: 'e2e78-unrelated',
    prompt: 'list my appointments',
  },
] as const;
