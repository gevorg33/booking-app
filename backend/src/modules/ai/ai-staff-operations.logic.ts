import type { Repository } from 'typeorm';
import type { EmployeeService } from '../employee/employee.service.js';
import type { InvitationsService } from '../invitations/invitations.service.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  extractEmployeeEmailFromPrompt,
  extractEmployeeNameFromPrompt,
  extractServiceNamesFromPrompt,
  parseOnlineBookingEnabledFromPrompt,
} from './ai-staff-operations.util.js';

export interface StaffOperationsLogicDeps {
  employeeService: EmployeeService;
  invitationsService: InvitationsService;
  businessRepo: Repository<Business>;
  serviceRepo: Repository<Service>;
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function failure(action: string, summary: string): CommandResult {
  return { success: false, action, summary, details: {} };
}

async function resolveServiceIds(
  deps: StaffOperationsLogicDeps,
  businessId: string,
  serviceNames: unknown,
): Promise<string[]> {
  if (!Array.isArray(serviceNames) || serviceNames.length === 0) return [];
  const services = await deps.serviceRepo.find({ where: { businessId } });
  const ids: string[] = [];
  for (const name of serviceNames) {
    if (typeof name !== 'string') continue;
    const needle = name.trim().toLowerCase();
    const match = services.find((s) => s.name.toLowerCase().includes(needle));
    if (match) ids.push(match.id);
  }
  return ids;
}

export async function handleCreateEmployeeLogic(
  deps: StaffOperationsLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt: string | undefined,
  userId?: string,
): Promise<CommandResult> {
  const name =
    (typeof params.employeeName === 'string' && params.employeeName.trim()) ||
    extractEmployeeNameFromPrompt(prompt ?? '') ||
    '';
  if (!name) {
    return failure(
      'create_employee',
      'Please specify the new team member name (employeeName).',
    );
  }

  const email =
    (typeof params.email === 'string' && params.email.trim()) ||
    extractEmployeeEmailFromPrompt(prompt ?? '') ||
    undefined;
  const phone =
    typeof params.phone === 'string' ? params.phone.trim() : undefined;
  const serviceNames =
    params.serviceNames ?? extractServiceNamesFromPrompt(prompt ?? '');
  const serviceIds = await resolveServiceIds(
    deps,
    businessId,
    serviceNames,
  );

  try {
    const employee = await deps.employeeService.create(
      businessId,
      {
        name,
        email,
        phone,
        serviceIds: serviceIds.length ? serviceIds : undefined,
      },
      userId,
    );
    const serviceNote =
      serviceIds.length > 0
        ? ` Assigned ${serviceIds.length} service(s).`
        : '';
    return success(
      'create_employee',
      `Created team member ${employee.name}.${serviceNote}`,
      { employeeId: employee.id, employeeName: employee.name },
    );
  } catch (err: any) {
    return failure(
      'create_employee',
      err?.message ?? 'Could not create employee.',
    );
  }
}

export async function handleInviteStaffMemberLogic(
  deps: StaffOperationsLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt: string | undefined,
  userId?: string,
): Promise<CommandResult> {
  if (!userId) {
    return failure(
      'invite_staff_member',
      'Staff invitations require a signed-in user.',
    );
  }

  const email =
    (typeof params.email === 'string' && params.email.trim().toLowerCase()) ||
    extractEmployeeEmailFromPrompt(prompt ?? '');
  const employeeName =
    typeof params.employeeName === 'string'
      ? params.employeeName.trim()
      : undefined;

  try {
    if (employeeName && !email) {
      const employees = await deps.employeeService.findAll(businessId);
      const match = employees.find((e) =>
        e.name.toLowerCase().includes(employeeName.toLowerCase()),
      );
      if (!match) {
        return failure(
          'invite_staff_member',
          `No active employee found matching "${employeeName}".`,
        );
      }
      if (!match.email?.trim()) {
        return failure(
          'invite_staff_member',
          `${match.name} has no email on file — add an email first or invite by address.`,
        );
      }
      const invite = await deps.invitationsService.sendEmployeeAppAccess(
        businessId,
        match.id,
        userId,
      );
      return success(
        'invite_staff_member',
        `Sent provider app invitation to ${match.name} (${match.email}).`,
        { invitationId: invite.id, employeeId: match.id },
      );
    }

    if (!email) {
      return failure(
        'invite_staff_member',
        'Please provide an email address or employeeName for the invitation.',
      );
    }

    const invite = await deps.invitationsService.create(businessId, userId, {
      email,
      employeeName,
    });
    return success(
      'invite_staff_member',
      `Invitation sent to ${email}.`,
      { invitationId: invite.id, email },
    );
  } catch (err: any) {
    return failure(
      'invite_staff_member',
      err?.message ?? 'Could not send staff invitation.',
    );
  }
}

export async function handleDeactivateEmployeeLogic(
  deps: StaffOperationsLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt: string | undefined,
  userId?: string,
): Promise<CommandResult> {
  const employeeName =
    (typeof params.employeeName === 'string' && params.employeeName.trim()) ||
    extractEmployeeNameFromPrompt(prompt ?? '') ||
    undefined;
  if (!employeeName) {
    return failure(
      'deactivate_employee',
      'Please specify which team member to deactivate (employeeName).',
    );
  }

  const employees = await deps.employeeService.findAll(businessId);
  const match = employees.find((e) =>
    e.name.toLowerCase().includes(employeeName.toLowerCase()),
  );
  if (!match) {
    return failure(
      'deactivate_employee',
      `No active employee found matching "${employeeName}".`,
    );
  }

  try {
    await deps.employeeService.remove(match.id, userId);
    return success(
      'deactivate_employee',
      `Deactivated ${match.name} — they no longer appear on the active roster.`,
      { employeeId: match.id, employeeName: match.name },
    );
  } catch (err: any) {
    return failure(
      'deactivate_employee',
      err?.message ?? 'Could not deactivate employee.',
    );
  }
}

export async function handleConfigureOnlineBookingLogic(
  deps: StaffOperationsLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt: string | undefined,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({ where: { id: businessId } });
  if (!business) {
    return failure('configure_online_booking', 'Business not found.');
  }

  const parsed =
    typeof params.enabled === 'boolean'
      ? params.enabled
      : parseOnlineBookingEnabledFromPrompt(prompt ?? '');

  if (parsed == null) {
    const current = business.settings?.publicBooking?.enabled !== false;
    return success(
      'configure_online_booking',
      current
        ? 'Online booking is enabled. Say "disable online booking" to turn off the public page.'
        : 'Online booking is disabled. Say "enable online booking" to allow customers to book online.',
      { enabled: current },
    );
  }

  const settings = {
    ...(business.settings ?? {}),
    publicBooking: {
      ...(business.settings?.publicBooking ?? {}),
      enabled: parsed,
    },
  };

  try {
    await deps.businessRepo.update(businessId, { settings });
    return success(
      'configure_online_booking',
      parsed
        ? 'Online booking is now enabled on your public booking page.'
        : 'Online booking is now disabled — the public page will not accept new bookings.',
      { enabled: parsed },
    );
  } catch (err: any) {
    return failure(
      'configure_online_booking',
      err?.message ?? 'Could not update online booking settings.',
    );
  }
}
