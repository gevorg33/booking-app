import {
  canReleaseClinicTestResult,
  canReviewClinicTestResult,
  canTransitionClinicSpecimen,
  canTransitionClinicTestOrder,
  canTransitionClinicTestResult,
  CLINIC_TEST_ORDER_STATUSES,
  CLINIC_TEST_RESULT_STATUSES,
  formatClinicTestOrderStatusLabel,
  formatClinicTestResultStatusLabel,
  formatClinicSpecimenStatusLabel,
  formatClinicResultMeasurementFlagLabel,
  formatClinicPatientResultVisibilityLabel,
  clinicLabStatePatientVisibilityKey,
  getClinicLabFeatureGate,
  getClinicPatientResultVisibilityUiMetadata,
  getClinicResultMeasurementFlagUiMetadata,
  getClinicSpecimenStatusUiMetadata,
  getClinicTestOrderStatusUiMetadata,
  getClinicTestResultStatusUiMetadata,
  getClinicResultMeasurementBadgeColor,
  isClinicLabFeaturesEnabled,
  isClinicSpecimenStatus,
  isClinicTestOrderEditable,
  isClinicTestOrderStatus,
  isClinicTestOrderTerminal,
  isClinicTestResultComplete,
  isClinicTestResultEditable,
  isClinicTestResultStatus,
  isClinicTestResultTerminal,
  CLINIC_LAB_FEATURES_DISABLED_REASON,
  buildClinicProviderResultsQueueWindow,
  CLINIC_PROVIDER_RESULTS_LOOKBACK_DAYS,
} from './clinic-lab-state.util.js';
import {
  CLINIC_LAB_ALL_TRANSITION_FIXTURES,
  CLINIC_LAB_BUSINESS_TYPE_GATE_FIXTURES,
} from './clinic-lab-state.fixtures.js';

