import type { ClassificationSurface } from './ai-classification-engine.types.js';
import type { AiTraceAnalyticsRow } from './ai-command-trace.util.js';

/** n99-2.7 — auto-fill undo/👎 watchdog tightens the confidence gate. */
export interface N99AutofillWatchdogScenario {
  id: string;
  autoFillTraceCount: number;
  autoFillUndoCount: number;
  autoFillDownvoteCount: number;
  baseThreshold?: number;
  expectAdjustedThreshold: number;
  expectReason?: string;
}

export interface N99AutofillPreviewScenario {
  id: string;
  surface?: ClassificationSurface;
  action: string;
  params: Record<string, unknown>;
  taskId?: string;
  expectPreviewFields: string[];
  expectOneTapUndo: boolean;
  expectPostExecAssertion: boolean;
}

export interface N99AutofillWatchdogTraceScenario {
  id: string;
  rows: AiTraceAnalyticsRow[];
  baseThreshold?: number;
  expectAdjustedThreshold: number;
}

export const N99_AUTOFILL_WATCHDOG_SCENARIOS: N99AutofillWatchdogScenario[] = [
  {
    id: 'hold-when-clean',
    autoFillTraceCount: 50,
    autoFillUndoCount: 0,
    autoFillDownvoteCount: 0,
    baseThreshold: 0.72,
    expectAdjustedThreshold: 0.72,
    expectReason: 'stable',
  },
  {
    id: 'hold-insufficient-sample',
    autoFillTraceCount: 8,
    autoFillUndoCount: 4,
    autoFillDownvoteCount: 2,
    baseThreshold: 0.72,
    expectAdjustedThreshold: 0.72,
    expectReason: 'insufficient_auto_fill_sample',
  },
  {
    id: 'tighten-on-high-undo',
    autoFillTraceCount: 40,
    autoFillUndoCount: 3,
    autoFillDownvoteCount: 2,
    baseThreshold: 0.72,
    expectAdjustedThreshold: 0.77,
    expectReason: 'auto_fill_undo_rate_high',
  },
  {
    id: 'tighten-on-elevated-undo',
    autoFillTraceCount: 100,
    autoFillUndoCount: 2,
    autoFillDownvoteCount: 1,
    baseThreshold: 0.72,
    expectAdjustedThreshold: 0.75,
    expectReason: 'auto_fill_undo_rate_elevated',
  },
  {
    id: 'cap-at-ninety',
    autoFillTraceCount: 200,
    autoFillUndoCount: 20,
    autoFillDownvoteCount: 10,
    baseThreshold: 0.88,
    expectAdjustedThreshold: 0.9,
    expectReason: 'auto_fill_undo_rate_high',
  },
  {
    id: 'hy-tighten-downvotes-only',
    autoFillTraceCount: 25,
    autoFillUndoCount: 0,
    autoFillDownvoteCount: 1,
    baseThreshold: 0.72,
    expectAdjustedThreshold: 0.75,
    expectReason: 'auto_fill_undo_rate_elevated',
  },
];

