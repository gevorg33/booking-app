import { PROVIDER_CLINIC_TASKS_AND_RESULTS_PROMPT_SCENARIOS } from './ai-provider-clinic-tasks-and-results.fixtures.js';
import {
  extractBookingIdForLabSummariesFromPrompt,
  extractClinicTaskIdFromPrompt,
  formatBookingLabSummariesText,
  formatClinicTaskDetailText,
  formatClinicTasksListSummary,
  formatLabResultsQueueSummary,
  isClaimClinicTaskPrompt,
  isCompleteClinicTaskPrompt,
  isExplainClinicTaskPrompt,
  isListBookingLabSummariesPrompt,
  isListClinicTasksPrompt,
  isListLabResultsQueuePrompt,
  isProviderClinicTasksAndResultsIntent,
  PROVIDER_CLINIC_TASKS_AND_RESULTS_INTENTS,
  rescueProviderClinicTasksAndResultsIntent,
} from './ai-provider-clinic-tasks-and-results.util.js';

describe('ai-provider-clinic-tasks-and-results.util (ai-cmd-provider-6.9)', () => {
  it('exports the 6 provider clinic tasks/results intents', () => {
    expect(PROVIDER_CLINIC_TASKS_AND_RESULTS_INTENTS).toEqual([
      'list_lab_results_queue',
      'list_booking_lab_summaries',
      'list_clinic_tasks',
      'explain_clinic_task',
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
    expect(isListLabResultsQueuePrompt('Show my lab results queue')).toBe(true);
    expect(
      isListLabResultsQueuePrompt('Any lab results waiting for my review?'),
    ).toBe(true);
    expect(
      isListLabResultsQueuePrompt('Show lab results for this booking'),
    ).toBe(false);
  });

  it('detects claim vs complete clinic task prompts', () => {
    expect(isClaimClinicTaskPrompt('Claim this task')).toBe(true);
    expect(isClaimClinicTaskPrompt('Take the follow-up call task')).toBe(true);
    expect(isCompleteClinicTaskPrompt('Mark task done')).toBe(true);
    expect(isCompleteClinicTaskPrompt('Complete the follow-up call task')).toBe(
      true,
    );
    expect(isClaimClinicTaskPrompt('Complete the follow-up call task')).toBe(
      false,
    );
  });

  it('detects list_booking_lab_summaries prompts', () => {
    expect(
      isListBookingLabSummariesPrompt('Any flagged results on this visit?'),
    ).toBe(true);
    expect(
      isListBookingLabSummariesPrompt('Show lab results for this booking'),
    ).toBe(true);
    expect(isListBookingLabSummariesPrompt('Claim this task')).toBe(false);
  });

  it('detects list_clinic_tasks prompts (ai-cmd-provider-5.11.6)', () => {
    expect(isListClinicTasksPrompt('My tasks today')).toBe(true);
    expect(isListClinicTasksPrompt('Outstanding clinic to-dos')).toBe(true);
    expect(isListClinicTasksPrompt('Claim this task')).toBe(false);
    expect(isListClinicTasksPrompt('Mark task done')).toBe(false);
    expect(isListClinicTasksPrompt('Show my lab results queue')).toBe(false);
  });

  it('e2e-bug.152 — does not steal dashboard AI agent task prompts', () => {
    expect(isListClinicTasksPrompt('Show me pending AI agent tasks')).toBe(
      false,
    );
    expect(isListClinicTasksPrompt('show pending agent tasks')).toBe(false);
    expect(isListClinicTasksPrompt('Show the agent task queue')).toBe(false);
    expect(
      rescueProviderClinicTasksAndResultsIntent(
        'Show me pending AI agent tasks',
        'list_agent_tasks',
      ),
    ).toBeNull();
    expect(
      rescueProviderClinicTasksAndResultsIntent(
        'Show me pending AI agent tasks',
        'unknown',
      ),
    ).toBeNull();
  });

  it('detects explain_clinic_task prompts (ai-cmd-provider-5.19.5)', () => {
    expect(isExplainClinicTaskPrompt('What is this follow-up task?')).toBe(
      true,
    );
    expect(isExplainClinicTaskPrompt('Who assigned it?')).toBe(true);
    expect(isExplainClinicTaskPrompt('Explain this task')).toBe(true);
    expect(isExplainClinicTaskPrompt('Claim this task')).toBe(false);
    expect(isExplainClinicTaskPrompt('Mark task done')).toBe(false);
    expect(isExplainClinicTaskPrompt('My tasks today')).toBe(false);
  });

  it('formats a single clinic task detail', () => {
    expect(
      formatClinicTaskDetailText({
        title: 'Follow-up call',
        taskType: 'follow_up_call',
        status: 'open',
        priority: 'high',
        dueAt: '2026-06-05T00:00:00.000Z',
        customerName: 'Jane',
        notes: 'Call about missed appointment',
        assigneeName: 'Alex',
        createdByName: 'Sam',
        isAutoManaged: false,
      }),
    ).toBe(
      '"Follow-up call" (follow_up_call, open, high priority). for Jane. due 2026-06-05. assigned to Alex. assigned by Sam. Notes: Call about missed appointment.',
    );
    expect(
      formatClinicTaskDetailText({
        title: 'Recheck vitals',
        taskType: 'recheck',
        status: 'open',
        priority: 'normal',
        dueAt: null,
        customerName: null,
        notes: null,
        assigneeName: null,
        createdByName: null,
        isAutoManaged: true,
      }),
    ).toBe(
      '"Recheck vitals" (recheck, open, normal priority). auto-generated by the system.',
    );
  });

  it('formats the clinic tasks list summary', () => {
    expect(formatClinicTasksListSummary([])).toBe(
      'No outstanding clinic tasks right now.',
    );
    const summary = formatClinicTasksListSummary([
      {
        title: 'Follow-up call',
        status: 'open',
        priority: 'high',
        dueAt: '2026-07-10T00:00:00.000Z',
        customerName: 'Jane Doe',
      },
    ]);
    expect(summary).toContain('1 outstanding task:');
    expect(summary).toContain('Follow-up call — Jane Doe');
    expect(summary).toContain('[high]');
  });

  it('extracts task id and booking id from prompt', () => {
    expect(extractClinicTaskIdFromPrompt('Complete task abc123def')).toBe(
      'abc123def',
    );
    expect(extractClinicTaskIdFromPrompt('Claim this task')).toBeNull();
    expect(
      extractBookingIdForLabSummariesFromPrompt(
        'Show results for booking abc123def',
      ),
    ).toBe('abc123def');
    expect(
      extractBookingIdForLabSummariesFromPrompt(
        'Any flagged results on this visit?',
      ),
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
      rescueProviderClinicTasksAndResultsIntent(
        'Book a haircut tomorrow',
        'unknown',
      ),
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
