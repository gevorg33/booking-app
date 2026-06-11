import type { DashboardOpenSlot } from './ai-dashboard-create-booking.logic.js';

export const DASHBOARD_CREATE_BOOKING_SERVICE_SCENARIOS = [
  {
    id: 'dash-book-budget-cheapest-haircut',
    params: { serviceCategory: 'haircut', maxPrice: 50, serviceRank: 'lowest_price' },
    catalog: [
      { id: 'h-30', name: 'Basic cut', price: 30, serviceCategory: 'haircut' },
      { id: 'h-60', name: 'Premium cut', price: 60, serviceCategory: 'haircut' },
    ],
    expectedServiceId: 'h-30',
  },
  {
    id: 'dash-book-rank-premium-massage',
    params: { serviceCategory: 'massage', serviceRank: 'highest_price' },
    catalog: [
      { id: 'm-55', name: 'Massage basic', price: 55, serviceCategory: 'massage' },
      { id: 'm-95', name: 'Massage premium', price: 95, serviceCategory: 'massage' },
    ],
    expectedServiceId: 'm-95',
  },
  {
    id: 'dash-book-budget-no-match',
    params: { serviceCategory: 'haircut', maxPrice: 20 },
    catalog: [
      { id: 'h-30', name: 'Basic cut', price: 30, serviceCategory: 'haircut' },
    ],
    expectedServiceId: null,
    expectNoMatch: true,
  },
] as const;

export const DASHBOARD_FIRST_AVAILABLE_DAY_SCENARIOS: Array<{
  id: string;
  isoDay: string;
  timeZone: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | null;
  notBeforeTime: string | null;
  providers: Array<{
    id: string;
    name: string;
    hasServiceBlock: boolean;
    openSlots: DashboardOpenSlot[];
  }>;
  expected: { employeeId: string; timeSlot: string } | null;
}> = [
  {
    id: 'dash-first-avail-evening-window',
    isoDay: '2026-06-12',
    timeZone: 'UTC',
    timeOfDay: 'evening',
    notBeforeTime: '17:00',
    providers: [
      {
        id: 'e1',
        name: 'Anna',
        hasServiceBlock: true,
        openSlots: [
          { start: '09:00', end: '12:00' },
          { start: '18:00', end: '19:00' },
        ],
      },
      {
        id: 'e2',
        name: 'Bob',
        hasServiceBlock: true,
        openSlots: [{ start: '17:30', end: '18:30' }],
      },
    ],
    expected: { employeeId: 'e2', timeSlot: '17:30' },
  },
  {
    id: 'dash-first-avail-morning-only',
    isoDay: '2026-06-13',
    timeZone: 'UTC',
    timeOfDay: 'morning',
    notBeforeTime: null,
    providers: [
      {
        id: 'e1',
        name: 'Anna',
        hasServiceBlock: true,
        openSlots: [{ start: '14:00', end: '15:00' }],
      },
    ],
    expected: null,
  },
];
