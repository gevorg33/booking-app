import { BOOKING_STATUS_I18N_KEYS } from './booking-detail-panel.util';

/** Keys used in `EmployeeFormModal`. */
export const EMPLOYEE_FORM_MODAL_I18N_KEYS = [
  'employees.addEmployee',
  'employees.editEmployee',
  'employees.formSubtitle',
  'employees.servicesRequired',
  'employees.invalidPhone',
  'employees.role',
  'employees.titlePlaceholder',
  'employees.servicesOffered',
  'employees.servicesOfferedHint',
  'employees.createEmployee',
  'common.name',
  'common.email',
  'common.phone',
  'common.saving',
  'common.saveChanges',
  'common.cancel',
] as const;

/** Keys used in `CustomerDetailPanel` (including subscription subsection). */
export const CUSTOMER_DETAIL_PANEL_I18N_KEYS = [
  'customers.detailTitle',
  'customers.detailLoadFailed',
  'customers.noSubscriptions',
  'customers.subscriptionFallback',
  'customers.subscriptionAppointmentsLeft',
  'customers.hideUsage',
  'customers.viewUsageHistory',
  'customers.usageRow',
  'customers.noUsageYet',
  'customers.editTags',
  'customers.customerTag',
  'customers.tagNone',
  'customers.tagAutoVipHint',
  'customers.statVisits',
  'customers.upcoming',
  'customers.columnNoShows',
  'customers.subscriptionsSection',
  'customers.appointmentHistorySection',
  'customers.noAppointmentsYet',
  'customers.appointmentFallback',
  'customers.withProvider',
  'common.close',
  'common.save',
  ...Object.values(BOOKING_STATUS_I18N_KEYS),
] as const;

/** Keys used in the support ticket modal (`SupportTicketButton`). */
export const SUPPORT_MODAL_I18N_KEYS = [
  'support.contactSupport',
  'support.navLabel',
  'support.createFailed',
  'support.ticketCreated',
  'support.openInZendesk',
  'support.modalHint',
  'support.subject',
  'support.subjectPlaceholder',
  'support.message',
  'support.messagePlaceholder',
  'support.submitTicket',
] as const;

/** Keys used in employee page overlay modals (deactivate + invite). */
export const EMPLOYEE_PAGE_MODAL_I18N_KEYS = [
  'employees.deactivateModalTitle',
  'employees.deactivateModalBody',
  'employees.deactivate',
  'invite.sendInvite',
  'invite.sendInviteModalBody',
  'invite.inviteSent',
  'invite.employeeName',
  'invite.accessRole',
  'employees.namePlaceholderOptional',
  'common.deactivating',
  'common.email',
  'common.saving',
  'common.cancel',
] as const;

export type DashboardModalI18nKey =
  | (typeof EMPLOYEE_FORM_MODAL_I18N_KEYS)[number]
  | (typeof CUSTOMER_DETAIL_PANEL_I18N_KEYS)[number]
  | (typeof SUPPORT_MODAL_I18N_KEYS)[number]
  | (typeof EMPLOYEE_PAGE_MODAL_I18N_KEYS)[number];

export function allDashboardModalI18nKeys(): string[] {
  return [
    ...new Set([
      ...EMPLOYEE_FORM_MODAL_I18N_KEYS,
      ...CUSTOMER_DETAIL_PANEL_I18N_KEYS,
      ...SUPPORT_MODAL_I18N_KEYS,
      ...EMPLOYEE_PAGE_MODAL_I18N_KEYS,
    ]),
  ];
}
