'use client';

import { useMemo, useState } from 'react';
import { ClipboardList, Loader2, Plus, Send } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import {
  clinicQuestionnaireFormToPayload,
  defaultClinicQuestionnaireForm,
  REFERRAL_INTAKE_DEFINITION,
  unwrapClinicQuestionnaireList,
  unwrapClinicQuestionnaireRecord,
  type ClinicQuestionnaireDefinition,
  type ClinicQuestionnaireFormState,
  type ClinicQuestionnaireSummary,
} from '@/lib/clinic-questionnaires';

export interface ClinicQuestionnairesTabProps {
  businessId: string;
}

export function ClinicQuestionnairesTab({ businessId }: ClinicQuestionnairesTabProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<ClinicQuestionnaireFormState>(defaultClinicQuestionnaireForm());
  const [formError, setFormError] = useState<string | null>(null);

  const { data: questionnaires = [], isLoading } = useQuery({
    queryKey: ['clinic-questionnaires', businessId],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${businessId}/clinic-questionnaires`);
      return unwrapClinicQuestionnaireList(res);
    },
    enabled: !!businessId,
  });

  const { data: definition, isLoading: definitionLoading } = useQuery({
    queryKey: ['clinic-questionnaire-definition', businessId, selectedId],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${businessId}/clinic-questionnaires/${selectedId}`,
      );
      return unwrapClinicQuestionnaireRecord<ClinicQuestionnaireDefinition>(res);
    },
    enabled: !!businessId && !!selectedId,
  });

  const selected = useMemo(
    () => questionnaires.find((entry) => entry.id === selectedId) ?? null,
    [questionnaires, selectedId],
  );

  const resetForm = () => {
    setForm(defaultClinicQuestionnaireForm());
    setShowForm(false);
    setFormError(null);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = clinicQuestionnaireFormToPayload(form);
      if (!payload.code || !payload.internalName || !payload.title) {
        throw new Error(t('clinicQuestionnaires.formRequired'));
      }
      const { data: res } = await api.post(
        `/businesses/${businessId}/clinic-questionnaires`,
        payload,
      );
      return unwrapClinicQuestionnaireRecord<ClinicQuestionnaireSummary>(res);
    },
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['clinic-questionnaires', businessId] });
      setSelectedId(created.id);
      resetForm();
    },
    onError: (error: Error) => {
      setFormError(error.message || t('clinicQuestionnaires.saveFailed'));
    },
  });

  const loadSampleMutation = useMutation({
    mutationFn: async (questionnaireId: string) => {
      const { data: res } = await api.put(
        `/businesses/${businessId}/clinic-questionnaires/${questionnaireId}/definition`,
        REFERRAL_INTAKE_DEFINITION,
      );
      return unwrapClinicQuestionnaireRecord<ClinicQuestionnaireDefinition>(res);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['clinic-questionnaire-definition', businessId, selectedId],
      });
      void queryClient.invalidateQueries({ queryKey: ['clinic-questionnaires', businessId] });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (questionnaireId: string) => {
      const { data: res } = await api.post(
        `/businesses/${businessId}/clinic-questionnaires/${questionnaireId}/publish`,
      );
      return unwrapClinicQuestionnaireRecord<ClinicQuestionnaireSummary>(res);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clinic-questionnaires', businessId] });
      void queryClient.invalidateQueries({
        queryKey: ['clinic-questionnaire-definition', businessId, selectedId],
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">{t('clinicQuestionnaires.title')}</h2>
        <p className="text-sm text-gray-400">{t('clinicQuestionnaires.subtitle')}</p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="btn-primary inline-flex items-center gap-2"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4" />
          {t('clinicQuestionnaires.addQuestionnaire')}
        </button>
      </div>

      {showForm && (
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-white">
            {t('clinicQuestionnaires.addQuestionnaire')}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="label">{t('clinicQuestionnaires.fields.code')}</span>
              <input
                className="input mt-1"
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="label">{t('clinicQuestionnaires.fields.internalName')}</span>
              <input
                className="input mt-1"
                value={form.internalName}
                onChange={(event) => setForm({ ...form, internalName: event.target.value })}
              />
            </label>
            <label className="block md:col-span-2">
              <span className="label">{t('clinicQuestionnaires.fields.title')}</span>
              <input
                className="input mt-1"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
            </label>
            <label className="block md:col-span-2">
              <span className="label">{t('clinicQuestionnaires.fields.introTitle')}</span>
              <input
                className="input mt-1"
                value={form.introTitle}
                onChange={(event) => setForm({ ...form, introTitle: event.target.value })}
              />
            </label>
            <label className="block md:col-span-2">
              <span className="label">{t('clinicQuestionnaires.fields.introBody')}</span>
              <textarea
                className="input mt-1 min-h-24"
                value={form.introBody}
                onChange={(event) => setForm({ ...form, introBody: event.target.value })}
              />
            </label>
          </div>
          {formError && <p className="text-sm text-red-400">{formError}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary"
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? t('common.saving') : t('common.save')}
            </button>
            <button type="button" className="btn-secondary" onClick={resetForm}>
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
        </div>
      ) : !questionnaires.length ? (
        <div className="card text-sm text-gray-400">{t('clinicQuestionnaires.empty')}</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="space-y-3">
            {questionnaires.map((questionnaire) => (
              <button
                key={questionnaire.id}
                type="button"
                className={`card w-full text-left transition ${
                  selectedId === questionnaire.id ? 'ring-1 ring-blue-400' : ''
                }`}
                onClick={() => setSelectedId(questionnaire.id)}
              >
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-blue-300" />
                  <h3 className="font-medium text-white">{questionnaire.title}</h3>
                  <span className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300">
                    {questionnaire.status === 'published'
                      ? t('clinicQuestionnaires.statusPublished')
                      : t('clinicQuestionnaires.statusDraft')}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-400">
                  {questionnaire.code} · {questionnaire.internalName}
                </p>
              </button>
            ))}
          </div>

          <div className="card space-y-4">
            {!selected ? (
              <p className="text-sm text-gray-400">{t('clinicQuestionnaires.selectPrompt')}</p>
            ) : definitionLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
              </div>
            ) : (
              <>
                <div>
                  <h3 className="font-medium text-white">{selected.title}</h3>
                  <p className="text-sm text-gray-400">
                    {t('clinicQuestionnaires.revisionLabel').replace(
                      '{revision}',
                      String(selected.revision),
                    )}
                  </p>
                </div>

                <div className="space-y-2">
                  {(definition?.questions ?? []).map((question, index) => (
                    <div
                      key={question.id}
                      className="rounded border border-gray-700 px-3 py-2 text-sm"
                    >
                      <p className="font-medium text-gray-200">
                        {index + 1}. {question.text || t('clinicQuestionnaires.untitledQuestion')}
                      </p>
                      <p className="text-xs text-gray-500">{question.type}</p>
                    </div>
                  ))}
                  {!definition?.questions?.length && (
                    <p className="text-sm text-gray-400">
                      {t('clinicQuestionnaires.noQuestionsYet')}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {selected.status !== 'published' && (
                    <>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={loadSampleMutation.isPending}
                        onClick={() => loadSampleMutation.mutate(selected.id)}
                      >
                        {t('clinicQuestionnaires.loadSampleTemplate')}
                      </button>
                      <button
                        type="button"
                        className="btn-primary inline-flex items-center gap-2"
                        disabled={
                          publishMutation.isPending || !definition?.questions?.length
                        }
                        onClick={() => publishMutation.mutate(selected.id)}
                      >
                        <Send className="h-4 w-4" />
                        {t('clinicQuestionnaires.publish')}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
