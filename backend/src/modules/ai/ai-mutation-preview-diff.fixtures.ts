import type { ClassificationSurface } from './ai-classification-engine.types.js';

/** acc-5.3 — medium-risk calendar/catalog mutations that require diff preview before commit. */
export const MEDIUM_RISK_PREVIEW_ACTIONS = new Set([
  'create_booking',
  'reschedule_booking',
  'cancel_booking',
  'update_bookings',
  'fill_slot_from_waitlist',
  'mark_paid',
  'assign_booking_resource',
  'assign_employee_services',
  'create_service',
  'deactivate_service',
]);

export interface MutationPreviewScenario {
  id: string;
  surface: ClassificationSurface;
  action: string;
  params: Record<string, unknown>;
  prompt: string;
  confirmed?: boolean;
  expectPreview: boolean;
  expectStepAction?: string;
  expectDescriptionIncludes?: string[];
  expectImpactIncludes?: string;
}

export const MUTATION_PREVIEW_SCENARIOS: MutationPreviewScenario[] = [
  {
    id: 'dash-create-booking-calendar',
    surface: 'dashboard',
    action: 'create_booking',
    prompt: 'book massage with Gevorg tomorrow at 10',
    params: {
      employeeName: 'Gevorg',
      serviceName: 'Massage',
      customerName: 'Maria',
      date: '2026-06-08',
      timeSlot: '10:00',
    },
    expectPreview: true,
    expectStepAction: 'create_booking',
    expectDescriptionIncludes: ['Massage', 'Gevorg', 'Maria', '2026-06-08'],
    expectImpactIncludes: 'Adds one appointment',
  },
  {
    id: 'dash-reschedule-booking',
    surface: 'dashboard',
    action: 'reschedule_booking',
    prompt: 'move Maria to 3pm tomorrow',
    params: {
      customerName: 'Maria',
      date: '2026-06-08',
      startTime: '15:00',
    },
    expectPreview: true,
    expectDescriptionIncludes: ['Maria', '2026-06-08'],
    expectImpactIncludes: 'Moves booking',
  },
  {
    id: 'dash-mark-paid',
    surface: 'dashboard',
    action: 'mark_paid',
    prompt: 'mark Maria booking paid',
    params: { customerName: 'Maria', bookingId: 'bk-1' },
    expectPreview: true,
    expectImpactIncludes: 'payment status',
  },
  {
    id: 'dash-fill-waitlist-slot',
    surface: 'dashboard',
    action: 'fill_slot_from_waitlist',
    prompt: 'fill massage slot from waitlist tomorrow',
    params: { serviceName: 'Massage', date: '2026-06-08' },
    expectPreview: true,
    expectDescriptionIncludes: ['waitlist', 'Massage'],
  },
  {
    id: 'dash-assign-services-catalog',
    surface: 'dashboard',
    action: 'assign_employee_services',
    prompt: 'assign massage and facial to Gevorg',
    params: { employeeName: 'Gevorg', serviceNames: ['Massage', 'Facial'] },
    expectPreview: true,
    expectImpactIncludes: 'catalog',
  },
  {
    id: 'dash-create-service-catalog',
    surface: 'dashboard',
    action: 'create_service',
    prompt: 'add hot stone massage 90 min $120',
    params: { serviceName: 'Hot Stone Massage', durationMinutes: 90, price: 120 },
    expectPreview: true,
    expectImpactIncludes: 'catalog',
  },
  {
    id: 'dash-cancel-booking-medium',
    surface: 'dashboard',
    action: 'cancel_booking',
    prompt: 'cancel Maria booking tomorrow',
    params: { customerName: 'Maria', date: '2026-06-08', bookingId: 'bk-9' },
    expectPreview: true,
    expectImpactIncludes: 'Removes one appointment',
  },
  {
    id: 'dash-high-risk-skips-medium-preview',
    surface: 'dashboard',
    action: 'cancel_bookings',
    prompt: 'cancel all bookings tomorrow',
    params: { bookingIds: ['a', 'b', 'c'], date: '2026-06-08' },
    expectPreview: false,
  },
  {
    id: 'dash-confirmed-skips-preview',
    surface: 'dashboard',
    action: 'create_booking',
    prompt: 'book massage tomorrow',
    params: { serviceName: 'Massage', date: '2026-06-08' },
    confirmed: true,
    expectPreview: false,
  },
  {
    id: 'dash-read-only-skips-preview',
    surface: 'dashboard',
    action: 'list_appointments',
    prompt: 'show appointments today',
    params: { date: '2026-06-08' },
    expectPreview: false,
  },
  {
    id: 'provider-reschedule-medium',
    surface: 'provider',
    action: 'reschedule_booking',
    prompt: 'move my 2pm to 4pm',
    params: { date: '2026-06-08', startTime: '16:00', bookingId: 'bk-2' },
    expectPreview: true,
    expectImpactIncludes: 'Moves booking',
  },
  {
    id: 'customer-create-booking-medium',
    surface: 'customer',
    action: 'create_booking',
    prompt: 'book facial tomorrow evening',
    params: { serviceName: 'Facial', date: '2026-06-08', timeSlot: '18:00' },
    expectPreview: true,
    expectDescriptionIncludes: ['Facial'],
  },
];
