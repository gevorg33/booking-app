import {
  hasResultsThenRebookFollowUpCue,
  hasResultsThenRebookResultsCue,
} from './ai-results-then-rebook-cue.util.js';

describe('ai-results-then-rebook-cue.util (ai-cmd-customer-4.21.5)', () => {
  it('hasResultsThenRebookResultsCue detects released results phrasing', () => {
    expect(
      hasResultsThenRebookResultsCue(
        'Results released — book follow-up like last time',
      ),
    ).toBe(true);
    expect(
      hasResultsThenRebookResultsCue(
        'What does released mean for my lab results?',
      ),
    ).toBe(true);
    expect(hasResultsThenRebookResultsCue('Rebook my last appointment')).toBe(
      false,
    );
  });

  it('hasResultsThenRebookFollowUpCue detects rebook follow-up phrasing', () => {
    expect(
      hasResultsThenRebookFollowUpCue(
        'Results released — book follow-up like last time',
      ),
    ).toBe(true);
    expect(
      hasResultsThenRebookFollowUpCue(
        'My lab results are ready; rebook my last appointment',
      ),
    ).toBe(true);
    expect(
      hasResultsThenRebookFollowUpCue(
        'Results ready — book same appointment again',
      ),
    ).toBe(true);
    expect(
      hasResultsThenRebookFollowUpCue(
        'What does released mean for my lab results?',
      ),
    ).toBe(false);
  });

  it('hasResultsThenRebookResultsCue detects CBC and ready phrasing', () => {
    expect(
      hasResultsThenRebookResultsCue(
        'My CBC results released; rebook last visit',
      ),
    ).toBe(true);
    expect(
      hasResultsThenRebookResultsCue(
        'Lab results are ready — schedule follow-up',
      ),
    ).toBe(true);
  });
});
