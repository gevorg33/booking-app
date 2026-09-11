import { SEARCH_PATIENT_PROMPT_SCENARIOS } from './ai-provider-search-patient.fixtures.js';
import {
  extractPatientSearchQueryFromPrompt,
  formatPatientSearchResultsText,
  isSearchPatientPrompt,
  rescueSearchPatientIntent,
} from './ai-provider-search-patient.util.js';

describe('ai-provider-search-patient.util (ai-cmd-provider-5.19.1)', () => {
  it.each(SEARCH_PATIENT_PROMPT_SCENARIOS)(
    'detects search_patient prompt $id',
    (scenario) => {
      expect(isSearchPatientPrompt(scenario.prompt)).toBe(true);
      const rescued = rescueSearchPatientIntent(scenario.prompt, 'unknown');
      expect(rescued?.action).toBe('search_patient');
      const query = (scenario as { paramsPartial?: { query?: string } })
        .paramsPartial?.query;
      if (query) {
        expect(extractPatientSearchQueryFromPrompt(scenario.prompt)).toBe(
          query,
        );
      }
    },
  );

  it('does not steal open_patient_chart / unrelated prompts', () => {
    expect(isSearchPatientPrompt('Show me her patient chart')).toBe(false);
    expect(isSearchPatientPrompt('Summarize this client')).toBe(false);
    expect(isSearchPatientPrompt('My tasks today')).toBe(false);
  });

  it('rescueSearchPatientIntent is a no-op once already classified', () => {
    expect(
      rescueSearchPatientIntent('Find patient Jane Doe', 'search_patient'),
    ).toBeNull();
  });

  it('formats patient search results', () => {
    expect(formatPatientSearchResultsText('Jane', [])).toBe(
      'No patients match "Jane".',
    );
    expect(
      formatPatientSearchResultsText('Jane', [
        { name: 'Jane Doe', phone: '555-1234', email: null },
      ]),
    ).toBe('1 patient match "Jane":\n• Jane Doe — 555-1234');
    expect(
      formatPatientSearchResultsText('Jane', [
        { name: 'Jane Doe', phone: '555-1234', email: null },
        { name: 'Jane Smith', phone: null, email: null },
      ]),
    ).toBe('2 patients match "Jane":\n• Jane Doe — 555-1234\n• Jane Smith');
  });
});
