import type { ClassificationSurface } from './ai-classification-engine.types.js';

export interface LosslessClarifyMergeScenario {
  id: string;
  surface: ClassificationSurface;
  followUpPrompt: string;
  followUpAnswers?: Record<string, string>;
  originalAction: string;
  classifierAction?: string;
  classifierParams?: Record<string, unknown>;
  sessionContext: Record<string, unknown>;
  expectMergedParams: Record<string, unknown>;
  expectRestoredAction: string;
  expectExecuteImmediately: boolean;
}

/** n99-1.4 — lossless slot merge executes immediately when complete. */
export const LOSSLESS_CLARIFY_MERGE_SCENARIOS: LosslessClarifyMergeScenario[] = [
  {
    id: 'dash-multi-field-form-complete',
    surface: 'dashboard',
    followUpPrompt:
      'book massage with Anna. I meant Anna Smith. Date: 2026-06-09. Time: 10:00',
    originalAction: 'create_booking',
    classifierAction: 'create_booking',
    classifierParams: { timeSlot: '10:00', date: '2026-06-09' },
    sessionContext: {
      _clarifyContext: {
        originalPrompt: 'book massage with Anna',
        originalAction: 'create_booking',
        partialParams: { serviceName: 'Swedish Massage' },
        clarifyRound: 1,
        clarifyKind: 'targeted_slots',
      },
    },
    expectRestoredAction: 'create_booking',
    expectMergedParams: {
      serviceName: 'Swedish Massage',
      employeeName: 'Anna Smith',
      date: '2026-06-09',
      timeSlot: '10:00',
    },
    expectExecuteImmediately: true,
  },
  {
    id: 'dash-memory-answers-complete-booking',
    surface: 'dashboard',
    followUpPrompt: 'tomorrow at 10:00',
    followUpAnswers: { date: '2026-06-09', timeSlot: '10:00' },
    originalAction: 'create_booking',
    classifierAction: 'create_booking',
    classifierParams: { timeSlot: '10:00' },
    sessionContext: {
      _clarifyContext: {
        originalPrompt: 'book massage with Gevorg',
        originalAction: 'create_booking',
        partialParams: {
          serviceName: 'Massage',
          employeeName: 'Gevorg',
        },
        clarifyRound: 1,
        clarifyKind: 'targeted_slots',
      },
      _clarifyMemory: { date: '2026-06-09', timeSlot: '10:00' },
    },
    expectRestoredAction: 'create_booking',
    expectMergedParams: {
      serviceName: 'Massage',
      employeeName: 'Gevorg',
      date: '2026-06-09',
      timeSlot: '10:00',
    },
    expectExecuteImmediately: true,
  },
  {
    id: 'dash-still-missing-service',
    surface: 'dashboard',
    followUpPrompt: 'tomorrow at 10:00',
    followUpAnswers: { date: '2026-06-09', timeSlot: '10:00' },
    originalAction: 'create_booking',
    classifierAction: 'create_booking',
    classifierParams: { date: '2026-06-09', timeSlot: '10:00' },
    sessionContext: {
      _clarifyContext: {
        originalPrompt: 'book with Gevorg',
        originalAction: 'create_booking',
        partialParams: { employeeName: 'Gevorg' },
        clarifyRound: 1,
        clarifyKind: 'targeted_slots',
      },
    },
    expectRestoredAction: 'create_booking',
    expectMergedParams: {
      employeeName: 'Gevorg',
      date: '2026-06-09',
      timeSlot: '10:00',
    },
    expectExecuteImmediately: false,
  },
  {
    id: 'customer-date-service-time-complete',
    surface: 'customer',
    followUpPrompt: 'book facial at 15:00',
    followUpAnswers: { serviceName: 'Facial', timeSlot: '15:00' },
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
    },
    expectRestoredAction: 'book_appointment',
    expectMergedParams: {
      date: '2026-06-13',
      serviceName: 'Facial',
      timeSlot: '15:00',
    },
    expectExecuteImmediately: true,
  },
];
