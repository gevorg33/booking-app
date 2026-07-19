import type { ProviderMobileService } from '../provider-mobile/provider-mobile.service.js';
import type { ClinicTestResultsService } from '../clinic-test-results/clinic-test-results.service.js';
import type { ClinicLabAccessService } from '../clinic-test-results/shared/clinic-lab-access.service.js';
import type { ProviderClinicTaskItem } from '../provider-mobile/provider-mobile-clinic-tasks.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  extractBookingIdForLabSummariesFromPrompt,
  extractClinicTaskIdFromPrompt,
  formatBookingLabSummariesText,
  formatClinicTaskDetailText,
  formatClinicTasksListSummary,
  formatLabResultsQueueSummary,
} from './ai-provider-clinic-tasks-and-results.util.js';

export interface ProviderClinicTasksAndResultsLogicDeps {
  providerMobile: ProviderMobileService;
  clinicTestResultsService: ClinicTestResultsService;
  clinicLabAccessService: ClinicLabAccessService;
}

function failure(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: false, action, summary, details };
}

function success(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: true, action, summary, details };
}

function clarify(
  action: string,
  summary: string,
  missing: string[],
  details: Record<string, unknown> = {},
): CommandResult {
  return {
    success: false,
    action,
    summary,
    details: { ...details, clarify: true, missing },
  };
}

async function resolveClinicTask(
  deps: ProviderClinicTasksAndResultsLogicDeps,
  businessId: string,
  userId: string,
  action: string,
  params: Record<string, unknown>,
  prompt: string,
): Promise<{ task: ProviderClinicTaskItem } | { error: CommandResult }> {
  const inbox = await deps.providerMobile.getProviderClinicTaskInbox(
    businessId,
    userId,
  );
  if (!inbox.labFeaturesEnabled) {
    return {
      error: failure(action, 'Clinic tasks are only available for clinic businesses.', {
        clinicOnly: true,
      }),
    };
  }

  const explicitTaskId =
    (typeof params.taskId === 'string' && params.taskId.trim()) ||
    extractClinicTaskIdFromPrompt(prompt) ||
    null;
  if (explicitTaskId) {
    const match = inbox.tasks.find(
      (t) => t.id === explicitTaskId || t.id.startsWith(explicitTaskId),
    );
    if (match) return { task: match };
    return {
      error: failure(action, 'That task was not found in your inbox.', {
        taskId: explicitTaskId,
      }),
    };
  }

  const customerName =
    (typeof params.customerName === 'string' && params.customerName.trim()) ||
    null;
  if (customerName) {
    const needle = customerName.toLowerCase();
    const matches = inbox.tasks.filter((t) =>
      (t.customerName ?? '').toLowerCase().includes(needle),
    );
    if (matches.length === 1) return { task: matches[0] };
    if (matches.length > 1) {
      return {
        error: clarify(
          action,
          `Multiple tasks match "${customerName}" — specify the task id.`,
          ['taskId'],
          { candidates: matches.map((m) => ({ id: m.id, title: m.title })) },
        ),
      };
    }
  }

  if (inbox.tasks.length === 1) return { task: inbox.tasks[0] };

  return {
    error: clarify(
      action,
      'Which task? Specify the task id or the customer name.',
      ['taskId', 'customerName'],
      { tasks: inbox.tasks.map((t) => ({ id: t.id, title: t.title })) },
    ),
  };
}

export async function handleListLabResultsQueueLogic(
  deps: ProviderClinicTasksAndResultsLogicDeps,
  businessId: string,
  userId: string,
): Promise<CommandResult> {
  const view = await deps.providerMobile.getProviderLabResultsQueue(
    businessId,
    userId,
  );
  if (!view.labFeaturesEnabled) {
    return failure(
      'list_lab_results_queue',
      'Lab results are only available for clinic businesses.',
      { clinicOnly: true },
    );
  }
  return success(
    'list_lab_results_queue',
    formatLabResultsQueueSummary(view.results),
    { results: view.results, count: view.results.length },
  );
}

