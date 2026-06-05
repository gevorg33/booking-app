import {
  evaluateDeterministicEvalCase,
  runDeterministicEvalSuite,
} from './ai-command-eval.runner.js';
import type { AiCommandEvalCase } from './ai-command-eval.types.js';
import { AiIntentRescueService } from '../ai-intent-rescue.service.js';

describe('ai-command-eval.runner', () => {
  it('reports needsMultilingual mismatch', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'x',
      prompt: 'Show appointments today',
      expect: { needsMultilingual: true },
    });
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toMatch(/needsMultilingual/);
  });

  it('reports routeTier mismatch', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'x',
      prompt: 'Optimize schedule for tomorrow',
      expect: { routeTier: 'read_only' },
    });
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toMatch(/routeTier/);
  });

  it('checks rescheduleFromTimeSlot', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'from-time',
      prompt: 'Move Jujos appointment on June 10 from 16-17 to june 11th nearest free time',
      expect: { rescheduleFromTimeSlot: '16:00' },
    });
    expect(result.passed).toBe(true);
  });

  it('reports rescheduleTimeSlot mismatch when time not in prompt', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'time-miss',
      prompt: 'Move appointment to tomorrow',
      expect: { rescheduleTimeSlot: '09:00' },
    });
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toMatch(/rescheduleTimeSlot/);
  });

  it('reports rescheduleFromTimeSlot mismatch', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'from-miss',
      prompt: 'Move appointment to tomorrow at 9 AM',
      expect: { rescheduleFromTimeSlot: '16:00' },
    });
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toMatch(/rescheduleFromTimeSlot/);
  });

  it('passes when paramsPartial matches parsed params', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'params-ok',
      prompt: "Move Maria's appointment to tomorrow at 9 AM",
      expect: { paramsPartial: { timeSlot: '09:00' } },
    });
    expect(result.passed).toBe(true);
  });

  it('reports when rescue does not apply to prompt', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'no-rescue',
      prompt: 'Show appointments today',
      expect: { rescuedAction: 'clear_schedule' },
    });
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toMatch(/rescuedAction/);
  });

  it('passes when rescuedAction matches rescue', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'rescue-ok',
      prompt: 'Clear Gevorg schedule for tomorrow',
      expect: { rescuedAction: 'clear_schedule' },
    });
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('reports rescuedAction when rescue omits action field', () => {
    jest.spyOn(AiIntentRescueService.prototype, 'rescue').mockReturnValueOnce({
      rescued: true,
    } as ReturnType<AiIntentRescueService['rescue']>);
    const result = evaluateDeterministicEvalCase({
      id: 'rescue-no-action',
      prompt: 'anything',
      expect: { rescuedAction: 'clear_schedule' },
    });
    expect(result.errors[0]).toContain('got none');
    jest.restoreAllMocks();
  });

  it('reports rescuedAction when rescue returns different action', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'rescue-wrong',
      prompt: 'Clear Gevorg schedule for tomorrow',
      expect: { rescuedAction: 'payment_sweep' },
    });
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toMatch(/rescuedAction/);
  });

  it('reports paramsPartial mismatch', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'params',
      prompt: "Move Maria's appointment to tomorrow at 9 AM",
      expect: { paramsPartial: { timeSlot: '10:00' } },
    });
    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.startsWith('params.'))).toBe(true);
  });

  it('errors when action set without rescuedAction or requiresLlm', () => {
    const result = evaluateDeterministicEvalCase({
      id: 'action',
      prompt: 'Book haircut',
      expect: { action: 'create_booking' },
    });
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toMatch(/requiresLlm/);
  });

  it('runDeterministicEvalSuite skips requiresLlm and counts failures', () => {
    const cases: AiCommandEvalCase[] = [
      { id: 'ok', prompt: 'Show appointments today', expect: { routeTier: 'read_only' } },
      { id: 'bad', prompt: 'Show appointments today', expect: { routeTier: 'compound' } },
      { id: 'llm', prompt: 'x', requiresLlm: true, expect: { action: 'x' } },
    ];
    const summary = runDeterministicEvalSuite(cases);
    expect(summary.results).toHaveLength(2);
    expect(summary.failed).toBe(1);
    expect(summary.passed).toBe(1);
  });
});
