import type { GuidedBookingStep } from './guided-booking-flow.util.js';

export const GUIDED_BOOKING_SCENARIOS = [
  { id: 'welcome', pathname: '/', step: 'welcome' as GuidedBookingStep, progress: 20 },
  { id: 'salon', pathname: '/s/glow-nails/home', step: 'salon' as GuidedBookingStep, progress: 40 },
  {
    id: 'service',
    pathname: '/s/glow-nails/services',
    step: 'service' as GuidedBookingStep,
    progress: 60,
  },
  {
    id: 'slot',
    pathname: '/s/glow-nails/book/svc-1',
    slotSelected: false,
    step: 'slot' as GuidedBookingStep,
    progress: 80,
  },
  {
    id: 'confirm',
    pathname: '/s/glow-nails/book/svc-1',
    slotSelected: true,
    step: 'confirm' as GuidedBookingStep,
    progress: 100,
  },
] as const;

export const NEAREST_SLOT_SCENARIOS = [
  {
    id: 'earliest',
    slots: [
      { startTime: '2026-06-10T11:00:00.000Z' },
      { startTime: '2026-06-10T09:30:00.000Z' },
    ],
    expected: '2026-06-10T09:30:00.000Z',
  },
  {
    id: 'empty',
    slots: [],
    expected: null,
  },
] as const;

export const SLOT_PRESELECTION_SCENARIOS = [
  {
    id: 'nearest-api',
    nearest: {
      dateKey: '2026-06-11',
      startTime: '2026-06-11T10:00:00.000Z',
      employeeId: 'emp-1',
    },
    slots: [{ startTime: '2026-06-10T09:00:00.000Z' }],
    currentDate: '2026-06-10',
    expected: {
      date: '2026-06-11',
      slot: '2026-06-11T10:00:00.000Z',
      employeeId: 'emp-1',
    },
  },
  {
    id: 'fallback-earliest-on-day',
    nearest: null,
    slots: [
      { startTime: '2026-06-10T15:00:00.000Z' },
      { startTime: '2026-06-10T11:30:00.000Z' },
    ],
    currentDate: '2026-06-10',
    expected: {
      date: '2026-06-10',
      slot: '2026-06-10T11:30:00.000Z',
    },
  },
  {
    id: 'no-slots',
    nearest: null,
    slots: [],
    currentDate: '2026-06-10',
    expected: null,
  },
] as const;
