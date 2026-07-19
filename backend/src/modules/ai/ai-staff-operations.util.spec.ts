import {
  CONFIGURE_ONLINE_BOOKING_PROMPTS,
  CREATE_EMPLOYEE_PROMPTS,
  DEACTIVATE_EMPLOYEE_PROMPTS,
  INVITE_STAFF_MEMBER_PROMPTS,
  STAFF_OPERATIONS_PROMPT_FIXTURES,
} from './ai-staff-operations.fixtures.js';
import { STAFF_OPERATIONS_MULTILINGUAL_SCENARIOS } from './ai-staff-operations-multilingual.fixtures.js';
import {
  enrichStaffOperationsRescueParams,
  extractEmployeeEmailFromPrompt,
  extractEmployeeNameFromPrompt,
  isConfigureOnlineBookingPrompt,
  isCreateEmployeePrompt,
  isDeactivateEmployeePrompt,
  isInviteStaffMemberPrompt,
  isUpdateTeamMemberRolePrompt,
  parseOnlineBookingEnabledFromPrompt,
  rescueStaffOperationsIntent,
} from './ai-staff-operations.util.js';

describe('ai-staff-operations.util (ai-cmd-ext-2.5–2.8)', () => {
  it.each(STAFF_OPERATIONS_PROMPT_FIXTURES)(
    'rescueStaffOperationsIntent $id',
    ({ prompt, expectedAction }) => {
      const rescued = rescueStaffOperationsIntent(prompt, 'unknown');
      expect(rescued?.action).toBe(expectedAction);
    },
  );

  it.each(STAFF_OPERATIONS_MULTILINGUAL_SCENARIOS)(
    'rescueStaffOperationsIntent multilingual $id',
    ({ prompt, expectedAction }) => {
      const rescued = rescueStaffOperationsIntent(prompt, 'unknown');
      expect(rescued?.action).toBe(expectedAction);
    },
  );

  it.each(CREATE_EMPLOYEE_PROMPTS)(
    'enrich create params for $id',
    ({ prompt, expectedParams }) => {
      const params = enrichStaffOperationsRescueParams(
        'create_employee',
        {},
        prompt,
      );
      if (expectedParams?.employeeName) {
        expect(params.employeeName).toBe(expectedParams.employeeName);
      }
      if (expectedParams?.email) {
        expect(params.email).toBe(expectedParams.email);
      }
    },
  );

  it.each(INVITE_STAFF_MEMBER_PROMPTS)(
    'enrich invite params for $id',
    ({ prompt, expectedParams }) => {
      const params = enrichStaffOperationsRescueParams(
        'invite_staff_member',
        {},
        prompt,
      );
      if (expectedParams?.email) {
        expect(params.email).toBe(expectedParams.email);
      }
      if (expectedParams?.employeeName) {
        expect(params.employeeName).toBe(expectedParams.employeeName);
      }
    },
  );

  it.each(DEACTIVATE_EMPLOYEE_PROMPTS)(
    'enrich deactivate params for $id',
    ({ prompt, expectedParams }) => {
      const params = enrichStaffOperationsRescueParams(
        'deactivate_employee',
        {},
        prompt,
      );
      if (expectedParams?.employeeName) {
        expect(params.employeeName).toBe(expectedParams.employeeName);
      }
    },
  );

  it.each(CONFIGURE_ONLINE_BOOKING_PROMPTS)(
    'enrich configure booking params for $id',
    ({ prompt, expectedParams }) => {
      const params = enrichStaffOperationsRescueParams(
        'configure_online_booking',
        {},
        prompt,
      );
      if (typeof expectedParams?.enabled === 'boolean') {
        expect(params.enabled).toBe(expectedParams.enabled);
      }
    },
  );

  it('parseOnlineBookingEnabledFromPrompt enable/disable', () => {
    expect(
      parseOnlineBookingEnabledFromPrompt('Enable online booking now'),
    ).toBe(true);
    expect(
      parseOnlineBookingEnabledFromPrompt('Disable public booking page'),
    ).toBe(false);
    expect(
      parseOnlineBookingEnabledFromPrompt('Միացրու online booking public page'),
    ).toBe(true);
    expect(
      parseOnlineBookingEnabledFromPrompt('Отключи public booking website'),
    ).toBe(false);
  });

  it('extractEmployeeEmailFromPrompt', () => {
    expect(
      extractEmployeeEmailFromPrompt('Invite anna@salon.com to the app'),
    ).toBe('anna@salon.com');
  });

  it('extractEmployeeNameFromPrompt', () => {
    expect(extractEmployeeNameFromPrompt('Deactivate employee Gevorg')).toBe(
      'Gevorg',
    );
    expect(extractEmployeeNameFromPrompt('Add stylist Anna to the team')).toBe(
      'Anna',
    );
  });

  it('isUpdateTeamMemberRolePrompt detects role-change phrasing', () => {
    expect(isUpdateTeamMemberRolePrompt("Make Maria's role manager")).toBe(
      true,
    );
    expect(isUpdateTeamMemberRolePrompt('Set Jake\'s role to admin')).toBe(
      true,
    );
    expect(isUpdateTeamMemberRolePrompt('Promote Anna to manager')).toBe(
      true,
    );
    expect(isUpdateTeamMemberRolePrompt('Rename Anna to Maria')).toBe(false);
  });

  it('rescueStaffOperationsIntent rescues update_team_member_role from unknown', () => {
    const rescued = rescueStaffOperationsIntent(
      'Make Maria a manager role',
      'unknown',
    );
    expect(rescued?.action).toBe('update_team_member_role');
  });

  it('detection helpers match fixtures', () => {
    expect(isCreateEmployeePrompt('Add stylist Anna')).toBe(true);
    expect(isInviteStaffMemberPrompt('Invite staff to the app')).toBe(true);
    expect(isDeactivateEmployeePrompt('Remove Maria from team')).toBe(true);
    expect(isConfigureOnlineBookingPrompt('Enable online booking')).toBe(true);
  });

  it('e2e-bug.144 — catalog delete/remove is not deactivate_employee', () => {
    expect(
      isDeactivateEmployeePrompt(
        'Delete service QA Test Trim from the business catalog. This is a catalog management delete_service action, not a cart or employee action.',
      ),
    ).toBe(false);
    expect(
      isDeactivateEmployeePrompt('Delete the service called QA Test Trim'),
    ).toBe(false);
    expect(
      isDeactivateEmployeePrompt(
        'Remove the QA Test Trim service from my catalog permanently',
      ),
    ).toBe(false);
  });
});
