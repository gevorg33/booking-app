/**
 * e2e-bug.89 — cancel_and_rebook compound step cancel_my_booking failed with
 * "No upcoming booking found to cancel" because shared prompt extraction set
 * serviceName to the availability filler "next available".
 */
export const E2E89_CANCEL_AND_REBOOK_PROMPTS = [
  {
    id: 'e2e89-facemassage-next-available',
    prompt:
      'cancel my facemassage appointment and book the next available slot instead',
    expectedCancelServiceName: 'facemassage',
  },
  {
    id: 'e2e89-massage-next-available',
    prompt:
      'Cancel my massage on Friday; book the next available slot',
    expectedCancelServiceName: 'massage',
  },
  {
    id: 'e2e89-haircut-next-available-time',
    prompt: 'Cancel my haircut tomorrow then book the next available time',
    expectedCancelServiceName: 'haircut',
  },
  {
    id: 'e2e89-friday-no-service',
    prompt: 'Cancel Friday and book the next available slot',
    expectedCancelServiceName: undefined,
  },
] as const;
