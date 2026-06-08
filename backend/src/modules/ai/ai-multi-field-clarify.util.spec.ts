import { describe, expect, it } from '@jest/globals';
import {
  attachMultiFieldClarifyMetadata,
  buildClarifyFieldsList,
  buildMultiFieldClarifySummary,
  dedupeValidationIssuesByField,
  isMultiFieldClarify,
  shouldPreferEntityOnlyClarify,
  sortValidationIssuesForClarify,
} from './ai-multi-field-clarify.util.js';
import {
  buildTargetedSlotClarify,
  resolveEntityOrCombinedClarify,
  resolveSmartClarify,
} from './ai-smart-clarify.util.js';

describe('ai-multi-field-clarify.util (n99-1.3)', () => {
  it('sorts and dedupes validation issues for one-form clarify', () => {
    const issues = sortValidationIssuesForClarify(
      dedupeValidationIssuesByField([
        { field: 'date', label: 'Date', message: 'Which date?' },
        { field: 'serviceName', label: 'Service', message: 'Which service?' },
        { field: 'date', label: 'Date', message: 'Duplicate' },
      ]),
    );
    expect(issues.map((row) => row.field)).toEqual(['serviceName', 'date']);
  });

  it('buildMultiFieldClarifySummary lists every missing field', () => {
    const summary = buildMultiFieldClarifySummary([
      { field: 'serviceName', label: 'Service', message: 'Which service?' },
      { field: 'date', label: 'Date', message: 'Which date?' },
    ]);
    expect(summary).toContain('Service');
    expect(summary).toContain('Date');
    expect(summary).toContain('few more details');
  });

  it('isMultiFieldClarify covers entity + slot combinations', () => {
    expect(isMultiFieldClarify([{ field: 'date', label: 'Date', message: 'x' }], [])).toBe(false);
    expect(
      isMultiFieldClarify(
        [
          { field: 'date', label: 'Date', message: 'x' },
          { field: 'timeSlot', label: 'Time', message: 'y' },
        ],
        [],
      ),
    ).toBe(true);
    expect(
      isMultiFieldClarify([{ field: 'date', label: 'Date', message: 'x' }], [
        { id: '1', field: 'employeeName', label: 'Anna Smith', value: 'Anna Smith' },
        { id: '2', field: 'employeeName', label: 'Anna Jones', value: 'Anna Jones' },
      ]),
    ).toBe(true);
  });

  it('shouldPreferEntityOnlyClarify is false when other slots are missing', () => {
    const targeted = buildTargetedSlotClarify({
      prompt: 'book massage with Anna',
      surface: 'dashboard',
      action: 'create_booking',
      params: {},
      employees: [
        { id: '1', name: 'Anna Smith' },
        { id: '2', name: 'Anna Jones' },
      ],
      services: [
        { id: 's1', name: 'Swedish Massage' },
        { id: 's2', name: 'Deep Tissue Massage' },
      ],
    });
    expect(shouldPreferEntityOnlyClarify(targeted)).toBe(false);
    expect(targeted?.details.clarifyMultiField).toBe(true);
    expect(targeted?.details.missing?.length).toBeGreaterThan(0);
    expect(targeted?.details.entityOptions?.length).toBeGreaterThanOrEqual(2);
  });

  it('resolveEntityOrCombinedClarify keeps entity-only when it is the only blocker', () => {
    const clarify = resolveEntityOrCombinedClarify({
      prompt: 'book with Anna',
      surface: 'dashboard',
      action: 'create_booking',
      params: { serviceName: 'Massage', date: '2026-06-08', timeSlot: '10:00' },
      employees: [
        { id: '1', name: 'Anna Smith' },
        { id: '2', name: 'Anna Jones' },
      ],
    });
    expect(clarify?.details.clarifyKind).toBe('entity_disambiguation');
    expect(clarify?.details.entityOptions?.length).toBeGreaterThanOrEqual(2);
  });

  it('resolveSmartClarify early phase returns combined clarify instead of serial entity-only', () => {
    const clarify = resolveSmartClarify({
      prompt: 'book with Anna',
      surface: 'dashboard',
      action: 'create_booking',
      params: {},
      employees: [
        { id: '1', name: 'Anna Smith' },
        { id: '2', name: 'Anna Jones' },
      ],
      phase: 'early',
    });
    expect(clarify?.details.clarifyKind).toBe('targeted_slots');
    expect(clarify?.details.clarifyMultiField).toBe(true);
    expect(buildClarifyFieldsList(clarify?.details.missing ?? [], clarify?.details.entityOptions)).toContain(
      'employeeName',
    );
  });

  it('attachMultiFieldClarifyMetadata exposes clarifyFields', () => {
    const attached = attachMultiFieldClarifyMetadata(
      {
        success: false,
        action: 'create_booking',
        summary: 'Need details',
        details: { needsClarification: true },
      },
      [
        { field: 'date', label: 'Date', message: 'Which date?' },
        { field: 'timeSlot', label: 'Time', message: 'Which time?' },
      ],
    );
    expect(attached.details.clarifyFields).toEqual(['date', 'timeSlot']);
    expect(attached.details.clarifyMultiField).toBe(true);
  });
});
