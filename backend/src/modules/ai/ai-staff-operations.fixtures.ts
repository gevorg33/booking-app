export type StaffOperationsPromptFixture = {
  id: string;
  prompt: string;
  expectedAction:
    | 'create_employee'
    | 'update_employee'
    | 'invite_staff_member'
    | 'deactivate_employee'
    | 'configure_online_booking';
  expectedParams?: Record<string, unknown>;
};

export const CREATE_EMPLOYEE_PROMPTS = [
  {
    id: 'staff-create-anna-en',
    prompt: 'Add stylist Anna to the team',
    expectedAction: 'create_employee' as const,
    expectedParams: { employeeName: 'Anna' },
  },
  {
    id: 'staff-create-maria-services-en',
    prompt: 'Create employee Maria with massage services',
    expectedAction: 'create_employee' as const,
    expectedParams: { employeeName: 'Maria' },
  },
  {
    id: 'staff-create-email-en',
    prompt: 'Hire provider Jake jake@salon.com',
    expectedAction: 'create_employee' as const,
    expectedParams: { employeeName: 'Jake', email: 'jake@salon.com' },
  },
  {
    id: 'staff-create-onboard-en',
    prompt: 'Onboard new therapist Sofia on the roster',
    expectedAction: 'create_employee' as const,
    expectedParams: { employeeName: 'Sofia' },
  },
  {
    id: 'staff-create-register-en',
    prompt: 'Register team member David as a provider',
    expectedAction: 'create_employee' as const,
    expectedParams: { employeeName: 'David' },
  },
  {
    id: 'staff-create-color-en',
    prompt: 'Add color specialist Emma to staff',
    expectedAction: 'create_employee' as const,
    expectedParams: { employeeName: 'Emma' },
  },
  {
    id: 'staff-create-nails-en',
    prompt: 'Create employee Nina with nails services',
    expectedAction: 'create_employee' as const,
    expectedParams: { employeeName: 'Nina' },
  },
  {
    id: 'staff-create-phone-en',
    prompt: 'Hire stylist Leo leo@spa.com with phone +15551234',
    expectedAction: 'create_employee' as const,
    expectedParams: { employeeName: 'Leo', email: 'leo@spa.com' },
  },
  {
    id: 'staff-create-barber-en',
    prompt: 'Add barber Chris to the team roster',
    expectedAction: 'create_employee' as const,
    expectedParams: { employeeName: 'Chris' },
  },
  {
    id: 'staff-create-reception-en',
    prompt: 'Create staff member Olivia for front desk',
    expectedAction: 'create_employee' as const,
    expectedParams: { employeeName: 'Olivia' },
  },
  {
    id: 'staff-create-multi-skill-en',
    prompt: 'Hire provider Maya with haircut and color services',
    expectedAction: 'create_employee' as const,
    expectedParams: { employeeName: 'Maya' },
  },
] as const;

export const UPDATE_EMPLOYEE_PROMPTS = [
  {
    id: 'staff-update-rename-anna-en',
    prompt: 'Rename stylist Anna to Maria',
    expectedAction: 'update_employee' as const,
    expectedParams: { employeeName: 'Anna', newName: 'Maria' },
  },
  {
    id: 'staff-update-email-maria-en',
    prompt: "Change Maria's email to maria@salon.com",
    expectedAction: 'update_employee' as const,
    expectedParams: { employeeName: 'Maria', email: 'maria@salon.com' },
  },
  {
    id: 'staff-update-phone-jake-en',
    prompt: "Update Jake's phone to +15551234567",
    expectedAction: 'update_employee' as const,
    expectedParams: { employeeName: 'Jake', phone: '+15551234567' },
  },
  {
    id: 'staff-update-title-anna-en',
    prompt: "Set Anna's title to Senior Stylist",
    expectedAction: 'update_employee' as const,
    expectedParams: { employeeName: 'Anna', title: 'Senior Stylist' },
  },
  {
    id: 'staff-update-fix-email-emma-en',
    prompt: "Fix provider Emma's email to emma@spa.com",
    expectedAction: 'update_employee' as const,
    expectedParams: { employeeName: 'Emma', email: 'emma@spa.com' },
  },
  {
    id: 'staff-update-phone-leo-en',
    prompt: "Correct stylist Leo's phone number to +15559876543",
    expectedAction: 'update_employee' as const,
    expectedParams: { employeeName: 'Leo', phone: '+15559876543' },
  },
  {
    id: 'staff-update-rename-chris-en',
    prompt: 'Rename barber Chris to Christopher',
    expectedAction: 'update_employee' as const,
    expectedParams: { employeeName: 'Chris', newName: 'Christopher' },
  },
  {
    id: 'staff-update-job-title-david-en',
    prompt: "Update David's job title to Color Director",
    expectedAction: 'update_employee' as const,
    expectedParams: { employeeName: 'David', title: 'Color Director' },
  },
  {
    id: 'staff-update-email-nina-en',
    prompt: "Update provider Nina's email to nina@salon.com",
    expectedAction: 'update_employee' as const,
    expectedParams: { employeeName: 'Nina', email: 'nina@salon.com' },
  },
  {
    id: 'staff-update-rename-olivia-en',
    prompt: 'Rename team member Olivia to Liv',
    expectedAction: 'update_employee' as const,
    expectedParams: { employeeName: 'Olivia', newName: 'Liv' },
  },
  {
    id: 'staff-update-phone-sofia-en',
    prompt: "Edit Sofia's phone to +37491234567",
    expectedAction: 'update_employee' as const,
    expectedParams: { employeeName: 'Sofia', phone: '+37491234567' },
  },
] as const;