export const N99_AUTOFILL_PREVIEW_SCENARIOS: N99AutofillPreviewScenario[] = [
  {
    id: 'en-dashboard-provider-autofill',
    surface: 'dashboard',
    action: 'create_booking',
    params: {
      serviceName: 'Massage',
      date: '2026-06-09',
      timeSlot: '10:00',
      employeeName: 'Anna Smith',
      _noClarifyAutofill: ['employeeName'],
    },
    taskId: 'task-autofill-1',
    expectPreviewFields: ['employeeName'],
    expectOneTapUndo: true,
    expectPostExecAssertion: true,
  },
  {
    id: 'en-dashboard-service-autofill',
    surface: 'dashboard',
    action: 'create_booking',
    params: {
      employeeName: 'Gevorg',
      date: '2026-06-09',
      timeSlot: '14:00',
      serviceName: 'Facemassage',
      _noClarifyAutofill: ['serviceName'],
    },
    taskId: 'task-autofill-2',
    expectPreviewFields: ['serviceName'],
    expectOneTapUndo: true,
    expectPostExecAssertion: true,
  },
  {
    id: 'en-dashboard-multi-autofill',
    surface: 'dashboard',
    action: 'create_booking',
    params: {
      date: '2026-06-09',
      timeSlot: '09:00',
      employeeName: 'Maria Lopez',
      serviceName: 'Haircut',
      _noClarifyAutofill: ['employeeName', 'serviceName'],
    },
    taskId: 'task-autofill-3',
    expectPreviewFields: ['employeeName', 'serviceName'],
    expectOneTapUndo: true,
    expectPostExecAssertion: true,
  },
  {
    id: 'en-dashboard-no-task-id',
    surface: 'dashboard',
    action: 'create_booking',
    params: {
      serviceName: 'Color',
      date: '2026-06-09',
      employeeName: 'Sam',
      _noClarifyAutofill: ['employeeName'],
    },
    expectPreviewFields: ['employeeName'],
    expectOneTapUndo: false,
    expectPostExecAssertion: true,
  },
  {
    id: 'provider-mark-paid-autofill',
    surface: 'provider',
    action: 'mark_paid',
    params: {
      bookingId: 'bk-1',
      customerName: 'Alex',
      _noClarifyAutofill: ['customerName'],
    },
    taskId: 'task-provider-1',
    expectPreviewFields: ['customerName'],
    expectOneTapUndo: true,
    expectPostExecAssertion: true,
  },
  {
    id: 'customer-book-autofill',
    surface: 'customer',
    action: 'book_appointment',
    params: {
      serviceName: 'Massage',
      date: '2026-06-10',
      employeeName: 'Anna',
      _noClarifyAutofill: ['employeeName'],
    },
    taskId: 'task-customer-1',
    expectPreviewFields: ['employeeName'],
    expectOneTapUndo: true,
    expectPostExecAssertion: false,
  },
  {
    id: 'public-book-autofill',
    surface: 'public',
    action: 'book_appointment',
    params: {
      serviceName: 'Haircut',
      date: '2026-06-11',
      timeSlot: '11:00',
      _noClarifyAutofill: ['timeSlot'],
    },
    taskId: 'task-public-1',
    expectPreviewFields: ['timeSlot'],
    expectOneTapUndo: true,
    expectPostExecAssertion: false,
  },
  {
    id: 'en-read-only-no-preview',
    surface: 'dashboard',
    action: 'show_appointments',
    params: { date: '2026-06-09' },
    expectPreviewFields: [],
    expectOneTapUndo: false,
    expectPostExecAssertion: false,
  },
];

export const N99_AUTOFILL_WATCHDOG_TRACE_SCENARIOS: N99AutofillWatchdogTraceScenario[] = [
  {
    id: 'trace-rows-clean',
    baseThreshold: 0.72,
    expectAdjustedThreshold: 0.72,
    rows: [
      {
        traceId: 't1',
        outcome: 'executed',
        autofillFields: ['employeeName'],
        failureSignal: undefined,
        feedbackRating: undefined,
      },
      {
        traceId: 't2',
        outcome: 'executed',
        autofillFields: ['serviceName'],
        failureSignal: undefined,
        feedbackRating: 'up',
      },
    ] as unknown as AiTraceAnalyticsRow[],
  },
  {
    id: 'trace-rows-high-undo-rate',
    baseThreshold: 0.72,
    expectAdjustedThreshold: 0.77,
    rows: Array.from({ length: 20 }, (_, index) => ({
      traceId: `t-${index}`,
      outcome: 'executed' as const,
      autofillFields: ['employeeName'],
      failureSignal: index < 2 ? ('wrong_execution' as const) : undefined,
      feedbackRating: index === 2 ? ('down' as const) : undefined,
    })) as AiTraceAnalyticsRow[],
  },
];

/** @deprecated — use N99_AUTOFILL_WATCHDOG_SCENARIOS */
export const N99_NO_CLARIFY_WATCHDOG_SCENARIOS = N99_AUTOFILL_WATCHDOG_SCENARIOS;
