import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { ClinicQuestionnaireEngineService } from './clinic-questionnaire-engine.service.js';
import { ClinicQuestionnairesService } from './clinic-questionnaires.service.js';
import {
  CLINIC_QUESTIONNAIRE_CREATE_PAYLOAD,
  CLINIC_QUESTIONNAIRE_DEFINITION_PAYLOAD,
} from './clinic-questionnaire.fixtures.js';

describe('Clinic questionnaires (integration)', () => {
  const questionnaireId = 'quest-1';
  const businessId = 'biz-1';
  const questionIds = {
    referral: 'q-referral',
    referrerName: 'q-referrer-name',
    symptoms: 'q-symptoms',
  };
  const optionIds = { yes: 'opt-yes', no: 'opt-no' };

  let questionnaireRecord = {
    id: questionnaireId,
    businessId,
    code: CLINIC_QUESTIONNAIRE_CREATE_PAYLOAD.code,
    internalName: CLINIC_QUESTIONNAIRE_CREATE_PAYLOAD.internalName,
    title: CLINIC_QUESTIONNAIRE_CREATE_PAYLOAD.title,
    introTitle: CLINIC_QUESTIONNAIRE_CREATE_PAYLOAD.introTitle,
    introBody: CLINIC_QUESTIONNAIRE_CREATE_PAYLOAD.introBody,
    revision: 1,
    status: 'draft',
    isActive: true,
    publishedAt: null as Date | null,
    createdAt: new Date('2026-06-19T12:00:00.000Z'),
    updatedAt: new Date('2026-06-19T12:00:00.000Z'),
  };

  const questions = [
    {
      id: questionIds.referral,
      questionnaireId,
      parentQuestionId: null,
      sequence: 1,
      type: 'choice',
      text: 'Were you referred by an external doctor?',
      subText: null,
      placeholder: null,
      required: true,
      repeatEnabled: false,
      maxLength: null,
      maxCount: null,
      regexPattern: null,
      validationErrorMessage: 'Please choose yes or no.',
      validationMaxDate: 'none',
    },
    {
      id: questionIds.referrerName,
      questionnaireId,
      parentQuestionId: null,
      sequence: 2,
      type: 'string',
      text: 'Referring doctor name',
      subText: null,
      placeholder: 'Dr Smith',
      required: true,
      repeatEnabled: false,
      maxLength: 120,
      maxCount: null,
      regexPattern: null,
      validationErrorMessage: 'Enter the referring doctor name.',
      validationMaxDate: 'none',
    },
    {
      id: questionIds.symptoms,
      questionnaireId,
      parentQuestionId: null,
      sequence: 3,
      type: 'text',
      text: 'Describe your symptoms',
      subText: null,
      placeholder: null,
      required: true,
      repeatEnabled: false,
      maxLength: 500,
      maxCount: null,
      regexPattern: null,
      validationErrorMessage: 'Symptoms are required.',
      validationMaxDate: 'none',
    },
  ];

  const options = [
    {
      id: optionIds.yes,
      questionId: questionIds.referral,
      display: 'Yes',
      value: 'yes',
      sequence: 1,
    },
    {
      id: optionIds.no,
      questionId: questionIds.referral,
      display: 'No',
      value: 'no',
      sequence: 2,
    },
  ];

  const constraints = [
    {
      id: 'c-1',
      questionnaireId,
      questionId: questionIds.referrerName,
      constraintQuestionId: questionIds.referral,
      answerOptionId: optionIds.yes,
      staticAnswer: null,
    },
  ];

  let responseRecord = {
    id: 'resp-1',
    businessId,
    questionnaireId,
    customerId: null,
    bookingId: null,
    status: 'in_progress',
    currentQuestionId: questionIds.referral,
    answers: {},
    completedAt: null as Date | null,
    createdAt: new Date('2026-06-19T12:00:00.000Z'),
    updatedAt: new Date('2026-06-19T12:00:00.000Z'),
  };

  const questionnaireRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => {
      questionnaireRecord = { ...questionnaireRecord, ...value };
      return questionnaireRecord;
    }),
    find: jest.fn(async () => [questionnaireRecord]),
    findOne: jest.fn(async (query: { where: Record<string, unknown> }) => {
      const where = query.where;
      if (where.id && where.id !== questionnaireId) return null;
      if (where.businessId && where.businessId !== businessId) return null;
      if (where.code && where.code !== questionnaireRecord.code) return null;
      if (
        where.status === 'published' &&
        questionnaireRecord.status !== 'published'
      ) {
        return null;
      }
      if (where.isActive === true && !questionnaireRecord.isActive) return null;
      return questionnaireRecord;
    }),
  };

  const questionRepo = {
    create: jest.fn((value) => ({
      ...value,
      id: `generated-${value.sequence}`,
    })),
    save: jest.fn(async (value) => value),
    delete: jest.fn(async () => {
      savedOptions = [];
    }),
    count: jest.fn(async () => questions.length),
    find: jest.fn(async () => questions),
  };

  const optionRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => {
      const saved = {
        ...value,
        id: value.value === 'yes' ? 'saved-opt-yes' : 'saved-opt-no',
      };
      savedOptions.push(saved);
      return saved;
    }),
    createQueryBuilder: jest.fn(() => ({
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () =>
        savedOptions.length ? savedOptions : options,
      ),
    })),
  };

  let savedOptions: Array<(typeof options)[number]> = [];

  const constraintRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
    find: jest.fn(async () => constraints),
  };

  const responseRepo = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => {
      responseRecord = { ...responseRecord, ...value };
      return responseRecord;
    }),
    findOne: jest.fn(async (query: { where: Record<string, unknown> }) => {
      if (query.where.id !== responseRecord.id) return null;
      if (query.where.businessId !== businessId) return null;
      return responseRecord;
    }),
  };

  const employeeRepo = {
    findOne: jest.fn(async () => ({ id: 'emp-1' })),
  };

  const businessService = {
    ensureMember: jest.fn(async () => ({ role: MemberRole.MANAGER })),
    findOne: jest.fn(async () => ({
      id: businessId,
      settings: { businessType: 'polyclinic' },
    })),
  };

  const questionnairesService = new ClinicQuestionnairesService(
    questionnaireRepo as never,
    questionRepo as never,
    optionRepo as never,
    constraintRepo as never,
    employeeRepo as never,
    businessService as never,
  );

  const engineService = new ClinicQuestionnaireEngineService(
    responseRepo as never,
    questionnairesService,
    businessService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    savedOptions = [];
    questionnaireRecord.status = 'draft';
    questionnaireRecord.publishedAt = null;
    responseRecord = {
      ...responseRecord,
      status: 'in_progress',
      currentQuestionId: questionIds.referral,
      answers: {},
      completedAt: null,
    };
    businessService.ensureMember.mockResolvedValue({
      role: MemberRole.MANAGER,
    });
  });

  it('creates a draft questionnaire for lab ops staff', async () => {
    questionnaireRepo.findOne.mockResolvedValueOnce(null);

    const created = await questionnairesService.createQuestionnaire(
      businessId,
      'user-1',
      CLINIC_QUESTIONNAIRE_CREATE_PAYLOAD,
    );

    expect(created.code).toBe('referral-intake');
    expect(questionnaireRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId,
        status: 'draft',
      }),
    );
  });

  it('rejects questionnaire management for non-lab-ops staff', async () => {
    businessService.ensureMember.mockResolvedValue({ role: MemberRole.STAFF });

    await expect(
      questionnairesService.createQuestionnaire(
        businessId,
        'user-1',
        CLINIC_QUESTIONNAIRE_CREATE_PAYLOAD,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('publishes a questionnaire with questions', async () => {
    const published = await questionnairesService.publishQuestionnaire(
      businessId,
      'user-1',
      questionnaireId,
    );

    expect(published.status).toBe('published');
    expect(questionnaireRecord.status).toBe('published');
  });

  it('starts a response on the first question', async () => {
    questionnaireRecord.status = 'published';
    questionnaireRecord.publishedAt = new Date();

    const started = await engineService.startResponse(
      businessId,
      'user-1',
      questionnaireId,
      {},
    );

    expect(started.nextQuestion?.id).toBe(questionIds.referral);
    expect(started.status).toBe('in_progress');
  });

  it('skips referrer name when referral answer is no', async () => {
    questionnaireRecord.status = 'published';
    questionnaireRecord.publishedAt = new Date();

    const afterReferral = await engineService.submitAnswers(
      businessId,
      'user-1',
      responseRecord.id,
      {
        questionId: questionIds.referral,
        values: ['no'],
      },
    );

    expect(afterReferral.nextQuestion?.id).toBe(questionIds.symptoms);
  });

  it('shows referrer name when referral answer is yes', async () => {
    questionnaireRecord.status = 'published';
    questionnaireRecord.publishedAt = new Date();

    const afterReferral = await engineService.submitAnswers(
      businessId,
      'user-1',
      responseRecord.id,
      {
        questionId: questionIds.referral,
        values: ['yes'],
      },
    );

    expect(afterReferral.nextQuestion?.id).toBe(questionIds.referrerName);
  });

  it('completes the response after final answer', async () => {
    questionnaireRecord.status = 'published';
    questionnaireRecord.publishedAt = new Date();
    responseRecord.currentQuestionId = questionIds.symptoms;
    responseRecord.answers = { [questionIds.referral]: ['no'] };

    const completed = await engineService.submitAnswers(
      businessId,
      'user-1',
      responseRecord.id,
      {
        questionId: questionIds.symptoms,
        values: ['Headache for two days'],
      },
    );

    expect(completed.isCompleted).toBe(true);
    expect(completed.nextQuestion).toBeNull();
  });

  it('rejects invalid answers', async () => {
    questionnaireRecord.status = 'published';
    questionnaireRecord.publishedAt = new Date();

    await expect(
      engineService.submitAnswers(businessId, 'user-1', responseRecord.id, {
        questionId: questionIds.referral,
        values: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists questionnaires for clinic staff', async () => {
    const list = await questionnairesService.listQuestionnaires(
      businessId,
      'user-1',
    );
    expect(list).toHaveLength(1);
    expect(list[0]?.code).toBe('referral-intake');
  });

  it('loads questionnaire definition', async () => {
    const definition = await questionnairesService.getQuestionnaireDefinition(
      businessId,
      'user-1',
      questionnaireId,
    );
    expect(definition.questions).toHaveLength(3);
  });

  it('updates questionnaire metadata and reverts published to draft', async () => {
    questionnaireRecord.status = 'published';
    questionnaireRecord.publishedAt = new Date();

    const updated = await questionnairesService.updateQuestionnaire(
      businessId,
      'user-1',
      questionnaireId,
      { title: 'Updated title' },
    );

    expect(updated.title).toBe('Updated title');
    expect(questionnaireRecord.status).toBe('draft');
  });

  it('rejects duplicate questionnaire codes', async () => {
    questionnaireRepo.findOne.mockResolvedValueOnce(questionnaireRecord);

    await expect(
      questionnairesService.createQuestionnaire(
        businessId,
        'user-1',
        CLINIC_QUESTIONNAIRE_CREATE_PAYLOAD,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('loads an in-progress response flow', async () => {
    questionnaireRecord.status = 'published';
    questionnaireRecord.publishedAt = new Date();

    const flow = await engineService.getResponseFlow(
      businessId,
      'user-1',
      responseRecord.id,
    );

    expect(flow.nextQuestion?.id).toBe(questionIds.referral);
  });

  it('rejects answers on completed responses', async () => {
    responseRecord.status = 'completed';

    await expect(
      engineService.submitAnswers(businessId, 'user-1', responseRecord.id, {
        questionId: questionIds.referral,
        values: ['yes'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts definition payload shape for replace', async () => {
    await expect(
      questionnairesService.replaceQuestionnaireDefinition(
        businessId,
        'user-1',
        questionnaireId,
        CLINIC_QUESTIONNAIRE_DEFINITION_PAYLOAD,
      ),
    ).resolves.toMatchObject({
      questions: expect.any(Array),
    });
  });
});