describe('clinic-lab-state.util', () => {
  describe('business type gate (vert-clinic-2.0.10)', () => {
    it.each(CLINIC_LAB_BUSINESS_TYPE_GATE_FIXTURES)(
      '$id — lab features enabled=$enabled',
      ({ businessType, enabled }) => {
        expect(isClinicLabFeaturesEnabled(businessType)).toBe(enabled);
        const gate = getClinicLabFeatureGate(businessType);
        expect(gate.enabled).toBe(enabled);
        if (!enabled) {
          expect(gate.reason).toBe(CLINIC_LAB_FEATURES_DISABLED_REASON);
        }
      },
    );

    it('returns localized gate reason', () => {
      const gate = getClinicLabFeatureGate('hair_salon', 'hy');
      expect(gate.enabled).toBe(false);
      expect(gate.reason).toContain('Լաբորատոր');
    });
  });

  describe('status type guards', () => {
    it('validates order, result, and specimen status strings', () => {
      expect(isClinicTestOrderStatus('AwaitingResults')).toBe(true);
      expect(isClinicTestOrderStatus('PartiallyBooked')).toBe(false);
      expect(isClinicTestResultStatus('Released')).toBe(true);
      expect(isClinicTestResultStatus('Verbal')).toBe(false);
      expect(isClinicSpecimenStatus('ReceivedInLab')).toBe(true);
      expect(isClinicSpecimenStatus('invalid')).toBe(false);
    });
  });

  describe('transitions', () => {
    it.each(CLINIC_LAB_ALL_TRANSITION_FIXTURES)(
      '$id — allowed=$allowed',
      ({ kind, from, to, allowed, v1ShortPath }) => {
        let result = false;
        if (kind === 'order') {
          result = canTransitionClinicTestOrder(
            from as Parameters<typeof canTransitionClinicTestOrder>[0],
            to as Parameters<typeof canTransitionClinicTestOrder>[1],
          );
        } else if (kind === 'result') {
          result = canTransitionClinicTestResult(
            from as Parameters<typeof canTransitionClinicTestResult>[0],
            to as Parameters<typeof canTransitionClinicTestResult>[1],
          );
        } else {
          result = canTransitionClinicSpecimen(
            from as Parameters<typeof canTransitionClinicSpecimen>[0],
            to as Parameters<typeof canTransitionClinicSpecimen>[1],
            { v1ShortPath },
          );
        }
        expect(result).toBe(allowed);
      },
    );

    it('uses full specimen map when v1ShortPath is omitted or false', () => {
      expect(
        canTransitionClinicSpecimen('Collected', 'ReadyForTransport'),
      ).toBe(true);
      expect(
        canTransitionClinicSpecimen('Collected', 'ReadyForTransport', {
          v1ShortPath: false,
        }),
      ).toBe(true);
      expect(
        canTransitionClinicSpecimen('Collected', 'ReadyForTransport', {
          v1ShortPath: true,
        }),
      ).toBe(false);
    });
  });

  describe('editability and terminal guards', () => {
    it('order editable only in NotCollected', () => {
      expect(isClinicTestOrderEditable('NotCollected')).toBe(true);
      expect(isClinicTestOrderEditable('Collecting')).toBe(false);
      expect(isClinicTestOrderTerminal('Completed')).toBe(true);
      expect(isClinicTestOrderTerminal('Collecting')).toBe(false);
    });

    it('result not editable after review or release', () => {
      expect(isClinicTestResultEditable('Completed')).toBe(true);
      expect(isClinicTestResultEditable('Reviewed')).toBe(false);
      expect(isClinicTestResultEditable('Released')).toBe(false);
      expect(isClinicTestResultComplete('Reviewed')).toBe(true);
      expect(isClinicTestResultComplete('Pending')).toBe(false);
      expect(isClinicTestResultTerminal('Released')).toBe(true);
      expect(isClinicTestResultTerminal('Completed')).toBe(false);
    });

    it('review and release guards', () => {
      expect(canReviewClinicTestResult('Completed')).toBe(true);
      expect(canReviewClinicTestResult('Pending')).toBe(false);
      expect(canReleaseClinicTestResult('Reviewed')).toBe(true);
      expect(canReleaseClinicTestResult('AutomaticallyReviewed')).toBe(true);
      expect(canReleaseClinicTestResult('Completed')).toBe(true);
      expect(canReleaseClinicTestResult('Pending')).toBe(false);
    });
  });

  describe('UI metadata', () => {
    it.each(CLINIC_TEST_ORDER_STATUSES)(
      'formats order status label for %s',
      (status) => {
        expect(formatClinicTestOrderStatusLabel(status)).toMatch(/\S/);
      },
    );

    it.each(CLINIC_TEST_RESULT_STATUSES)(
      'formats result status label for %s',
      (status) => {
        expect(formatClinicTestResultStatusLabel(status)).toMatch(/\S/);
      },
    );

    it('formats specific order and result labels', () => {
      expect(formatClinicTestOrderStatusLabel('AwaitingResults')).toBe(
        'Awaiting results',
      );
      expect(formatClinicTestOrderStatusLabel('Collecting')).toBe('Collecting');
      expect(formatClinicTestResultStatusLabel('NotReceived')).toBe(
        'Not received',
      );
      expect(formatClinicTestResultStatusLabel('WaitingCompletion')).toBe(
        'Waiting completion',
      );
      expect(formatClinicTestResultStatusLabel('AutomaticallyReviewed')).toBe(
        'Automatically reviewed',
      );
    });

    it.each(CLINIC_TEST_ORDER_STATUSES)(
      'formats localized order status for %s (hy)',
      (status) => {
        expect(formatClinicTestOrderStatusLabel(status, 'hy')).toMatch(/\S/);
        expect(formatClinicTestOrderStatusLabel(status, 'hy')).not.toBe(status);
      },
    );

    it('formats specimen and measurement labels in ru', () => {
      expect(formatClinicSpecimenStatusLabel('InTransit', 'ru')).toBe('В пути');
      expect(formatClinicSpecimenStatusLabel('Collected')).toBe('Collected');
      expect(formatClinicResultMeasurementFlagLabel('Normal', 'ru')).toBe(
        'Норма',
      );
      expect(formatClinicResultMeasurementFlagLabel('Abnormal')).toBe(
        'Abnormal',
      );
      expect(formatClinicPatientResultVisibilityLabel('Read', 'hy')).toBe(
        'Կարդացված',
      );
      expect(formatClinicPatientResultVisibilityLabel('New')).toBe('New');
      expect(clinicLabStatePatientVisibilityKey('Pending')).toBe(
        'clinic.labState.patientVisibility.Pending',
      );
    });

    it('returns shared ui metadata with badge tones', () => {
      expect(getClinicTestOrderStatusUiMetadata('Cancelled', 'en')).toEqual({
        label: 'Cancelled',
        badgeTone: 'danger',
      });
      expect(getClinicTestResultStatusUiMetadata('Released', 'en')).toEqual({
        label: 'Released',
        badgeTone: 'success',
      });
      expect(
        getClinicSpecimenStatusUiMetadata('RecollectRequired', 'en'),
      ).toEqual({
        label: 'Recollect required',
        badgeTone: 'warning',
      });
      expect(
        getClinicResultMeasurementFlagUiMetadata('Abnormal', 'en'),
      ).toEqual({
        label: 'Abnormal',
        badgeTone: 'danger',
        measurementColors: { text: '#D7442F', background: '#F6EAE6' },
      });
      expect(getClinicPatientResultVisibilityUiMetadata('New', 'en')).toEqual({
        label: 'New',
        badgeTone: 'info',
      });
      expect(getClinicTestOrderStatusUiMetadata('Collecting')).toEqual({
        label: 'Collecting',
        badgeTone: 'progress',
      });
      expect(getClinicTestResultStatusUiMetadata('Reviewed')).toEqual({
        label: 'Reviewed',
        badgeTone: 'review',
      });
      expect(getClinicSpecimenStatusUiMetadata('InTransit')).toEqual({
        label: 'In transit',
        badgeTone: 'info',
      });
      expect(getClinicResultMeasurementFlagUiMetadata('Inconclusive')).toEqual({
        label: 'Inconclusive',
        badgeTone: 'warning',
      });
      expect(getClinicPatientResultVisibilityUiMetadata('Read')).toEqual({
        label: 'Read',
        badgeTone: 'neutral',
      });
    });

    it('returns badge colors for normal and abnormal flags', () => {
      expect(getClinicResultMeasurementBadgeColor('Normal')).toEqual({
        text: '#02922A',
        background: '#E2F3E4',
      });
      expect(getClinicResultMeasurementBadgeColor('Abnormal')).toEqual({
        text: '#D7442F',
        background: '#F6EAE6',
      });
      expect(getClinicResultMeasurementBadgeColor('High')).toEqual({
        text: '#D7442F',
        background: '#F6EAE6',
      });
      expect(getClinicResultMeasurementBadgeColor('Low')).toEqual({
        text: '#D97706',
        background: '#FEF3C7',
      });
      expect(getClinicResultMeasurementBadgeColor('Inconclusive')).toBeNull();
    });

    it('formats High and Low measurement labels', () => {
      expect(formatClinicResultMeasurementFlagLabel('High', 'en')).toBe('High');
      expect(formatClinicResultMeasurementFlagLabel('Low', 'ru')).toBe(
        'Ниже нормы',
      );
      expect(getClinicResultMeasurementFlagUiMetadata('High', 'en')).toEqual({
        label: 'High',
        badgeTone: 'danger',
        measurementColors: { text: '#D7442F', background: '#F6EAE6' },
      });
      expect(getClinicResultMeasurementFlagUiMetadata('Low', 'en')).toEqual({
        label: 'Low',
        badgeTone: 'warning',
        measurementColors: { text: '#D97706', background: '#FEF3C7' },
      });
    });
  });

  describe('provider results queue window (vert-clinic-2.4.6)', () => {
    it('builds a rolling UTC window ending today', () => {
      const now = new Date('2026-06-07T15:30:00.000Z');
      const window = buildClinicProviderResultsQueueWindow(now);

      expect(window.from).toBe('2026-05-08T00:00:00.000Z');
      expect(window.to).toBe('2026-06-07T23:59:59.999Z');
      expect(CLINIC_PROVIDER_RESULTS_LOOKBACK_DAYS).toBe(30);
    });

    it('defaults to the current time when now is omitted', () => {
      const window = buildClinicProviderResultsQueueWindow();
      expect(window.from).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/);
      expect(window.to).toMatch(/^\d{4}-\d{2}-\d{2}T23:59:59\.999Z$/);
    });
  });
});
