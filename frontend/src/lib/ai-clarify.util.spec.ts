import { describe, expect, it } from 'vitest';
import {
  activeClarifyEmployees,
  activeClarifyServices,
  buildClarifyRequiredFields,
  buildClarifyTimeSlotOptions,
  clarifyFieldKind,
  composeClarifyFieldAnswer,
  composeClarifyPrompt,
  composeEntityDisambiguationFollowUp,
  composeIntentDisambiguationFollowUp,
  composeMultiFieldClarifyPrompt,
  entityCatalogOptionsForField,
  filterClarifyIssuesForDisplay,
  filterClarifyIssuesForEntityOptions,
  hasPreResolvedEntityCatalog,
  isClarifyFormComplete,
  isClarifySelectField,
  isEntityCatalogField,
  normalizeExecutionTimeline,
  primaryEntityCatalogField,
  resolveClarifyChipOptions,
} from './ai-clarify.util';

const TWO_ANNAS = [
  { id: 'e1', field: 'employeeName', label: 'Anna Smith', value: 'Anna Smith' },
  { id: 'e2', field: 'employeeName', label: 'Anna Jones', value: 'Anna Jones' },
];

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

  it('buildClarifyTimeSlotOptions flattens preview, open slots, and earliest time', () => {
    const options = buildClarifyTimeSlotOptions([
      {
        name: 'Anna',
        previewTimes: ['10:00', '10:00'],
        openSlots: [{ start: '11:00', end: '11:30' }],
        earliestStartTime: '09:00',
      },
      { name: 'Bob', earliestStartTime: '14:00' },
    ]);
    expect(options.map((row) => row.value)).toEqual(['10:00', '11:00', '09:00', '14:00']);
    expect(options[0].label).toBe('10:00 · Anna');
  });

  it('hasPreResolvedEntityCatalog requires at least two candidates (n99-1.2)', () => {
    expect(hasPreResolvedEntityCatalog(undefined)).toBe(false);
    expect(hasPreResolvedEntityCatalog([TWO_ANNAS[0]!])).toBe(false);
    expect(hasPreResolvedEntityCatalog(TWO_ANNAS)).toBe(true);
  });

  it('resolveClarifyChipOptions prefers pre-resolved entity catalog over full staff list', () => {
    const employees = [
      { id: '1', name: 'Anna Smith', isActive: true },
      { id: '2', name: 'Anna Jones', isActive: true },
      { id: '3', name: 'Bob', isActive: true },
    ];
    const fromCatalog = resolveClarifyChipOptions({
      field: 'employeeName',
      entityOptions: TWO_ANNAS,
      employees,
      services: [],
    });
    expect(fromCatalog.map((row) => row.label)).toEqual(['Anna Smith', 'Anna Jones']);

    const fromStaff = resolveClarifyChipOptions({
      field: 'employeeName',
      employees,
      services: [],
    });
    expect(fromStaff).toHaveLength(3);
  });

  it('classifies clarify field kinds', () => {
    expect(clarifyFieldKind('employeeName', 2, 0, 0)).toBe('employeeChips');
    expect(clarifyFieldKind('employeeName', 3, 0, 2)).toBe('entityCatalogChips');
    expect(clarifyFieldKind('employeeName', 0, 0, 0)).toBe('text');
    expect(clarifyFieldKind('serviceName', 1, 0, 0)).toBe('serviceChips');
    expect(clarifyFieldKind('customerName', 2, 0, 0)).toBe('customerChips');
    expect(clarifyFieldKind('date', 0, 0, 0)).toBe('date');
    expect(clarifyFieldKind('timeSlot', 0, 3, 0)).toBe('timeSlotList');
    expect(clarifyFieldKind('timeSlot', 0, 0, 0)).toBe('time');
    expect(isEntityCatalogField('employeeName')).toBe(true);
    expect(isEntityCatalogField('date')).toBe(false);
  });

  it('entityCatalogOptionsForField and primaryEntityCatalogField', () => {
    expect(entityCatalogOptionsForField(TWO_ANNAS, 'employeeName')).toHaveLength(2);
    expect(entityCatalogOptionsForField(TWO_ANNAS, 'serviceName')).toHaveLength(0);
    expect(primaryEntityCatalogField(TWO_ANNAS)).toBe('employeeName');
  });

  it('composes clarify prompt only when all fields are filled (n99-1.1)', () => {
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
    ).toBeNull();
  });

  it('composeClarifyFieldAnswer returns null for empty values', () => {
    expect(composeClarifyFieldAnswer('date', '  ', 'Date')).toBeNull();
    expect(composeClarifyFieldAnswer('timeSlot', '10:00', 'Time')).toBe('Time: 10:00');
  });

  it('isClarifyFormComplete requires every issue field', () => {
    const issues = [
      { field: 'employeeName', label: 'Provider', message: 'required' },
      { field: 'date', label: 'Date', message: 'required' },
    ];
    expect(isClarifyFormComplete(issues, { employeeName: 'Anna' })).toBe(false);
    expect(isClarifyFormComplete(issues, { employeeName: 'Anna', date: '2026-06-02' })).toBe(
      true,
    );
  });

  it('composeMultiFieldClarifyPrompt joins every answered field (n99-1.3)', () => {
    expect(
      composeMultiFieldClarifyPrompt({
        issues: [
          { field: 'serviceName', label: 'Service', message: 'required' },
          { field: 'date', label: 'Date', message: 'required' },
        ],
        values: { serviceName: 'Massage', date: '2026-06-08' },
        originalPrompt: 'book tomorrow',
      }),
    ).toBe('book tomorrow. Service: Massage. Date: 2026-06-08');

    expect(
      composeMultiFieldClarifyPrompt({
        issues: [{ field: 'date', label: 'Date', message: 'required' }],
        values: { employeeName: 'Anna Smith', date: '2026-06-08' },
        entityField: 'employeeName',
        entityOptionCount: 2,
        originalPrompt: 'book with Anna',
      }),
    ).toBe('book with Anna. I meant Anna Smith. Date: 2026-06-08');
  });

  it('buildClarifyRequiredFields includes entity catalog field', () => {
    expect(
      buildClarifyRequiredFields(
        [{ field: 'date', label: 'Date', message: 'required' }],
        'employeeName',
        2,
      ),
    ).toEqual(['employeeName', 'date']);
  });

  it('filterClarifyIssuesForDisplay hides already-known fields (acc-4.1)', () => {
    const issues = [
      { field: 'serviceName', label: 'Service', message: 'required' },
      { field: 'date', label: 'Date', message: 'required' },
    ];
    expect(
      filterClarifyIssuesForDisplay(issues, {
        serviceName: 'Massage',
        employeeName: 'Gevorg',
      }).map((row) => row.field),
    ).toEqual(['date']);
  });

  it('composeIntentDisambiguationFollowUp builds chip follow-up (acc-4.2)', () => {
    expect(
      composeIntentDisambiguationFollowUp({
        selectedAction: 'cancel_bookings',
        label: 'Cancel booking',
        originalPrompt: 'change appointment tomorrow',
      }),
    ).toBe('change appointment tomorrow. I meant cancel booking.');
  });

  it('composeEntityDisambiguationFollowUp builds chip follow-up (acc-4.3)', () => {
    expect(
      composeEntityDisambiguationFollowUp({
        field: 'employeeName',
        label: 'Anna Smith',
        originalPrompt: 'book with Anna',
      }),
    ).toBe('book with Anna. I meant Anna Smith.');
  });

  it('filterClarifyIssuesForEntityOptions hides chip-covered fields (acc-4.3)', () => {
    const issues = [
      { field: 'employeeName', label: 'Provider', message: 'required' },
      { field: 'date', label: 'Date', message: 'required' },
    ];
    expect(
      filterClarifyIssuesForEntityOptions(issues, TWO_ANNAS).map((row) => row.field),
    ).toEqual(['date']);
  });
});
