import { CLINIC_QUESTIONNAIRE_FLOW_FIXTURES } from '../clinic-questionnaires/clinic-questionnaire.fixtures.js';
import {
  buildProviderDashboardBookingIntakePath,
  buildProviderPreVisitIntakeAnswerRows,
  buildProviderPreVisitIntakeSummaryView,
  formatProviderQuestionnaireAnswerText,
  isSalonVerticalBusinessType,
  serviceOffersProviderPreVisitIntake,
  shouldShowProviderPreVisitIntakeSection,
} from './provider-booking-pre-visit-intake.util.js';

describe('provider-booking-pre-visit-intake.util (prov-exp-1.5)', () => {
  it.each([
    {
      id: 'clinic-lab-with-questionnaire',
      businessType: 'polyclinic',
      metadata: { serviceType: 'lab_test' },
      hasPublishedQuestionnaire: true,
      expected: true,
    },
    {
      id: 'clinic-consultation-with-questionnaire',
      businessType: 'clinic',
      metadata: { serviceType: 'consultation' },
      hasPublishedQuestionnaire: true,
      expected: false,
    },
    {
      id: 'salon-with-questionnaire',
      businessType: 'hair_salon',
      metadata: {},
      hasPublishedQuestionnaire: true,
      expected: true,
    },
    {
      id: 'salon-without-questionnaire',
      businessType: 'hair_salon',
      metadata: {},
      hasPublishedQuestionnaire: false,
      expected: false,
    },
  ])(
    'serviceOffersProviderPreVisitIntake — $id',
    ({ businessType, metadata, hasPublishedQuestionnaire, expected }) => {
      expect(
        serviceOffersProviderPreVisitIntake({
          businessType,
          serviceMetadata: metadata,
          hasPublishedQuestionnaire,
        }),
      ).toBe(expected);
    },
  );

  it('shows section when intake exists even if service gate is off', () => {
    expect(
      shouldShowProviderPreVisitIntakeSection({
        serviceOffersIntake: false,
        hasIntakeRecord: true,
      }),
    ).toBe(true);
  });

  it('detects salon vertical business types', () => {
    expect(isSalonVerticalBusinessType('hair_salon')).toBe(true);
    expect(isSalonVerticalBusinessType('polyclinic')).toBe(false);
  });

  it('formats choice answers using option labels', () => {
    const ctx = CLINIC_QUESTIONNAIRE_FLOW_FIXTURES.referralIntake;
    const question = ctx.questions.find((row) => row.id === 'q-referral')!;
    const options = ctx.options.filter((row) => row.questionId === question.id);

    expect(
      formatProviderQuestionnaireAnswerText(question, ['yes'], options),
    ).toBe('Yes');
  });

  it('builds capped answer rows for provider summary', () => {
    const ctx = CLINIC_QUESTIONNAIRE_FLOW_FIXTURES.referralIntake;
    const { rows, totalAnswerCount } = buildProviderPreVisitIntakeAnswerRows(
      ctx,
      {
        'q-referral': ['yes'],
        'q-referrer-name': ['Dr Smith'],
        'q-symptoms': ['Headache for 2 days'],
      },
      2,
    );

    expect(totalAnswerCount).toBe(3);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.questionText).toContain('referred');
  });

  it('builds dashboard booking intake path', () => {
    expect(buildProviderDashboardBookingIntakePath('bk-1')).toBe(
      '/dashboard/bookings?bookingId=bk-1',
    );
  });

  it('builds hidden summary view', () => {
    expect(
      buildProviderPreVisitIntakeSummaryView({
        visible: false,
        bookingId: 'bk-1',
        canOpenDashboard: false,
      }),
    ).toMatchObject({
      visible: false,
      dashboardFullAnswers: null,
    });
  });

  it('builds manager dashboard link when visible', () => {
    const view = buildProviderPreVisitIntakeSummaryView({
      visible: true,
      intakeId: 'intake-1',
      questionnaireTitle: 'Pre-visit intake',
      status: 'completed',
      bookingId: 'bk-1',
      canOpenDashboard: true,
      answers: [{ questionId: 'q-1', questionText: 'Q', answerText: 'A' }],
      totalAnswerCount: 1,
    });

    expect(view.dashboardFullAnswers).toMatchObject({
      path: '/dashboard/bookings?bookingId=bk-1',
      bookingId: 'bk-1',
      intakeId: 'intake-1',
      canOpen: true,
    });
    expect(view.hasMoreAnswers).toBe(false);
  });
});
