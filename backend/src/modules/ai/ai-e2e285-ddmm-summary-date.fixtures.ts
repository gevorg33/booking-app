/**
 * e2e-bug.285 — AI success summaries must not misread DD/MM (01/08/2026)
 * as US "January 8" when startTime is 2026-08-01.
 */

export type E2e285DateLabelCase = {
  id: string;
  isoDayOrStart: string;
  /** Substring that must appear in the AI label (month word or unambiguous form). */
  expectContains: string;
  /** Slash DD/MM must not appear. */
  forbidSlashDdMm?: string;
};

export const E2E285_AI_DATE_LABEL_CASES: readonly E2e285DateLabelCase[] = [
  {
    id: 'e2e285-aug-1-iso-day',
    isoDayOrStart: '2026-08-01',
    expectContains: 'August',
    forbidSlashDdMm: '01/08/2026',
  },
  {
    id: 'e2e285-aug-1-iso-datetime',
    isoDayOrStart: '2026-08-01T09:00:00.000Z',
    expectContains: 'August',
    forbidSlashDdMm: '01/08/2026',
  },
  {
    id: 'e2e285-aug-3-iso-day',
    isoDayOrStart: '2026-08-03',
    expectContains: 'August',
    forbidSlashDdMm: '03/08/2026',
  },
  {
    id: 'e2e285-mar-8-must-not-look-like-aug',
    isoDayOrStart: '2026-03-08',
    expectContains: 'March',
    forbidSlashDdMm: '08/03/2026',
  },
  {
    id: 'e2e285-jan-8-real',
    isoDayOrStart: '2026-01-08',
    expectContains: 'January',
  },
];

export type E2e285MisreadCase = {
  id: string;
  summary: string;
  startTime: string;
  expectMisread: boolean;
};

export const E2E285_SUMMARY_MISREAD_CASES: readonly E2e285MisreadCase[] = [
  {
    id: 'e2e285-misread-jan-for-aug',
    summary: 'Booked for tomorrow, January 8, 2026 at 09:00.',
    startTime: '2026-08-01T09:00:00.000Z',
    expectMisread: true,
  },
  {
    id: 'e2e285-misread-mar-for-aug',
    summary: 'Rescheduled to Monday, March 8, 2026.',
    startTime: '2026-08-03T10:00:00.000Z',
    expectMisread: true,
  },
  {
    id: 'e2e285-ok-august',
    summary: 'Booking created: Swedish massage — 1 August 2026 09:00–10:00',
    startTime: '2026-08-01T09:00:00.000Z',
    expectMisread: false,
  },
  {
    id: 'e2e285-ok-no-month-name',
    summary: 'Orchestration completed (1/1 steps).\n• Booking created (abc)',
    startTime: '2026-08-01T09:00:00.000Z',
    expectMisread: false,
  },
];

export const E2E285_SKIP_ENRICH_ACTIONS = [
  'create_booking',
  'reschedule_booking',
  'book_nearest_slot',
  'update_bookings',
  'list_tour_calendar_week',
  'explain_clinic_services',
] as const;
