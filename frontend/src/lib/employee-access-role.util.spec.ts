import { describe, expect, it } from 'vitest';
import {
  getDisplayAccessRole,
  getEmployeeAccessRoleConfig,
  resolveSaveAccessRole,
  shouldPatchAccessRoleOnSave,
} from './employee-access-role.util';

const staffMember = { userId: 'user-staff', role: 'staff' as const };
const ownerMember = { userId: 'user-owner', role: 'owner' as const };

describe('getEmployeeAccessRoleConfig', () => {
  it('returns editable config for linked staff when requester is owner', () => {
    expect(
      getEmployeeAccessRoleConfig(
        { id: 'emp-1', userId: 'user-staff', email: 'a@b.com' },
        { isOwner: true, currentUserId: 'user-owner', linkedMember: staffMember },
      ),
    ).toEqual({ initialRole: 'staff', editable: true });
  });

  it('returns read-only config for owner role', () => {
    expect(
      getEmployeeAccessRoleConfig(
        { id: 'emp-1', userId: 'user-owner', email: 'owner@b.com' },
        { isOwner: true, currentUserId: 'user-owner', linkedMember: ownerMember },
      ),
    ).toEqual({ initialRole: 'owner', editable: false });
  });

  it('returns read-only config when editing self', () => {
    expect(
      getEmployeeAccessRoleConfig(
        { id: 'emp-1', userId: 'user-staff', email: 'staff@b.com' },
        { isOwner: true, currentUserId: 'user-staff', linkedMember: staffMember },
      ),
    ).toEqual({ initialRole: 'staff', editable: false });
  });

  it('returns pending access config for employee with email but no userId', () => {
    expect(
      getEmployeeAccessRoleConfig(
        { id: 'emp-2', userId: null, email: 'pending@b.com' },
        {
          isOwner: true,
          pendingAppAccessRoles: { 'emp-2': 'manager' },
        },
      ),
    ).toEqual({ initialRole: 'manager', editable: true });
  });

  it('defaults pending access role to contributor', () => {
    expect(
      getEmployeeAccessRoleConfig(
        { id: 'emp-2', userId: null, email: 'pending@b.com' },
        { isOwner: true },
      ),
    ).toEqual({ initialRole: 'contributor', editable: true });
  });

  it('returns null for non-owner', () => {
    expect(
      getEmployeeAccessRoleConfig(
        { id: 'emp-1', userId: 'user-staff', email: 'a@b.com' },
        { isOwner: false, linkedMember: staffMember },
      ),
    ).toBeNull();
  });

  it('returns null when employee has no email and no linked member', () => {
    expect(
      getEmployeeAccessRoleConfig(
        { id: 'emp-3', userId: null, email: '' },
        { isOwner: true },
      ),
    ).toBeNull();
  });

  it('returns null for staff with userId but no linked team member', () => {
    expect(
      getEmployeeAccessRoleConfig(
        { id: 'emp-4', userId: 'orphan-user', email: 'orphan@b.com' },
        { isOwner: true, linkedMember: null },
      ),
    ).toBeNull();
  });
});

describe('getDisplayAccessRole', () => {
  it('prefers linked member role over pending role', () => {
    expect(
      getDisplayAccessRole(
        { id: 'emp-1', email: 'a@b.com' },
        'admin',
        { 'emp-1': 'contributor' },
      ),
    ).toBe('admin');
  });

  it('falls back to pending role when employee has email', () => {
    expect(
      getDisplayAccessRole({ id: 'emp-2', email: 'pending@b.com' }, null, {
        'emp-2': 'manager',
      }),
    ).toBe('manager');
  });

  it('defaults pending display role to contributor', () => {
    expect(getDisplayAccessRole({ id: 'emp-2', email: 'pending@b.com' }, null)).toBe(
      'contributor',
    );
  });

  it('returns null when no linked role and no email', () => {
    expect(getDisplayAccessRole({ id: 'emp-3', email: '' }, null)).toBeNull();
  });
});

describe('resolveSaveAccessRole', () => {
  it('patches access role when owner changes linked staff role', () => {
    expect(
      resolveSaveAccessRole({
        accessRole: 'manager',
        accessRoleConfig: { initialRole: 'staff', editable: true },
        employee: { userId: 'user-staff', email: 'staff@b.com' },
        linkedMemberRole: 'staff',
      }),
    ).toEqual({
      accessRole: 'manager',
      previousAccessRole: 'staff',
      savePendingAccessRole: false,
      shouldPatchAccessRole: true,
    });
  });

  it('skips patch when linked role is unchanged', () => {
    expect(
      resolveSaveAccessRole({
        accessRole: 'staff',
        accessRoleConfig: { initialRole: 'staff', editable: true },
        employee: { userId: 'user-staff', email: 'staff@b.com' },
        linkedMemberRole: 'staff',
      }),
    ).toEqual({
      accessRole: 'staff',
      previousAccessRole: 'staff',
      savePendingAccessRole: false,
      shouldPatchAccessRole: false,
    });
  });

  it('stores pending access role for employee without userId', () => {
    expect(
      resolveSaveAccessRole({
        accessRole: 'admin',
        accessRoleConfig: { initialRole: 'contributor', editable: true },
        employee: { userId: null, email: 'pending@b.com' },
      }),
    ).toEqual({
      accessRole: 'admin',
      previousAccessRole: undefined,
      savePendingAccessRole: true,
      shouldPatchAccessRole: false,
    });
  });

  it('ignores access role when config is read-only', () => {
    expect(
      resolveSaveAccessRole({
        accessRole: 'admin',
        accessRoleConfig: { initialRole: 'owner', editable: false },
        employee: { userId: 'user-owner', email: 'owner@b.com' },
        linkedMemberRole: 'owner',
      }),
    ).toEqual({
      accessRole: undefined,
      previousAccessRole: undefined,
      savePendingAccessRole: false,
      shouldPatchAccessRole: false,
    });
  });

  it('ignores access role when config is null', () => {
    expect(
      resolveSaveAccessRole({
        accessRole: 'admin',
        accessRoleConfig: null,
        employee: { userId: 'user-staff', email: 'staff@b.com' },
        linkedMemberRole: 'staff',
      }),
    ).toEqual({
      accessRole: undefined,
      previousAccessRole: undefined,
      savePendingAccessRole: false,
      shouldPatchAccessRole: false,
    });
  });
});

describe('shouldPatchAccessRoleOnSave', () => {
  it('returns true only when role changed', () => {
    expect(shouldPatchAccessRoleOnSave('manager', 'staff')).toBe(true);
    expect(shouldPatchAccessRoleOnSave('staff', 'staff')).toBe(false);
    expect(shouldPatchAccessRoleOnSave(undefined, 'staff')).toBe(false);
    expect(shouldPatchAccessRoleOnSave('staff', undefined)).toBe(false);
  });
});
