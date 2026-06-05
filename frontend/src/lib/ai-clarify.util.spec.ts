import { describe, expect, it } from 'vitest';
import {
  activeClarifyEmployees,
  activeClarifyServices,
  clarifyFieldKind,
  composeClarifyPrompt,
  isClarifySelectField,
  normalizeExecutionTimeline,
} from './ai-clarify.util';

describe('ai-clarify.util', () => {
  it('marks employee and service fields as select fields', () => {
    expect(isClarifySelectField('employeeName')).toBe(true);
    expect(isClarifySelectField('serviceName')).toBe(true);
    expect(isClarifySelectField('date')).toBe(false);
  });

  it('normalizes workflow steps with id and status', () => {
    const steps = normalizeExecutionTimeline([
      { id: 's1', description: 'Detect conflicts', status: 'completed' },
      { stepId: 's2', label: 'Apply fix', status: 'failed', error: 'busy', canRetry: true },
    ]);
    expect(steps).toHaveLength(2);
    expect(steps[0]).toMatchObject({ stepId: 's1', status: 'completed' });
    expect(steps[1]).toMatchObject({
      stepId: 's2',
      description: 'Apply fix',
      status: 'failed',
      error: 'busy',
      canRetry: true,
    });
  });

  it('returns empty array for non-array input', () => {
    expect(normalizeExecutionTimeline(null)).toEqual([]);
    expect(normalizeExecutionTimeline({})).toEqual([]);
  });

  it('defaults canRetry on failed steps', () => {
    const steps = normalizeExecutionTimeline([{ id: 'x', status: 'failed' }]);
    expect(steps[0].canRetry).toBe(true);
  });

  it('uses stepId, name fallback, and synthetic id', () => {
    const steps = normalizeExecutionTimeline([
      { stepId: 'only-step-id', name: 'Named step' },
      { status: 'running' },
    ]);
    expect(steps[0].stepId).toBe('only-step-id');
    expect(steps[0].description).toBe('Named step');
    expect(steps[1].stepId).toBe('step-1');
    expect(steps[1].status).toBe('running');
    expect(steps[1].canRetry).toBe(false);
  });

  it('filters active employees and available provider names', () => {
    const all = activeClarifyEmployees(
      [
        { id: '1', name: 'Anna', isActive: true },
        { id: '2', name: 'Bob', isActive: true },
        { id: '3', name: '', isActive: true },
        { id: '4', name: 'Off', isActive: false },
      ],
      ['bob'],
    );
    expect(all.map((e) => e.name)).toEqual(['Bob']);

    const fallback = activeClarifyEmployees(
      [{ id: '1', name: 'Anna', isActive: true }],
      ['unknown'],
    );
    expect(fallback.map((e) => e.name)).toEqual(['Anna']);
  });

  it('filters active services', () => {
    expect(
      activeClarifyServices([
        { id: 's1', name: 'Cut', isActive: true },
        { id: 's2', name: '', isActive: true },
        { id: 's3', name: 'Old', isActive: false },
      ]).map((s) => s.name),
    ).toEqual(['Cut']);
  });

  it('classifies clarify field kinds', () => {
    expect(clarifyFieldKind('employeeName', 2, 0)).toBe('employeeSelect');
    expect(clarifyFieldKind('employeeName', 0, 0)).toBe('text');
    expect(clarifyFieldKind('serviceName', 0, 1)).toBe('serviceSelect');
    expect(clarifyFieldKind('date', 0, 0)).toBe('date');
    expect(clarifyFieldKind('timeSlot', 0, 0)).toBe('time');
    expect(clarifyFieldKind('customerName', 0, 0)).toBe('text');
  });

  it('composes clarify prompt from values or example fallback', () => {
    expect(
      composeClarifyPrompt(
        [
          { field: 'employeeName', label: 'Provider', message: 'required' },
          { field: 'date', label: 'Date', message: 'required' },
        ],
        { employeeName: 'Anna', date: '2026-06-02' },
      ),
    ).toBe('Provider: Anna. Date: 2026-06-02');

    expect(
      composeClarifyPrompt(
        [{ field: 'date', label: 'Date', message: 'required', example: 'tomorrow' }],
        {},
      ),
    ).toBe('tomorrow');

    expect(
      composeClarifyPrompt([{ field: 'date', label: 'Date', message: 'required' }], {}),
    ).toBeNull();
  });
});
