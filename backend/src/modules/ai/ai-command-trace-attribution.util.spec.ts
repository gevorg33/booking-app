import {
  attributeActionChange,
  deriveFailureReason,
  extractClassifiedAction,
} from './ai-command-trace-attribution.util.js';
import type { PipelineTrace } from './command-completion.types.js';

const at = '2026-08-03T00:00:00.000Z';
const t = (stage: string, action: string): PipelineTrace =>
  ({ stage, action, at }) as PipelineTrace;

/** Shape observed in production `pipeline_trace` rows. */
const cleanRun: PipelineTrace[] = [
  t('normalize', 'passthrough'),
  t('fast_heuristics', 'none'),
  t('classify', 'update_bookings'),
  t('confidence_gate', 'skip_semantic'),
  t('semantic_match', 'skipped'),
  t('rerank', 'update_bookings'),
  t('narrow_reclassify', 'skipped'),
  t('rescue', 'none'),
  t('self_verify', 'skipped'),
];

describe('ai-command-trace-attribution', () => {
  describe('extractClassifiedAction', () => {
    it('returns the classify stage action', () => {
      expect(extractClassifiedAction(cleanRun)).toBe('update_bookings');
    });

    it('returns null when there is no trace or no classify stage', () => {
      expect(extractClassifiedAction(null)).toBeNull();
      expect(extractClassifiedAction([])).toBeNull();
      expect(
        extractClassifiedAction([t('normalize', 'passthrough')]),
      ).toBeNull();
    });

    it('treats status markers as "no action"', () => {
      expect(extractClassifiedAction([t('classify', 'skipped')])).toBeNull();
    });
  });

  describe('attributeActionChange', () => {
    it('reports no change when the classified action survives', () => {
      expect(attributeActionChange(cleanRun, 'update_bookings')).toEqual({
        classifiedAction: 'update_bookings',
        changed: false,
        changedBy: null,
      });
    });

    it('attributes a steal to the rescue stage', () => {
      // The real production pattern: classify is right, rescue overwrites it.
      const stolen = [
        t('classify', 'update_bookings'),
        t('confidence_gate', 'skip_semantic'),
        t('semantic_match', 'skipped'),
        t('rerank', 'update_bookings'),
        t('rescue', 'mark_paid'),
      ];
      expect(attributeActionChange(stolen, 'mark_paid')).toEqual({
        classifiedAction: 'update_bookings',
        changed: true,
        changedBy: 'rescue',
      });
    });

    it('attributes a change to narrow_reclassify when that is the last mover', () => {
      const reclassified = [
        t('classify', 'list_services'),
        t('rerank', 'list_services'),
        t('narrow_reclassify', 'explain_clinic_services'),
        t('rescue', 'none'),
      ];
      expect(
        attributeActionChange(reclassified, 'explain_clinic_services'),
      ).toEqual({
        classifiedAction: 'list_services',
        changed: true,
        changedBy: 'narrow_reclassify',
      });
    });

    it('credits the stage that introduced the final action, not a later echo', () => {
      const multi = [t('classify', 'a'), t('rerank', 'b'), t('rescue', 'c')];
      expect(attributeActionChange(multi, 'c').changedBy).toBe('rescue');
    });

    it('blames the real stealer, not the stage that merely echoes it', () => {
      // Verbatim shape from a production trace: rescue takes the action away
      // and self_verify then repeats it. Blaming self_verify would hide the
      // stealer — 221 of 307 historical steals mis-attributed this way.
      const echoed = [
        t('classify', 'assign_employee_services'),
        t('rerank', 'assign_employee_services'),
        t('narrow_reclassify', 'skipped'),
        t('rescue', 'add_services_to_cart'),
        t('self_verify', 'add_services_to_cart'),
      ];
      expect(attributeActionChange(echoed, 'add_services_to_cart')).toEqual({
        classifiedAction: 'assign_employee_services',
        changed: true,
        changedBy: 'rescue',
      });
    });

    it('ignores non-deciding stages even if they carry an action-like value', () => {
      const noisy = [
        t('classify', 'create_booking'),
        t('structural_enrich', 'something_else'),
        t('resolve', 'another_thing'),
        t('validate', 'yet_another'),
      ];
      // Nothing that can decide an action changed it → post_pipeline.
      expect(attributeActionChange(noisy, 'reschedule_booking').changedBy).toBe(
        'post_pipeline',
      );
    });

    it('falls back to post_pipeline when the change happened after the traced stages', () => {
      expect(attributeActionChange(cleanRun, 'reschedule_booking')).toEqual({
        classifiedAction: 'update_bookings',
        changed: true,
        changedBy: 'post_pipeline',
      });
    });

    it('reports no change when classify never ran (cannot attribute)', () => {
      expect(
        attributeActionChange([t('normalize', 'passthrough')], 'x'),
      ).toEqual({
        classifiedAction: null,
        changed: false,
        changedBy: null,
      });
    });
  });

  describe('deriveFailureReason', () => {
    const fail = (details: Record<string, unknown>) => ({
      success: false,
      action: 'x',
      details,
    });

    it('returns null for successes', () => {
      expect(
        deriveFailureReason({ success: true, action: 'x', details: {} }),
      ).toBeNull();
    });

    it.each([
      ['missing_params', { missing: ['categoryName'] }],
      ['missing_params', { clarify: true }],
      ['missing_params', { needsClarification: true }],
      ['compound_step_failed', { failedStep: 'bulk_create_catalog' }],
      ['entity_unresolved', { resolutionFailed: true }],
      ['not_permitted', { permissionDenied: true }],
      ['validation', { validationErrors: ['bad'] }],
      ['upstream_error', { error: 'boom' }],
      ['unclassified', {}],
    ] as const)('buckets %s', (expected, details) => {
      expect(deriveFailureReason(fail(details))).toBe(expected);
    });

    it('prefers the more specific bucket when signals overlap', () => {
      // A compound that stopped at a step also carries clarify-ish details;
      // the step attribution is the more actionable signal.
      expect(
        deriveFailureReason(
          fail({ missing: [], failedStep: 'create_booking' }),
        ),
      ).toBe('compound_step_failed');
    });
  });
});
