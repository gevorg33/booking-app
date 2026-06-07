import {
  buildFlowContextFromFixture,
  CLINIC_QUESTIONNAIRE_FLOW_FIXTURES,
} from '../../modules/clinic-questionnaires/clinic-questionnaire.fixtures.js';
import {
  buildFlowContextFromEntities,
  mapQuestionEntity,
  mapQuestionnaireDefinition,
  mapQuestionnaireResponseView,
  mapQuestionnaireSummary,
} from '../../modules/clinic-questionnaires/clinic-questionnaire-map.util.js';

describe('clinic-questionnaire-map.util', () => {
  const fixture = CLINIC_QUESTIONNAIRE_FLOW_FIXTURES.referralIntake;
  const ctx = buildFlowContextFromFixture(fixture);

  it('maps questionnaire summary timestamps', () => {
    const summary = mapQuestionnaireSummary({
      id: 'q-1',
      businessId: 'biz-1',
      code: 'referral-intake',
      internalName: 'Referral intake',
      title: 'Referral intake questionnaire',
      introTitle: 'Before your visit',
      introBody: 'Answer a few questions.',
      revision: 2,
      status: 'published',
      isActive: true,
      publishedAt: new Date('2026-06-19T12:00:00.000Z'),
      createdAt: new Date('2026-06-19T11:00:00.000Z'),
      updatedAt: new Date('2026-06-19T12:30:00.000Z'),
    } as never);

    expect(summary.status).toBe('published');
    expect(summary.publishedAt).toBe('2026-06-19T12:00:00.000Z');
  });

  it('builds flow context from entities', () => {
    const question = mapQuestionEntity(fixture.questions[0] as never);
    const built = buildFlowContextFromEntities({
      questions: [question as never],
      options: fixture.options as never,
      constraints: fixture.constraints as never,
    });

    expect(built.questions).toHaveLength(1);
    expect(built.options).toHaveLength(2);
  });

  it('maps questionnaire definition and response views', () => {
    const questionnaire = {
      id: fixture.questionnaireId,
      businessId: 'biz-1',
      code: 'referral-intake',
      internalName: 'Referral intake',
      title: 'Referral intake questionnaire',
      introTitle: null,
      introBody: null,
      revision: 1,
      status: 'published',
      isActive: true,
      publishedAt: new Date('2026-06-19T12:00:00.000Z'),
      createdAt: new Date('2026-06-19T11:00:00.000Z'),
      updatedAt: new Date('2026-06-19T12:00:00.000Z'),
    } as never;

    const definition = mapQuestionnaireDefinition(questionnaire, ctx);
    expect(definition.questions[0]?.id).toBe('q-referral');

    const responseView = mapQuestionnaireResponseView(
      {
        id: 'resp-1',
        questionnaireId: fixture.questionnaireId,
        businessId: 'biz-1',
        customerId: null,
        bookingId: null,
        status: 'in_progress',
        currentQuestionId: 'q-referral',
        answers: {},
        completedAt: null,
        createdAt: new Date('2026-06-19T12:00:00.000Z'),
        updatedAt: new Date('2026-06-19T12:00:00.000Z'),
      } as never,
      questionnaire,
      ctx,
      'q-referral',
    );

    expect(responseView.nextQuestion?.id).toBe('q-referral');
    expect(responseView.isCompleted).toBe(false);
  });
});
