import {
  CLINIC_PUBLIC_PRE_VISIT_INTAKE_LINK_SCENARIOS,
  CLINIC_PUBLIC_PRE_VISIT_INTAKE_OFFER_SCENARIOS,
} from './clinic-public-pre-visit-intake.fixtures.js';
import {
  canLinkPreVisitIntakeToBooking,
  clinicLabTestOffersPreVisitIntake,
  isClinicLabTestService,
  assertClinicLabTestService,
} from './clinic-public-pre-visit-intake.util.js';

describe('clinic-public-pre-visit-intake.util', () => {
  it.each(CLINIC_PUBLIC_PRE_VISIT_INTAKE_OFFER_SCENARIOS)(
    '$id gates optional lab test intake',
    (scenario) => {
      expect(isClinicLabTestService(scenario.metadata)).toBe(
        scenario.expectedLabTest,
      );
      expect(
        clinicLabTestOffersPreVisitIntake(
          scenario.metadata,
          scenario.hasPublishedQuestionnaire,
        ),
      ).toBe(scenario.expectedOffer);
    },
  );

  it.each(CLINIC_PUBLIC_PRE_VISIT_INTAKE_LINK_SCENARIOS)(
    '$id validates booking link eligibility',
    (scenario) => {
      expect(canLinkPreVisitIntakeToBooking(scenario.input)).toBe(
        scenario.expected,
      );
    },
  );

  it('throws for non-lab services', () => {
    expect(() =>
      assertClinicLabTestService({ serviceType: 'consultation' }),
    ).toThrow('Service is not a lab test');
  });
});
