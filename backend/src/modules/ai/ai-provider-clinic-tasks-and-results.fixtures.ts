/** ai-cmd-provider-6.9 — provider mobile clinic tasks, lab results queue & booking lab summaries. */

export const PROVIDER_CLINIC_TASKS_AND_RESULTS_CLASSIFIER_RULES = `- list_lab_results_queue: READ — clinic only: lab results assigned to you waiting for review/release. Triggers: show my lab results queue, results waiting for review, any pending test results. NOT list_my_collection_queue (specimen collection worklist), NOT list_booking_lab_summaries (one specific booking).
- claim_clinic_task: MUTATE — clinic only: claim an unassigned clinic task for yourself. Requires taskId or customerName to disambiguate. Triggers: claim this task, take the follow-up call task. NOT complete_clinic_task (marks it done).
- complete_clinic_task: MUTATE — clinic only: mark a clinic task done, optional notes. Requires taskId or customerName to disambiguate. Triggers: mark task done, complete the follow-up call task, finish this task. NOT claim_clinic_task.
- list_booking_lab_summaries: READ — clinic only: lab test summaries (status, flags) for one specific booking, PHI-scoped to the assigned provider. Requires bookingId. Triggers: any flagged results on this visit, show lab results for this booking, CBC from last time. NOT list_lab_results_queue (all assigned results across bookings).`;

export const PROVIDER_CLINIC_TASKS_AND_RESULTS_PROMPT_SCENARIOS = [
  {
    id: 'list-lab-results-queue-en',
    prompt: 'Show my lab results queue',
    surface: 'provider' as const,
    expectedAction: 'list_lab_results_queue',
  },
  {
    id: 'lab-results-waiting-review-en',
    prompt: 'Any lab results waiting for my review?',
    surface: 'provider' as const,
    expectedAction: 'list_lab_results_queue',
  },
  {
    id: 'claim-clinic-task-en',
    prompt: 'Claim this task',
    surface: 'provider' as const,
    expectedAction: 'claim_clinic_task',
  },
  {
    id: 'claim-follow-up-task-en',
    prompt: "Take the follow-up call task for Jane",
    surface: 'provider' as const,
    expectedAction: 'claim_clinic_task',
    paramsPartial: { customerName: 'Jane' },
  },
  {
    id: 'complete-task-done-en',
    prompt: 'Mark task done',
    surface: 'provider' as const,
    expectedAction: 'complete_clinic_task',
  },
  {
    id: 'complete-follow-up-task-en',
    prompt: 'Complete the follow-up call task',
    surface: 'provider' as const,
    expectedAction: 'complete_clinic_task',
  },
  {
    id: 'list-booking-lab-summaries-flagged-en',
    prompt: 'Any flagged results on this visit?',
    surface: 'provider' as const,
    expectedAction: 'list_booking_lab_summaries',
  },
  {
    id: 'list-booking-lab-summaries-show-en',
    prompt: 'Show lab results for this booking',
    surface: 'provider' as const,
    expectedAction: 'list_booking_lab_summaries',
  },
] as const;