/** ai-cmd-provider-5.11.6 — list the provider's own outstanding clinic tasks. */
export async function handleListClinicTasksLogic(
  deps: ProviderClinicTasksAndResultsLogicDeps,
  businessId: string,
  userId: string,
): Promise<CommandResult> {
  const inbox = await deps.providerMobile.getProviderClinicTaskInbox(
    businessId,
    userId,
  );
  if (!inbox.labFeaturesEnabled) {
    return failure(
      'list_clinic_tasks',
      'Clinic tasks are only available for clinic businesses.',
      { clinicOnly: true },
    );
  }
  return success(
    'list_clinic_tasks',
    formatClinicTasksListSummary(inbox.tasks),
    { tasks: inbox.tasks, count: inbox.tasks.length },
  );
}

export async function handleClaimClinicTaskLogic(
  deps: ProviderClinicTasksAndResultsLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
  prompt?: string,
): Promise<CommandResult> {
  const resolved = await resolveClinicTask(
    deps,
    businessId,
    userId,
    'claim_clinic_task',
    params,
    prompt ?? '',
  );
  if ('error' in resolved) return resolved.error;

  if (!resolved.task.canClaim) {
    return failure(
      'claim_clinic_task',
      `"${resolved.task.title}" cannot be claimed right now.`,
      { taskId: resolved.task.id },
    );
  }

  try {
    const claimed = await deps.providerMobile.claimProviderClinicTask(
      businessId,
      userId,
      resolved.task.id,
    );
    return success(
      'claim_clinic_task',
      `Claimed task "${resolved.task.title}".`,
      { task: claimed },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Could not claim that task.';
    return failure('claim_clinic_task', message, { taskId: resolved.task.id });
  }
}

export async function handleCompleteClinicTaskLogic(
  deps: ProviderClinicTasksAndResultsLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
  prompt?: string,
): Promise<CommandResult> {
  const resolved = await resolveClinicTask(
    deps,
    businessId,
    userId,
    'complete_clinic_task',
    params,
    prompt ?? '',
  );
  if ('error' in resolved) return resolved.error;

  if (!resolved.task.canComplete) {
    return failure(
      'complete_clinic_task',
      `"${resolved.task.title}" cannot be completed right now.`,
      { taskId: resolved.task.id },
    );
  }

  const notes =
    (typeof params.notes === 'string' && params.notes.trim()) ||
    (typeof params.reason === 'string' && params.reason.trim()) ||
    null;

  try {
    const completed = await deps.providerMobile.completeProviderClinicTask(
      businessId,
      userId,
      resolved.task.id,
      { notes },
    );
    return success(
      'complete_clinic_task',
      `Completed task "${resolved.task.title}".`,
      { task: completed },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Could not complete that task.';
    return failure('complete_clinic_task', message, {
      taskId: resolved.task.id,
    });
  }
}

/** ai-cmd-provider-5.19.5 — single-task detail view (what it is, who assigned it). */
export async function handleExplainClinicTaskLogic(
  deps: ProviderClinicTasksAndResultsLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
  prompt?: string,
): Promise<CommandResult> {
  const resolved = await resolveClinicTask(
    deps,
    businessId,
    userId,
    'explain_clinic_task',
    params,
    prompt ?? '',
  );
  if ('error' in resolved) return resolved.error;

  return success(
    'explain_clinic_task',
    formatClinicTaskDetailText(resolved.task),
    { task: resolved.task },
  );
}

export async function handleListBookingLabSummariesLogic(
  deps: ProviderClinicTasksAndResultsLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
  prompt?: string,
): Promise<CommandResult> {
  const promptText = prompt ?? (params._prompt as string) ?? '';
  const bookingId =
    (typeof params.bookingId === 'string' && params.bookingId.trim()) ||
    extractBookingIdForLabSummariesFromPrompt(promptText) ||
    null;

  if (!bookingId) {
    return clarify(
      'list_booking_lab_summaries',
      'Which booking should I check for lab results?',
      ['bookingId'],
    );
  }

  try {
    await deps.clinicLabAccessService.assertBookingLabAccess(
      businessId,
      userId,
      bookingId,
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'You do not have access to this booking.';
    return failure('list_booking_lab_summaries', message, { bookingId });
  }

  const summaries = await deps.clinicTestResultsService.listBookingLabSummaries(
    businessId,
    bookingId,
  );

  return success(
    'list_booking_lab_summaries',
    formatBookingLabSummariesText(summaries),
    { bookingId, summaries },
  );
}
