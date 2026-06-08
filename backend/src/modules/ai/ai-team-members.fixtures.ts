/** Owner-only team role edits (parity-2 / parity-2.1). */
export const TEAM_MEMBERS_CLASSIFIER_RULES = `- update_team_member_role: MUTATE — owner changes a dashboard team member's role (staff|manager|contributor|admin). Triggers: change/update/set + role + team member|employee. Requires member email or name and target role. NOT list_employees (read directory).`;

export const TEAM_MEMBER_SCENARIOS = [
  {
    id: 'promote-to-manager',
    prompt: 'Make Anna a manager on the team',
    surface: 'dashboard' as const,
    expectedAction: 'update_team_member_role' as const,
    role: 'manager',
  },
  {
    id: 'demote-to-staff',
    prompt: 'Change John role to staff',
    surface: 'dashboard' as const,
    expectedAction: 'update_team_member_role' as const,
    role: 'staff',
  },
  {
    id: 'set-admin-role',
    prompt: 'Set Sarah as admin on the team',
    surface: 'dashboard' as const,
    expectedAction: 'update_team_member_role' as const,
    role: 'admin',
  },
  {
    id: 'make-contributor',
    prompt: 'Make Leo a contributor',
    surface: 'dashboard' as const,
    expectedAction: 'update_team_member_role' as const,
    role: 'contributor',
  },
  {
    id: 'change-role-to-manager',
    prompt: 'Change team member role to manager for employee 42',
    surface: 'dashboard' as const,
    expectedAction: 'update_team_member_role' as const,
    role: 'manager',
  },
  {
    id: 'update-employee-role',
    prompt: 'Update employee role to staff',
    surface: 'dashboard' as const,
    expectedAction: 'update_team_member_role' as const,
    role: 'staff',
  },
  {
    id: 'promote-staff-to-manager',
    prompt: 'Promote Maria from staff to manager',
    surface: 'dashboard' as const,
    expectedAction: 'update_team_member_role' as const,
    role: 'manager',
  },
  {
    id: 'demote-manager-to-staff',
    prompt: 'Demote Alex to staff role',
    surface: 'dashboard' as const,
    expectedAction: 'update_team_member_role' as const,
    role: 'staff',
  },
  {
    id: 'set-team-member-admin',
    prompt: 'Set team member role to admin',
    surface: 'dashboard' as const,
    expectedAction: 'update_team_member_role' as const,
    role: 'admin',
  },
  {
    id: 'change-john-to-contributor',
    prompt: 'Change John to contributor on the team',
    surface: 'dashboard' as const,
    expectedAction: 'update_team_member_role' as const,
    role: 'contributor',
  },
] as const;
