/** ai-cmd-provider-6.9 — provider mobile clinic tasks, lab results queue & booking lab summaries. */

export const PROVIDER_CLINIC_TASKS_AND_RESULTS_CLASSIFIER_RULES = `- list_lab_results_queue: READ — clinic only: lab results assigned to you waiting for review/release. Triggers: show my lab results queue, results waiting for review, any pending test results. NOT list_my_collection_queue (specimen collection worklist), NOT list_booking_lab_summaries (one specific booking).
- claim_clinic_task: MUTATE — clinic only: claim an unassigned clinic task for yourself. Requires taskId or customerName to disambiguate. Triggers: claim this task, take the follow-up call task. NOT complete_clinic_task (marks it done).
- complete_clinic_task: MUTATE — clinic only: mark a clinic task done, optional notes. Requires taskId or customerName to disambiguate. Triggers: mark task done, complete the follow-up call task, finish this task. NOT claim_clinic_task.
- list_booking_lab_summaries: READ — clinic only: lab test summaries (status, flags) for one specific booking, PHI-scoped to the assigned provider. Requires bookingId. Triggers: any flagged results on this visit, show lab results for this booking, CBC from last time. NOT list_lab_results_queue (all assigned results across bookings).
- list_clinic_tasks: READ — clinic only: your outstanding clinic tasks (assigned + unassigned), any status/type. Triggers: my tasks today, outstanding clinic to-dos, show my task list. NOT list_lab_results_queue (lab-review-specific), NOT claim_clinic_task/complete_clinic_task (mutate a single task).
- explain_clinic_task: READ — clinic only: single-task detail view — what the task is, who it's assigned to, and who assigned/created it. Requires taskId or customerName to disambiguate. Triggers: what is this follow-up task, who assigned it, explain this task. NOT list_clinic_tasks (the full list), NOT claim_clinic_task/complete_clinic_task (mutate).`;

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
    id: 'lab-results-abnormal-today-en',
    prompt: 'Abnormal results today',
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
  {
    id: 'list-clinic-tasks-my-today-en',
    prompt: 'My tasks today',
    surface: 'provider' as const,
    expectedAction: 'list_clinic_tasks',
  },
  {
    id: 'list-clinic-tasks-outstanding-todos-en',
    prompt: 'Outstanding clinic to-dos',
    surface: 'provider' as const,
    expectedAction: 'list_clinic_tasks',
  },
  {
    id: 'list-clinic-tasks-show-pending-en',
    prompt: 'Show my pending tasks',
    surface: 'provider' as const,
    expectedAction: 'list_clinic_tasks',
  },
  {
    id: 'list-clinic-tasks-open-en',
    prompt: 'List my open tasks',
    surface: 'provider' as const,
    expectedAction: 'list_clinic_tasks',
  },
  {
    id: 'list-clinic-tasks-list-today-en',
    prompt: 'My task list for today',
    surface: 'provider' as const,
    expectedAction: 'list_clinic_tasks',
  },
  {
    id: 'list-clinic-tasks-any-pending-en',
    prompt: 'Any of my pending tasks?',
    surface: 'provider' as const,
    expectedAction: 'list_clinic_tasks',
  },
  {
    id: 'list-clinic-tasks-whats-outstanding-en',
    prompt: "What's outstanding on my task list?",
    surface: 'provider' as const,
    expectedAction: 'list_clinic_tasks',
  },
  {
    id: 'list-clinic-tasks-show-todos-en',
    prompt: 'Show my clinic to-dos',
    surface: 'provider' as const,
    expectedAction: 'list_clinic_tasks',
  },
  {
    id: 'list-clinic-tasks-hy',
    prompt: 'Իմ առաջադրանքները այսօր',
    surface: 'provider' as const,
    expectedAction: 'list_clinic_tasks',
  },
  {
    id: 'list-clinic-tasks-list-hy',
    prompt: 'Ցուցակագրիր իմ pending առաջադրանքները',
    surface: 'provider' as const,
    expectedAction: 'list_clinic_tasks',
  },
  {
    id: 'list-clinic-tasks-ru',
    prompt: 'Мои задачи на сегодня',
    surface: 'provider' as const,
    expectedAction: 'list_clinic_tasks',
  },
  {
    id: 'list-clinic-tasks-list-ru',
    prompt: 'Список моих задач',
    surface: 'provider' as const,
    expectedAction: 'list_clinic_tasks',
  },
  {
    id: 'explain-clinic-task-what-is-en',
    prompt: 'What is this follow-up task?',
    surface: 'provider' as const,
    expectedAction: 'explain_clinic_task',
  },
  {
    id: 'explain-clinic-task-who-assigned-en',
    prompt: 'Who assigned it?',
    surface: 'provider' as const,
    expectedAction: 'explain_clinic_task',
  },
  {
    id: 'explain-clinic-task-explain-en',
    prompt: 'Explain this task',
    surface: 'provider' as const,
    expectedAction: 'explain_clinic_task',
  },
  {
    id: 'explain-clinic-task-hy',
    prompt: 'Ի՞նչ է այս առաջադրանքը',
    surface: 'provider' as const,
    expectedAction: 'explain_clinic_task',
  },
  {
    id: 'explain-clinic-task-ru',
    prompt: 'Что это за задача?',
    surface: 'provider' as const,
    expectedAction: 'explain_clinic_task',
  },
] as const;