export const INVITE_STAFF_MEMBER_PROMPTS = [
  {
    id: 'staff-invite-email-en',
    prompt: 'Invite anna@salon.com to the provider app',
    expectedAction: 'invite_staff_member' as const,
    expectedParams: { email: 'anna@salon.com' },
  },
  {
    id: 'staff-invite-name-en',
    prompt: 'Send staff invitation to Maria for dashboard access',
    expectedAction: 'invite_staff_member' as const,
    expectedParams: { employeeName: 'Maria' },
  },
  {
    id: 'staff-invite-team-en',
    prompt: 'Invite staff member to the provider app',
    expectedAction: 'invite_staff_member' as const,
  },
  {
    id: 'staff-invite-provider-en',
    prompt: 'Send invitation to provider Jake for app access',
    expectedAction: 'invite_staff_member' as const,
    expectedParams: { employeeName: 'Jake' },
  },
  {
    id: 'staff-invite-dashboard-en',
    prompt: 'Invite anna@salon.com to dashboard and provider app',
    expectedAction: 'invite_staff_member' as const,
    expectedParams: { email: 'anna@salon.com' },
  },
  {
    id: 'staff-invite-stylist-en',
    prompt: 'Invite stylist Emma to the mobile app',
    expectedAction: 'invite_staff_member' as const,
    expectedParams: { employeeName: 'Emma' },
  },
  {
    id: 'staff-invite-email-only-en',
    prompt: 'Send staff invite to team@salon.com',
    expectedAction: 'invite_staff_member' as const,
    expectedParams: { email: 'team@salon.com' },
  },
  {
    id: 'staff-invite-new-hire-en',
    prompt: 'Send an invitation to new employee David for provider app',
    expectedAction: 'invite_staff_member' as const,
    expectedParams: { employeeName: 'David' },
  },
  {
    id: 'staff-invite-access-en',
    prompt: 'Invite Maria to staff app access',
    expectedAction: 'invite_staff_member' as const,
    expectedParams: { employeeName: 'Maria' },
  },
  {
    id: 'staff-invite-roster-en',
    prompt: 'Invite provider on roster leo@spa.com to the app',
    expectedAction: 'invite_staff_member' as const,
    expectedParams: { email: 'leo@spa.com' },
  },
  {
    id: 'staff-invite-manager-en',
    prompt: 'Send invitation to manager Olivia for dashboard access',
    expectedAction: 'invite_staff_member' as const,
    expectedParams: { employeeName: 'Olivia' },
  },
] as const;

export const DEACTIVATE_EMPLOYEE_PROMPTS = [
  {
    id: 'staff-deactivate-gevorg-en',
    prompt: 'Deactivate employee Gevorg',
    expectedAction: 'deactivate_employee' as const,
    expectedParams: { employeeName: 'Gevorg' },
  },
  {
    id: 'staff-remove-maria-en',
    prompt: 'Remove Maria from the team',
    expectedAction: 'deactivate_employee' as const,
    expectedParams: { employeeName: 'Maria' },
  },
  {
    id: 'staff-deactivate-provider-en',
    prompt: 'Delete provider Anna from staff roster',
    expectedAction: 'deactivate_employee' as const,
    expectedParams: { employeeName: 'Anna' },
  },
  {
    id: 'staff-offboard-jake-en',
    prompt: 'Offboard stylist Jake from active staff',
    expectedAction: 'deactivate_employee' as const,
    expectedParams: { employeeName: 'Jake' },
  },
  {
    id: 'staff-archive-emma-en',
    prompt: 'Archive employee Emma on the roster',
    expectedAction: 'deactivate_employee' as const,
    expectedParams: { employeeName: 'Emma' },
  },
  {
    id: 'staff-remove-david-en',
    prompt: 'Remove team member David from staff',
    expectedAction: 'deactivate_employee' as const,
    expectedParams: { employeeName: 'David' },
  },
  {
    id: 'staff-deactivate-leo-en',
    prompt: 'Deactivate provider Leo',
    expectedAction: 'deactivate_employee' as const,
    expectedParams: { employeeName: 'Leo' },
  },
  {
    id: 'staff-delete-chris-en',
    prompt: 'Delete staff member Chris from the team',
    expectedAction: 'deactivate_employee' as const,
    expectedParams: { employeeName: 'Chris' },
  },
  {
    id: 'staff-remove-sofia-en',
    prompt: 'Remove Sofia from team roster',
    expectedAction: 'deactivate_employee' as const,
    expectedParams: { employeeName: 'Sofia' },
  },
  {
    id: 'staff-deactivate-nina-en',
    prompt: 'Deactivate stylist Nina',
    expectedAction: 'deactivate_employee' as const,
    expectedParams: { employeeName: 'Nina' },
  },
  {
    id: 'staff-offboard-olivia-en',
    prompt: 'Offboard employee Olivia from providers',
    expectedAction: 'deactivate_employee' as const,
    expectedParams: { employeeName: 'Olivia' },
  },
] as const;

