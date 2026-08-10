import type { Repository } from 'typeorm';
import type { EmployeeService } from '../employee/employee.service.js';
import type { InvitationsService } from '../invitations/invitations.service.js';
import type { TeamMembersService } from '../business/team-members.service.js';
import type { AssignableMemberRole } from '../business/dto/update-member-role.dto.js';
import { ASSIGNABLE_MEMBER_ROLES } from '../business/dto/update-member-role.dto.js';
import type { Business } from '../business/entities/business.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  extractEmployeeEmailFromPrompt,
  extractEmployeeNameFromPrompt,
  extractEmployeeUpdateFromPrompt,
  extractServiceNamesFromPrompt,
  parseOnlineBookingEnabledFromPrompt,
} from './ai-staff-operations.util.js';

export interface StaffOperationsLogicDeps {
  employeeService: EmployeeService;
  invitationsService: InvitationsService;
  teamMembersService: TeamMembersService;
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
  const serviceIds = await resolveServiceIds(deps, businessId, serviceNames);

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
      serviceIds.length > 0 ? ` Assigned ${serviceIds.length} service(s).` : '';
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

export async function handleUpdateEmployeeLogic(
  deps: StaffOperationsLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt: string | undefined,
  userId?: string,
): Promise<CommandResult> {
  const extracted = extractEmployeeUpdateFromPrompt(prompt ?? '');
  const employeeName =
    (typeof params.employeeName === 'string' && params.employeeName.trim()) ||
    extracted.employeeName ||
    '';
  if (!employeeName) {
    return failure(
      'update_employee',
      'Please specify which team member to update (employeeName).',
    );
  }

  const newName =
    (typeof params.newName === 'string' && params.newName.trim()) ||
    extracted.newName ||
    undefined;
  const email =
    (typeof params.email === 'string' && params.email.trim()) ||
    extracted.email ||
    undefined;
  const phone =
    (typeof params.phone === 'string' && params.phone.trim()) ||
    extracted.phone ||
    undefined;
  const title =
    (typeof params.title === 'string' && params.title.trim()) ||
    extracted.title ||
    undefined;
  const serviceNames = params.serviceNames;
  const serviceIds = await resolveServiceIds(deps, businessId, serviceNames);

  if (!newName && !email && !phone && !title && !serviceIds.length) {
    return failure(
      'update_employee',
      `What should I change for ${employeeName}? Provide a new name, email, phone, title, or services.`,
    );
  }

  const employees = await deps.employeeService.findAll(businessId);
  const match = employees.find((e) =>
    e.name.toLowerCase().includes(employeeName.toLowerCase()),
  );
  if (!match) {
    return failure(
      'update_employee',
      `No active employee found matching "${employeeName}".`,
    );
  }

  try {
    const updated = await deps.employeeService.update(
      match.id,
      {
        ...(newName ? { name: newName } : {}),
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
        ...(title ? { title } : {}),
        ...(serviceIds.length ? { serviceIds } : {}),
      },
      userId,
    );
    const changes = [
      newName ? `name → ${newName}` : null,
      email ? `email → ${email}` : null,
      phone ? `phone → ${phone}` : null,
      title ? `title → ${title}` : null,
      serviceIds.length ? `services → ${serviceIds.length} assigned` : null,
    ]
      .filter(Boolean)
      .join(', ');
    return success('update_employee', `Updated ${match.name}: ${changes}.`, {
      employeeId: updated.id,
      employeeName: updated.name,
    });
  } catch (err: any) {
    return failure(
      'update_employee',
      err?.message ?? 'Could not update employee.',
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
    return success('invite_staff_member', `Invitation sent to ${email}.`, {
      invitationId: invite.id,
      email,
    });
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

export async function handleUpdateTeamMemberRoleLogic(
  deps: StaffOperationsLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  userId?: string,
): Promise<CommandResult> {
  const employeeName =
    typeof params.employeeName === 'string' ? params.employeeName.trim() : '';
  if (!employeeName) {
    return failure(
      'update_team_member_role',
      "Please specify which team member's role to change (employeeName).",
    );
  }

  const role =
    typeof params.role === 'string'
      ? (params.role.toLowerCase() as AssignableMemberRole)
      : undefined;
  if (!role || !ASSIGNABLE_MEMBER_ROLES.includes(role)) {
    return failure(
      'update_team_member_role',
      `Specify the new role (one of: ${ASSIGNABLE_MEMBER_ROLES.join(', ')}).`,
    );
  }

  const employees = await deps.employeeService.findAll(businessId);
  const match = employees.find((e) =>
    e.name.toLowerCase().includes(employeeName.toLowerCase()),
  );
  if (!match) {
    return failure(
      'update_team_member_role',
      `No active employee found matching "${employeeName}".`,
    );
  }

  try {
    const updated = await deps.teamMembersService.updateRoleByEmployeeId(
      businessId,
      match.id,
      role,
      userId ?? '',
    );
    return success(
      'update_team_member_role',
      `Set ${match.name}'s role to ${role}.`,
      { employeeId: match.id, employeeName: match.name, role: updated.role },
    );
  } catch (err: any) {
    return failure(
      'update_team_member_role',
      err?.message ?? 'Could not update the team member role.',
    );
  }
}

export async function handleConfigureOnlineBookingLogic(
  deps: StaffOperationsLogicDeps,
  businessId: string,
  params: Record<string, unknown>,
  prompt: string | undefined,
): Promise<CommandResult> {
  const business = await deps.businessRepo.findOne({
    where: { id: businessId },
  });
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
