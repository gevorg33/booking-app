import { PROVIDER_CLINIC_TASKS_AND_RESULTS_PROMPT_SCENARIOS } from './ai-provider-clinic-tasks-and-results.fixtures.js';
import {
  extractBookingIdForLabSummariesFromPrompt,
  extractClinicTaskIdFromPrompt,
  formatBookingLabSummariesText,
  formatLabResultsQueueSummary,
  isClaimClinicTaskPrompt,
  isCompleteClinicTaskPrompt,
  isListBookingLabSummariesPrompt,
  isListLabResultsQueuePrompt,
  isProviderClinicTasksAndResultsIntent,
  PROVIDER_CLINIC_TASKS_AND_RESULTS_INTENTS,
  rescueProviderClinicTasksAndResultsIntent,
} from './ai-provider-clinic-tasks-and-results.util.js';

describe('ai-provider-clinic-tasks-and-results.util (ai-cmd-provider-6.9)', () => {
  it('exports the 4 provider clinic tasks/results intents', () => {
    expect(PROVIDER_CLINIC_TASKS_AND_RESULTS_INTENTS).toEqual([
      'list_lab_results_queue',
      'list_booking_lab_summaries',
      'claim_clinic_task',
      'complete_clinic_task',
    ]);
    expect(isProviderClinicTasksAndResultsIntent('claim_clinic_task')).toBe(
      true,
    );
    expect(isProviderClinicTasksAndResultsIntent('unknown')).toBe(false);
  });

  it.each(
    PROVIDER_CLINIC_TASKS_AND_RESULTS_PROMPT_SCENARIOS.map((s) => [s.id, s]),
  )('rescues fixture prompt %s to $expectedAction', (_id, scenario) => {
    expect(
      rescueProviderClinicTasksAndResultsIntent(scenario.prompt, 'unknown')
        ?.action,
    ).toBe(scenario.expectedAction);
  });

  it('detects list_lab_results_queue prompts', () => {
    expect(isListLabResultsQueuePrompt('Show my lab results queue')).toBe(
      true,
    );
    expect(
      isListLabResultsQueuePrompt('Any lab results waiting for my review?'),
    ).toBe(true);
    expect(
      isListLabResultsQueuePrompt('Show lab results for this booking'),
    ).toBe(false);
  });

  it('detects claim vs complete clinic task prompts', () => {
    expect(isClaimClinicTaskPrompt('Claim this task')).toBe(true);
    expect(isClaimClinicTaskPrompt('Take the follow-up call task')).toBe(
      true,
    );
    expect(isCompleteClinicTaskPrompt('Mark task done')).toBe(true);
    expect(isCompleteClinicTaskPrompt('Complete the follow-up call task')).toBe(
      true,
    );
    expect(isClaimClinicTaskPrompt('Complete the follow-up call task')).toBe(
      false,
    );
  });

  it('detects list_booking_lab_summaries prompts', () => {
    expect(isListBookingLabSummariesPrompt('Any flagged results on this visit?')).toBe(
      true,
    );
    expect(
      isListBookingLabSummariesPrompt('Show lab results for this booking'),
    ).toBe(true);
    expect(isListBookingLabSummariesPrompt('Claim this task')).toBe(false);
  });

  it('extracts task id and booking id from prompt', () => {
    expect(extractClinicTaskIdFromPrompt('Complete task abc123def')).toBe(
      'abc123def',
    );
    expect(extractClinicTaskIdFromPrompt('Claim this task')).toBeNull();
    expect(
      extractBookingIdForLabSummariesFromPrompt('Show results for booking abc123def'),
    ).toBe('abc123def');
    expect(
      extractBookingIdForLabSummariesFromPrompt('Any flagged results on this visit?'),
    ).toBeNull();
  });

  it('formats lab results queue and booking lab summaries text', () => {
    expect(formatLabResultsQueueSummary([])).toContain('No lab results');
    expect(
      formatLabResultsQueueSummary([
        {
          testName: 'CBC',
          customerName: 'Jane',
          status: 'pending_review',
          measurementFlag: 'high',
        },
      ]),
    ).toContain('1 flagged');

    expect(formatBookingLabSummariesText([])).toContain('No lab tests');
    expect(
      formatBookingLabSummariesText([
        {
          testName: 'CBC',
          orderStatus: 'completed',
          resultStatus: 'released',
          measurementFlag: 'normal',
        },
      ]),
    ).toContain('CBC: released');
  });

  it('returns null for unrelated prompts', () => {
    expect(
      rescueProviderClinicTasksAndResultsIntent('Book a haircut tomorrow', 'unknown'),
    ).toBeNull();
  });

  it('does not rescue when action is already classified', () => {
    expect(
      rescueProviderClinicTasksAndResultsIntent(
        'Show my lab results queue',
        'list_lab_results_queue',
      ),
    ).toBeNull();
  });
});
