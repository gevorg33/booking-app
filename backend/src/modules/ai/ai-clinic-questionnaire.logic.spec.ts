import { describe, expect, it, jest } from '@jest/globals';
import {
  handleCreateQuestionnaireLogic,
  handlePublishQuestionnaireLogic,
  handleUpdateQuestionnaireLogic,
  type ClinicQuestionnaireLogicDeps,
} from './ai-clinic-questionnaire.logic.js';

const existing = {
  id: 'q1',
  code: 'NEW_PATIENT',
  internalName: 'New Patient Intake',
  title: 'New Patient Intake',
  status: 'draft',
};

function buildDeps(
  overrides: Record<string, any> = {},
): ClinicQuestionnaireLogicDeps {
  return {
    questionnairesService: {
      listQuestionnaires: jest.fn(async () => [existing]),
      createQuestionnaire: jest.fn(async (_biz: string, _user: string, dto: any) => ({
        id: 'q2',
        ...dto,
        status: 'draft',
      })),
      updateQuestionnaire: jest.fn(
        async (_biz: string, _user: string, id: string, dto: any) => ({
          ...existing,
          id,
          ...dto,
        }),
      ),
      publishQuestionnaire: jest.fn(async (_biz: string, _user: string, id: string) => ({
        ...existing,
        id,
        status: 'published',
      })),
      ...overrides.questionnairesService,
    },
  } as any;
}

describe('ai-clinic-questionnaire.logic (ai-cmd-dashboard-6.8.1)', () => {
  describe('handleCreateQuestionnaireLogic', () => {
    it('clarifies when required fields are missing', async () => {
      const deps = buildDeps();
      const result = await handleCreateQuestionnaireLogic(deps, 'biz-1', 'user-1', {
        code: 'X',
      });
      expect(result.success).toBe(false);
      expect(result.details.clarify).toBe(true);
    });

    it('creates the questionnaire', async () => {
      const deps = buildDeps();
      const result = await handleCreateQuestionnaireLogic(deps, 'biz-1', 'user-1', {
        code: 'INTAKE1',
        internalName: 'Intake Form',
        title: 'Intake Form',
      });
      expect(result.success).toBe(true);
      expect(deps.questionnairesService.createQuestionnaire).toHaveBeenCalledWith(
        'biz-1',
        'user-1',
        { code: 'INTAKE1', internalName: 'Intake Form', title: 'Intake Form' },
      );
    });

    it('handles errors gracefully', async () => {
      const deps = buildDeps({
        questionnairesService: {
          createQuestionnaire: jest.fn(async () => {
            throw new Error('Questionnaire code already exists');
          }),
        },
      });
      const result = await handleCreateQuestionnaireLogic(deps, 'biz-1', 'user-1', {
        code: 'NEW_PATIENT',
        internalName: 'Dup',
        title: 'Dup',
      });
      expect(result.success).toBe(false);
      expect(result.summary).toContain('already exists');
    });
  });

  describe('handleUpdateQuestionnaireLogic', () => {
    it('clarifies when the questionnaire cannot be resolved', async () => {
      const deps = buildDeps();
      const result = await handleUpdateQuestionnaireLogic(deps, 'biz-1', 'user-1', {
        title: 'New Title',
      });
      expect(result.success).toBe(false);
      expect(result.details.clarify).toBe(true);
    });

    it('clarifies when no field is given', async () => {
      const deps = buildDeps();
      const result = await handleUpdateQuestionnaireLogic(deps, 'biz-1', 'user-1', {
        questionnaireCode: 'NEW_PATIENT',
      });
      expect(result.success).toBe(false);
      expect(deps.questionnairesService.updateQuestionnaire).not.toHaveBeenCalled();
    });

    it('updates the questionnaire resolved by code', async () => {
      const deps = buildDeps();
      const result = await handleUpdateQuestionnaireLogic(deps, 'biz-1', 'user-1', {
        questionnaireCode: 'NEW_PATIENT',
        title: 'Updated Title',
      });
      expect(result.success).toBe(true);
      expect(deps.questionnairesService.updateQuestionnaire).toHaveBeenCalledWith(
        'biz-1',
        'user-1',
        'q1',
        { title: 'Updated Title' },
      );
    });

    it('resolves by questionnaireName against title', async () => {
      const deps = buildDeps();
      const result = await handleUpdateQuestionnaireLogic(deps, 'biz-1', 'user-1', {
        questionnaireName: 'New Patient Intake',
        isActive: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('handlePublishQuestionnaireLogic', () => {
    it('clarifies when the questionnaire cannot be resolved', async () => {
      const deps = buildDeps();
      const result = await handlePublishQuestionnaireLogic(deps, 'biz-1', 'user-1', {});
      expect(result.success).toBe(false);
      expect(result.details.clarify).toBe(true);
    });

    it('publishes the resolved questionnaire', async () => {
      const deps = buildDeps();
      const result = await handlePublishQuestionnaireLogic(deps, 'biz-1', 'user-1', {
        questionnaireId: 'q1',
      });
      expect(result.success).toBe(true);
      expect(deps.questionnairesService.publishQuestionnaire).toHaveBeenCalledWith(
        'biz-1',
        'user-1',
        'q1',
      );
    });

    it('handles errors gracefully', async () => {
      const deps = buildDeps({
        questionnairesService: {
          publishQuestionnaire: jest.fn(async () => {
            throw new Error('Add at least one question before publishing');
          }),
        },
      });
      const result = await handlePublishQuestionnaireLogic(deps, 'biz-1', 'user-1', {
        questionnaireId: 'q1',
      });
      expect(result.success).toBe(false);
      expect(result.summary).toContain('at least one question');
    });
  });
});
