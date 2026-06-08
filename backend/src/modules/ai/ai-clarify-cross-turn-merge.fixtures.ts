import type { ClassificationSurface } from './ai-classification-engine.types.js';

export interface CrossTurnSlotMergeScenario {
  id: string;
  surface: ClassificationSurface;
  prompt: string;
  followUpPrompt?: string;
  originalAction: string;
  classifierAction?: string;
  classifierParams?: Record<string, unknown>;
  sessionContext: Record<string, unknown>;
  expectAction?: string;
  expectParams: Record<string, unknown>;
  expectPromptIncludes?: string;
}

/** acc-4.5 — lossless cross-turn slot merge into the original intent. */
export const CROSS_TURN_SLOT_MERGE_SCENARIOS: CrossTurnSlotMergeScenario[] = [
  {
    id: 'dash-service-then-time',
    surface: 'dashboard',
    prompt: 'tomorrow at 10:00',
    followUpPrompt: 'book massage with Anna. tomorrow at 10:00',
    originalAction: 'create_booking',
    classifierAction: 'create_booking',
    classifierParams: { timeSlot: '10:00', date: '2026-06-09' },
    sessionContext: {
      _clarifyContext: {
        originalPrompt: 'book massage with Anna',
        originalAction: 'create_booking',
        partialParams: {
          serviceName: 'Swedish Massage',
          employeeName: 'Anna Smith',
        },
        clarifyRound: 1,
        clarifyKind: 'targeted_slots',
      },
      _clarifyMemory: { serviceName: 'Swedish Massage', employeeName: 'Anna Smith' },
    },
    expectAction: 'create_booking',
    expectParams: {
      serviceName: 'Swedish Massage',
      employeeName: 'Anna Smith',
      timeSlot: '10:00',
      date: '2026-06-09',
    },
  },
  {
    id: 'dash-unknown-follow-up-restores-action',
    surface: 'dashboard',
    prompt: 'tomorrow at 10',
    originalAction: 'create_booking',
    classifierAction: 'unknown',
    classifierParams: { date: '2026-06-09', timeSlot: '10:00' },
    sessionContext: {
      _clarifyContext: {
        originalPrompt: 'book massage with Gevorg',
        originalAction: 'create_booking',
        partialParams: { serviceName: 'Massage', employeeName: 'Gevorg' },
        clarifyRound: 1,
        clarifyKind: 'targeted_slots',
      },
    },
    expectAction: 'create_booking',
    expectParams: {
      serviceName: 'Massage',
      employeeName: 'Gevorg',
      date: '2026-06-09',
      timeSlot: '10:00',
    },
  },
  {
    id: 'customer-date-carried',
    surface: 'customer',
    prompt: 'book facial at 15:00',
    originalAction: 'book_appointment',
    classifierAction: 'book_appointment',
    classifierParams: { serviceName: 'Facial', timeSlot: '15:00' },
    sessionContext: {
      _clarifyContext: {
        originalPrompt: 'book facial next Friday',
        originalAction: 'book_appointment',
        partialParams: { date: '2026-06-13' },
        clarifyRound: 1,
        clarifyKind: 'targeted_slots',
      },
      date: '2026-06-13',
      _clarifyMemory: { date: '2026-06-13' },
    },
    expectParams: {
      date: '2026-06-13',
      serviceName: 'Facial',
      timeSlot: '15:00',
    },
  },
  {
    id: 'public-availability-merge',
    surface: 'public',
    prompt: 'massage tomorrow evening',
    originalAction: 'check_availability',
    classifierAction: 'check_availability',
    classifierParams: { timeOfDay: 'evening', date: '2026-06-09' },
    sessionContext: {
      _clarifyContext: {
        originalPrompt: 'check availability for massage',
        originalAction: 'check_availability',
        partialParams: { serviceName: 'Swedish Massage' },
        clarifyRound: 1,
        clarifyKind: 'entity_disambiguation',
      },
      serviceName: 'Swedish Massage',
    },
    expectParams: {
      serviceName: 'Swedish Massage',
      date: '2026-06-09',
      timeOfDay: 'evening',
    },
  },
  {
    id: 'provider-customer-slot-merge',
    surface: 'provider',
    prompt: 'mark paid today',
    originalAction: 'mark_paid',
    classifierAction: 'mark_paid',
    classifierParams: { date: '2026-06-08' },
    sessionContext: {
      _clarifyContext: {
        originalPrompt: 'mark Jane paid',
        originalAction: 'mark_paid',
        partialParams: { customerName: 'Jane Doe' },
        clarifyRound: 1,
        clarifyKind: 'targeted_slots',
      },
      customerName: 'Jane Doe',
    },
    expectParams: {
      customerName: 'Jane Doe',
      date: '2026-06-08',
    },
  },
  {
    id: 'dash-later-params-do-not-clobber',
    surface: 'dashboard',
    prompt: 'book massage with Anna tomorrow at 10',
    originalAction: 'create_booking',
    classifierAction: 'create_booking',
    classifierParams: {
      serviceName: 'Deep Tissue Massage',
      employeeName: 'Anna Smith',
      date: '2026-06-09',
      timeSlot: '10:00',
    },
    sessionContext: {
      _clarifyContext: {
        originalPrompt: 'book massage with Anna',
        originalAction: 'create_booking',
        partialParams: {
          serviceName: 'Swedish Massage',
          employeeName: 'Anna Smith',
        },
        clarifyRound: 2,
        clarifyKind: 'targeted_slots',
      },
    },
    expectParams: {
      serviceName: 'Deep Tissue Massage',
      employeeName: 'Anna Smith',
      date: '2026-06-09',
      timeSlot: '10:00',
    },
  },
];
