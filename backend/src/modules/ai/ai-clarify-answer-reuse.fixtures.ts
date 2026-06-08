import type { ClassificationSurface } from './ai-classification-engine.types.js';

export interface ClarifyAnswerReuseScenario {
  id: string;
  surface: ClassificationSurface;
  prompt: string;
  action: string;
  params?: Record<string, unknown>;
  sessionContext?: Record<string, unknown>;
  incomingAnswers?: Record<string, string>;
  expectParams?: Record<string, unknown>;
  expectMemory?: Record<string, string>;
  expectSkippedFields?: string[];
  expectMissingFields?: string[];
  expectAliases?: Record<string, { employeeName?: string | null; serviceName?: string | null; customerName?: string | null }>;
}

/** acc-4.4 — clarify answers persist for the session and feed entity memory (ai-i2). */
export const CLARIFY_ANSWER_REUSE_SCENARIOS: ClarifyAnswerReuseScenario[] = [
  {
    id: 'dash-date-reuse',
    surface: 'dashboard',
    prompt: 'book massage with Gevorg',
    action: 'create_booking',
    sessionContext: { _clarifyMemory: { date: '2026-06-08', timeSlot: '10:00' } },
    expectParams: { date: '2026-06-08', timeSlot: '10:00' },
    expectMemory: { date: '2026-06-08', timeSlot: '10:00' },
    expectSkippedFields: ['date', 'timeSlot'],
  },
  {
    id: 'dash-employee-chip-memory',
    surface: 'dashboard',
    prompt: 'book with Anna tomorrow',
    action: 'create_booking',
    incomingAnswers: { employeeName: 'Anna Smith' },
    expectParams: { employeeName: 'Anna Smith' },
    expectMemory: { employeeName: 'Anna Smith' },
    expectAliases: {
      anna: { employeeName: 'Anna Smith', serviceName: null, customerName: null },
    },
  },
  {
    id: 'customer-service-reuse',
    surface: 'customer',
    prompt: 'book next Friday at 14:00',
    action: 'book_appointment',
    sessionContext: {
      _clarifyMemory: { serviceName: 'Swedish Massage', employeeName: 'Maria' },
    },
    expectParams: { serviceName: 'Swedish Massage', employeeName: 'Maria' },
    expectSkippedFields: ['serviceName', 'employeeName'],
  },
  {
    id: 'public-date-never-reask',
    surface: 'public',
    prompt: 'check availability for massage',
    action: 'check_availability',
    sessionContext: { _clarifyMemory: { date: '2026-06-10' } },
    expectParams: { date: '2026-06-10' },
    expectSkippedFields: ['date'],
  },
  {
    id: 'provider-customer-reuse',
    surface: 'provider',
    prompt: 'mark paid for today',
    action: 'mark_paid',
    sessionContext: { _clarifyMemory: { customerName: 'Jane Doe' } },
    expectParams: { customerName: 'Jane Doe' },
    expectMemory: { customerName: 'Jane Doe' },
  },
  {
    id: 'merge-incoming-answers',
    surface: 'dashboard',
    prompt: 'book massage tomorrow',
    action: 'create_booking',
    sessionContext: { _clarifyMemory: { employeeName: 'Gevorg' } },
    incomingAnswers: { serviceName: 'Deep Tissue Massage' },
    expectMemory: {
      employeeName: 'Gevorg',
      serviceName: 'Deep Tissue Massage',
    },
  },
];
