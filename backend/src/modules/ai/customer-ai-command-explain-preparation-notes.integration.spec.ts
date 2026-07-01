import { EXPLAIN_PREPARATION_NOTES_PROMPTS } from './ai-explain-preparation-notes.fixtures.js';
import { rescueExplainPreparationNotesIntent } from './ai-explain-preparation-notes.util.js';
import { isSelfServiceBookingIntent } from './ai-self-service-booking.util.js';

describe('customer-ai-command explain_preparation_notes integration (ai-cmd-customer-4.3.4)', () => {
  it.each(
    EXPLAIN_PREPARATION_NOTES_PROMPTS.filter(
      (row) => row.surface === 'customer',
    ).map((row) => [row.id, row] as const),
  )('routes $id through self-service booking handler', (_id, row) => {
    expect(isSelfServiceBookingIntent('explain_preparation_notes')).toBe(true);
    expect(
      rescueExplainPreparationNotesIntent(row.prompt, 'unknown')?.action,
    ).toBe('explain_preparation_notes');
  });
});
