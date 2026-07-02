import { rescueResumeBookingDraftIntent } from './ai-resume-booking-draft.util.js';
import { RESUME_BOOKING_DRAFT_PROMPTS } from './ai-resume-booking-draft.fixtures.js';

describe('customer-ai-command resume_booking_draft integration (ai-cmd-customer-4.18.3)', () => {
  it.each(
    RESUME_BOOKING_DRAFT_PROMPTS.filter((row) => row.surface === 'customer'),
  )('rescues resume_booking_draft for $id', (row) => {
    expect(rescueResumeBookingDraftIntent(row.prompt, 'unknown')?.action).toBe(
      'resume_booking_draft',
    );
  });
});