export const CONFIGURE_ONLINE_BOOKING_PROMPTS = [
  {
    id: 'staff-enable-booking-en',
    prompt: 'Enable online booking on our public page',
    expectedAction: 'configure_online_booking' as const,
    expectedParams: { enabled: true },
  },
  {
    id: 'staff-disable-booking-en',
    prompt: 'Turn off public booking website',
    expectedAction: 'configure_online_booking' as const,
    expectedParams: { enabled: false },
  },
  {
    id: 'staff-configure-booking-en',
    prompt: 'Configure online booking settings',
    expectedAction: 'configure_online_booking' as const,
  },
  {
    id: 'staff-activate-booking-en',
    prompt: 'Activate book online on the booking link',
    expectedAction: 'configure_online_booking' as const,
    expectedParams: { enabled: true },
  },
  {
    id: 'staff-hide-booking-en',
    prompt: 'Disable online booking for customers',
    expectedAction: 'configure_online_booking' as const,
    expectedParams: { enabled: false },
  },
  {
    id: 'staff-setup-booking-en',
    prompt: 'Set up public booking page online',
    expectedAction: 'configure_online_booking' as const,
  },
  {
    id: 'staff-turn-on-booking-en',
    prompt: 'Turn on online booking website now',
    expectedAction: 'configure_online_booking' as const,
    expectedParams: { enabled: true },
  },
  {
    id: 'staff-stop-booking-en',
    prompt: 'Stop public booking page bookings',
    expectedAction: 'configure_online_booking' as const,
    expectedParams: { enabled: false },
  },
  {
    id: 'staff-allow-booking-en',
    prompt: 'Allow customers to book online on our site',
    expectedAction: 'configure_online_booking' as const,
    expectedParams: { enabled: true },
  },
  {
    id: 'staff-configure-public-en',
    prompt: 'Configure our booking website settings',
    expectedAction: 'configure_online_booking' as const,
  },
  {
    id: 'staff-hide-public-en',
    prompt: 'Hide public booking link from customers',
    expectedAction: 'configure_online_booking' as const,
    expectedParams: { enabled: false },
  },
] as const;

export const STAFF_OPERATIONS_RESCUE_SCENARIOS = [
  {
    id: 'misclass-create-as-invite',
    prompt: 'Add stylist Anna to the team',
    misclassifiedAction: 'invite_staff_member',
    expectedAction: 'create_employee' as const,
  },
  {
    id: 'misclass-invite-as-create',
    prompt: 'Invite anna@salon.com to the provider app',
    misclassifiedAction: 'create_employee',
    expectedAction: 'invite_staff_member' as const,
  },
  {
    id: 'misclass-deactivate-as-cancel',
    prompt: 'Deactivate employee Gevorg',
    misclassifiedAction: 'cancel_bookings',
    expectedAction: 'deactivate_employee' as const,
  },
  {
    id: 'misclass-booking-as-schedule',
    prompt: 'Enable online booking on our public page',
    misclassifiedAction: 'create_direct_schedule',
    expectedAction: 'configure_online_booking' as const,
  },
  {
    id: 'unknown-create',
    prompt: 'Hire provider Jake jake@salon.com',
    misclassifiedAction: 'unknown',
    expectedAction: 'create_employee' as const,
  },
  {
    id: 'misclass-update-as-create',
    prompt: "Change Maria's email to maria@salon.com",
    misclassifiedAction: 'create_employee',
    expectedAction: 'update_employee' as const,
  },
  {
    id: 'misclass-rename-as-deactivate',
    prompt: 'Rename stylist Anna to Maria',
    misclassifiedAction: 'deactivate_employee',
    expectedAction: 'update_employee' as const,
  },
] as const;

export const STAFF_OPERATIONS_EN_SCENARIO_IDS = [
  ...CREATE_EMPLOYEE_PROMPTS.map((row) => row.id),
  ...UPDATE_EMPLOYEE_PROMPTS.map((row) => row.id),
  ...INVITE_STAFF_MEMBER_PROMPTS.map((row) => row.id),
  ...DEACTIVATE_EMPLOYEE_PROMPTS.map((row) => row.id),
  ...CONFIGURE_ONLINE_BOOKING_PROMPTS.map((row) => row.id),
] as const;

export const STAFF_OPERATIONS_PROMPT_FIXTURES: StaffOperationsPromptFixture[] =
  [
    ...CREATE_EMPLOYEE_PROMPTS,
    ...UPDATE_EMPLOYEE_PROMPTS,
    ...INVITE_STAFF_MEMBER_PROMPTS,
    ...DEACTIVATE_EMPLOYEE_PROMPTS,
    ...CONFIGURE_ONLINE_BOOKING_PROMPTS,
  ];
