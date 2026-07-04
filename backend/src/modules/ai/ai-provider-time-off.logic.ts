import type { Repository } from 'typeorm';
import type { BusinessService } from '../business/business.service.js';
import type { BlockScheduleService } from '../schedule/services/block-schedule.service.js';
import type { ProviderTimeOffService } from '../provider-mobile/provider-time-off.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  summarizeTimeOffRequests,
  type ProviderTimeOffRequestView,
} from '../provider-mobile/provider-time-off.util.js';

export interface ProviderTimeOffLogicDeps {
  timeOffService: ProviderTimeOffService;
  businessService: BusinessService;
}

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

export async function handleListTimeOffRequestsLogic(
  deps: ProviderTimeOffLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  try {
    await deps.timeOffService.assertManagerAccess(businessId, userId);
  } catch {
    return failure(
      'list_time_off_requests',
      'Time-off requests can only be reviewed by managers.',
    );
  }

  const status =
    (typeof params.status === 'string' && params.status.trim()) || 'pending';
  const requests = await deps.timeOffService.listForBusiness(
    businessId,
    status,
  );

  return success('list_time_off_requests', summarizeTimeOffRequests(requests), {
    requests,
    status,
  });
}

export async function handleApproveTimeOffRequestLogic(
  deps: ProviderTimeOffLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  try {
    await deps.timeOffService.assertManagerAccess(businessId, userId);
  } catch {
    return failure(
      'approve_time_off_request',
      'Only managers can approve time-off requests.',
    );
  }

  const requestId =
    (typeof params.requestId === 'string' && params.requestId.trim()) || null;
  if (!requestId) {
    return failure(
      'approve_time_off_request',
      'Specify which time-off request to approve (request id or open the dashboard queue).',
      { clarify: true },
    );
  }

  try {
    const approved = await deps.timeOffService.approveRequest(
      businessId,
      userId,
      requestId,
      typeof params.reviewNotes === 'string' ? params.reviewNotes : undefined,
    );
    return success(
      'approve_time_off_request',
      `Approved time off for ${approved.employeeName ?? 'provider'} (${approved.startDate}${approved.endDate !== approved.startDate ? ` – ${approved.endDate}` : ''}). Calendar blocked.`,
      { request: approved },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Could not approve request';
    return failure('approve_time_off_request', message);
  }
}

export async function handleDenyTimeOffRequestLogic(
  deps: ProviderTimeOffLogicDeps,
  businessId: string,
  userId: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  try {
    await deps.timeOffService.assertManagerAccess(businessId, userId);
  } catch {
    return failure(
      'deny_time_off_request',
      'Only managers can deny time-off requests.',
    );
  }

  const requestId =
    (typeof params.requestId === 'string' && params.requestId.trim()) || null;
  if (!requestId) {
    return failure(
      'deny_time_off_request',
      'Specify which time-off request to deny.',
      { clarify: true },
    );
  }

  try {
    const denied = await deps.timeOffService.denyRequest(
      businessId,
      userId,
      requestId,
      typeof params.reviewNotes === 'string' ? params.reviewNotes : undefined,
    );
    return success(
      'deny_time_off_request',
      `Denied time-off request for ${denied.employeeName ?? 'provider'}.`,
      { request: denied },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Could not deny request';
    return failure('deny_time_off_request', message);
  }
}

export async function handleRequestTimeOffLogic(
  deps: ProviderTimeOffLogicDeps,
  businessId: string,
  userId: string,
  employeeId: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  const startDate =
    (typeof params.startDate === 'string' && params.startDate.trim()) ||
    (typeof params.date === 'string' && params.date.trim()) ||
    null;
  const endDate =
    (typeof params.endDate === 'string' && params.endDate.trim()) || startDate;
  if (!startDate || !endDate) {
    return failure(
      'request_time_off',
      'Tell me which dates you need off (e.g. "Request June 10–12 off").',
      { clarify: true },
    );
  }

  try {
    const created = await deps.timeOffService.createRequest(
      businessId,
      userId,
      employeeId,
      {
        startDate,
        endDate,
        dailyStartTime:
          (typeof params.dailyStartTime === 'string' &&
            params.dailyStartTime) ||
          (typeof params.timeFrom === 'string' && params.timeFrom) ||
          '00:00',
        dailyEndTime:
          (typeof params.dailyEndTime === 'string' && params.dailyEndTime) ||
          (typeof params.timeTo === 'string' && params.timeTo) ||
          '23:59',
        reason:
          (typeof params.reason === 'string' && params.reason) ||
          (typeof params.notes === 'string' && params.notes) ||
          null,
      },
    );
    return success(
      'request_time_off',
      `Submitted time-off request for ${created.startDate}${created.endDate !== created.startDate ? ` – ${created.endDate}` : ''}. Status: pending manager approval.`,
      { request: created },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Could not submit time-off request';
    return failure('request_time_off', message);
  }
}

export async function handleListMyTimeOffRequestsLogic(
  deps: ProviderTimeOffLogicDeps,
  businessId: string,
  employeeId: string,
): Promise<CommandResult> {
  const requests = await deps.timeOffService.listForEmployee(
    businessId,
    employeeId,
    10,
  );
  return success(
    'list_my_time_off_requests',
    summarizeTimeOffRequests(requests),
    { requests },
  );
}

export async function handleCancelTimeOffRequestLogic(
  deps: ProviderTimeOffLogicDeps,
  businessId: string,
  employeeId: string,
  params: Record<string, unknown>,
): Promise<CommandResult> {
  let requestId =
    (typeof params.requestId === 'string' && params.requestId.trim()) || null;

  if (!requestId) {
    const requests = await deps.timeOffService.listForEmployee(
      businessId,
      employeeId,
      10,
    );
    const pending = requests.filter((r) => r.status === 'pending');
    if (pending.length === 1) {
      requestId = pending[0].id;
    } else if (pending.length > 1) {
      return failure(
        'cancel_time_off_request',
        'You have more than one pending time-off request — specify which one (dates or request id).',
        { clarify: true, requests: pending },
      );
    } else {
      return failure(
        'cancel_time_off_request',
        'No pending time-off request found to cancel.',
      );
    }
  }

  try {
    const cancelled = await deps.timeOffService.cancelRequest(
      businessId,
      employeeId,
      requestId,
    );
    return success(
      'cancel_time_off_request',
      `Cancelled time-off request for ${cancelled.startDate}${cancelled.endDate !== cancelled.startDate ? ` – ${cancelled.endDate}` : ''}.`,
      { request: cancelled },
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Could not cancel time-off request';
    return failure('cancel_time_off_request', message);
  }
}
