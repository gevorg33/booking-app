import { MULTILINGUAL_CLINIC_BOOKING_EVAL_SCENARIOS } from './ai-clinic-booking-multilingual.fixtures.js';
import { clinicBookingMultilingualScenarioToEvalCase } from './ai-clinic-booking-multilingual.util.js';

describe('ai-clinic-booking-multilingual.util', () => {
  it.each(MULTILINGUAL_CLINIC_BOOKING_EVAL_SCENARIOS)(
    'maps $id to eval case',
    (scenario) => {
      const evalCase = clinicBookingMultilingualScenarioToEvalCase(scenario);
      expect(evalCase.id).toBe(`clinic-booking-${scenario.id}`);
      expect(evalCase.expect.rescuedAction).toBe('explain_clinic_booking');
      expect(evalCase.surface).toBe(scenario.surface);
      if (scenario.paramsPartial?.aspect) {
        expect(evalCase.expect.paramsPartial?.aspect).toBe(
          scenario.paramsPartial.aspect,
        );
      }
      if (scenario.paramsPartial?.serviceName) {
        expect(evalCase.expect.paramsPartial?.serviceName).toBe(
          scenario.paramsPartial.serviceName,
        );
      }
    },
  );

  it('maps parsed prompt fields when fixture params are omitted', () => {
    const evalCase = clinicBookingMultilingualScenarioToEvalCase({
      id: 'en-fallback',
      locale: 'en',
      surface: 'public',
      // e2e-bug.523 — was 'Explain the lab prep for Lipid panel', which
      // `isExplainClinicBookingPrompt` rejects *on purpose*:
      // CONSUMER_LAB_PREP_EXPLAIN matches `prep\s+for\s+(the )?lipid|panel` and
      // routes consumer lab-prep questions away from explain_clinic_booking. So
      // the parser returned null and paramsPartial was omitted entirely — the
      // prompt contradicted a deliberate routing rule rather than exposing a
      // mapping bug. This test is about the mapping fallback, so it needs a
      // prompt the command actually owns: the English analogue of the passing
      // Russian fixture 'Как подготовиться к Lipid panel на странице записи?'.
      // 'prepare' does not trip the exclusion because that pattern requires
      // whitespace directly after 'prep'.
      prompt: 'How do I prepare for Lipid panel on the booking page?',
      expectedAction: 'explain_clinic_booking',
    });

    expect(evalCase.expect.paramsPartial).toEqual({
      aspect: 'preparation',
      serviceName: 'Lipid panel',
    });
  });
});
