export type GuidedBookingStep = 'welcome' | 'salon' | 'service' | 'slot' | 'confirm';

export const GUIDED_BOOKING_STEPS: GuidedBookingStep[] = [
  'welcome',
  'salon',
  'service',
  'slot',
  'confirm',
];

export interface GuidedBookingStepContext {
  slotSelected?: boolean;
}

export function resolveGuidedBookingStep(
  pathname: string,
  context: GuidedBookingStepContext = {},
): GuidedBookingStep {
  if (pathname === '/' || pathname === '') return 'welcome';
  if (/^\/s\/[^/]+\/book\/[^/]+$/.test(pathname)) {
    return context.slotSelected ? 'confirm' : 'slot';
  }
  if (pathname.includes('/services')) return 'service';
  if (/^\/s\/[^/]+(\/home)?\/?$/.test(pathname)) return 'salon';
  return 'salon';
}

export function shouldAttemptNearestSlot(input: {
  nearestAttempted: boolean;
  slot: string;
}): boolean {
  return !input.nearestAttempted && !input.slot.trim();
}

export function resolveSlotPreselection(input: {
  nearest: { dateKey: string; startTime: string; employeeId?: string | null } | null;
  slots: Array<{ startTime: string }>;
  currentDate: string;
}): NearestSlotSelection | null {
  if (input.nearest) {
    return resolveNearestSlotSelection(input.nearest);
  }
  const earliest = pickEarliestSlot(input.slots);
  if (!earliest) return null;
  return { date: input.currentDate, slot: earliest };
}

export function guidedBookingProgress(step: GuidedBookingStep): number {
  const index = GUIDED_BOOKING_STEPS.indexOf(step);
  if (index < 0) return 0;
  return Math.round(((index + 1) / GUIDED_BOOKING_STEPS.length) * 100);
}

export function pickEarliestSlot(slots: Array<{ startTime: string }>): string | null {
  if (slots.length === 0) return null;
  return [...slots].sort((left, right) => Date.parse(left.startTime) - Date.parse(right.startTime))[0]
    ?.startTime ?? null;
}

export interface NearestSlotSelection {
  date: string;
  slot: string;
  employeeId?: string;
}

export function resolveNearestSlotSelection(input: {
  dateKey: string;
  startTime: string;
  employeeId?: string | null;
}): NearestSlotSelection {
  return {
    date: input.dateKey,
    slot: input.startTime,
    employeeId: input.employeeId ?? undefined,
  };
}

export function guidedBookingStepLabel(
  step: GuidedBookingStep,
  copy: {
    guidedStepWelcome: string;
    guidedStepSalon: string;
    guidedStepService: string;
    guidedStepSlot: string;
    guidedStepConfirm: string;
  },
): string {
  switch (step) {
    case 'welcome':
      return copy.guidedStepWelcome;
    case 'salon':
      return copy.guidedStepSalon;
    case 'service':
      return copy.guidedStepService;
    case 'slot':
      return copy.guidedStepSlot;
    case 'confirm':
      return copy.guidedStepConfirm;
    default:
      return step;
  }
}
