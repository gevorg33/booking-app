import {
  CLINIC_LAB_DAY_CLOSE_COMPOUND_PROMPTS,
  CLINIC_LAB_DAY_CLOSE_RESCUE_SCENARIOS,
} from './ai-clinic-lab-day-close-compound.fixtures.js';
import { CLINIC_LAB_DAY_CLOSE_MULTILINGUAL_SCENARIOS } from './ai-clinic-lab-day-close-compound-multilingual.fixtures.js';
import {
  buildClinicLabDayCloseCompoundParams,
  decomposeClinicLabDayCloseCompoundPrompt,
  isClinicLabDayCloseCompoundPrompt,
  CLINIC_LAB_DAY_CLOSE_STEP_ACTIONS,
  rescueClinicLabDayCloseCompoundIntent,
} from './ai-clinic-lab-day-close-compound.util.js';

describe('ai-clinic-lab-day-close-compound.util (ai-cmd-ext-4.2)', () => {
  it.each(CLINIC_LAB_DAY_CLOSE_COMPOUND_PROMPTS)(
    'isClinicLabDayCloseCompoundPrompt $id',
    ({ prompt }) => {
      expect(isClinicLabDayCloseCompoundPrompt(prompt)).toBe(true);
    },
  );

  it.each(CLINIC_LAB_DAY_CLOSE_COMPOUND_PROMPTS)(
    'decomposeClinicLabDayCloseCompoundPrompt $id',
    ({ prompt, orderedActions, expectedParams }) => {
      const steps = decomposeClinicLabDayCloseCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
      expect(steps).toHaveLength(CLINIC_LAB_DAY_CLOSE_STEP_ACTIONS.length);
      if (expectedParams?.orderId) {
        expect(steps[1].params.orderId).toBe(expectedParams.orderId);
        expect(steps[2].params.orderId).toBe(expectedParams.orderId);
      }
      if (expectedParams?.customerName) {
        expect(steps[2].params.customerName).toBe(expectedParams.customerName);
        expect(steps[3].params.customerName).toBe(expectedParams.customerName);
      }
      if (expectedParams?.measurementCode) {
        expect(steps[1].params.measurementCode).toBe(
          expectedParams.measurementCode,
        );
      }
      if (expectedParams?.value) {
        expect(steps[1].params.value).toBe(expectedParams.value);
      }
      if (expectedParams?.date) {
        expect(steps[0].params.date).toBe(expectedParams.date);
      }
      if (expectedParams?.status) {
        expect(steps[0].params.status).toBe(expectedParams.status);
      }
    },
  );

  it.each(CLINIC_LAB_DAY_CLOSE_MULTILINGUAL_SCENARIOS)(
    'decomposeClinicLabDayCloseCompoundPrompt multilingual $id',
    ({ prompt, orderedActions }) => {
      const steps = decomposeClinicLabDayCloseCompoundPrompt(prompt);
      expect(steps.map((step) => step.action)).toEqual([...orderedActions]);
    },
  );

  it.each(CLINIC_LAB_DAY_CLOSE_RESCUE_SCENARIOS)(
    'rescueClinicLabDayCloseCompoundIntent $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueClinicLabDayCloseCompoundIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: 'compound_intent',
        rescueReason: 'clinic_lab_day_close_compound',
      });
    },
  );

  it('does not treat single list_test_orders as lab day close compound', () => {
    expect(
      isClinicLabDayCloseCompoundPrompt("Show Maria's lab orders for tomorrow"),
    ).toBe(false);
    expect(
      decomposeClinicLabDayCloseCompoundPrompt(
        "Show Maria's lab orders for tomorrow",
      ),
    ).toEqual([]);
  });

  it('buildClinicLabDayCloseCompoundParams detects RU today cue', () => {
    const params = buildClinicLabDayCloseCompoundParams(
      'Close lab day на сегодня — show pending lab orders, record hemoglobin 13.1 for order ord-42',
    );
    expect(params.date).toBe('today');
  });

  it('buildClinicLabDayCloseCompoundParams extracts shared entities', () => {
    const params = buildClinicLabDayCloseCompoundParams(
      'Lab day close end-to-end: list pending test orders for today, enter WBC 12.5 for order abc123, release results to Maria, notify her when results are ready',
    );
    expect(params.customerName).toBe('Maria');
    expect(params.orderId).toBe('abc123');
    expect(params.measurementCode).toBe('WBC');
    expect(params.value).toBe('12.5');
    expect(params.date).toBe('today');
  });

  it('rejects prompts without enough lab day close steps', () => {
    expect(
      isClinicLabDayCloseCompoundPrompt(
        'List pending test orders and enter WBC 12.5 for order abc123',
      ),
    ).toBe(false);
  });

  it('rescueClinicLabDayCloseCompoundIntent returns null for non-compound', () => {
    expect(
      rescueClinicLabDayCloseCompoundIntent(
        "Show Maria's lab orders for tomorrow",
        'list_test_orders',
      ),
    ).toBeNull();
    expect(
      rescueClinicLabDayCloseCompoundIntent(
        CLINIC_LAB_DAY_CLOSE_COMPOUND_PROMPTS[0].prompt,
        'compound_intent',
      ),
    ).toBeNull();
  });
});
