'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, CheckCircle2, ArrowRight, SkipForward, Clock, Link2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';
import { completeOnboardingPreservingBusinessType } from '@/lib/onboarding-skip.util';
import { EmbedWidgetSection } from '@/components/embed-widget-section';
import { AiCommandBar } from '@/components/ai-command-bar';
import { AiPagePanel } from '@/components/ai-page-panel';
import { AiSuggestionsStack } from '@/components/ai-suggestion-collapsible';
import { DashboardPageShell } from '@/components/dashboard/dashboard-page-shell';

interface BusinessTypeOption {
  id: string;
  labelKey: string;
  descriptionKey: string;
}

interface CatalogServiceDraft {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  bufferMinutes?: number;
  serviceType?: 'tour' | 'consultation' | 'lab_test' | 'procedure';
  tourDurationBadge?: string;
  durationDays?: number;
  requiresFasting?: boolean;
}

interface CatalogCategoryDraft {
  name: string;
  sortOrder: number;
  services: CatalogServiceDraft[];
}

interface VerticalPlaybookPreview {
  businessType: string;
  playbookId: string;
  labelKey: string;
  descriptionKey: string;
  serviceCount: number;
  scheduleTemplates: Array<{
    name: string;
    applyDays: number[];
    timePeriods: Array<{
      startTime: string;
      endTime: string;
      type: string;
      daysActive: string[];
    }>;
  }>;
  categories?: CatalogCategoryDraft[];
}

type Step = 'type' | 'review' | 'schedule' | 'link' | 'done';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const { business, setAuth, user, token, businesses, employee } = useAuthStore();
  const [step, setStep] = useState<Step>('type');
  const [selectedType, setSelectedType] = useState('');
  const [notes, setNotes] = useState('');
  const [catalog, setCatalog] = useState<CatalogCategoryDraft[]>([]);
  const [summary, setSummary] = useState('');
  const [source, setSource] = useState<'ai' | 'template' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const syncBusinessTypeIntoAuthStore = (businessType: string) => {
    if (!user || !token || !business) return;
    setAuth(
      user,
      {
        ...business,
        settings: {
          ...(business.settings ?? {}),
          businessType,
        },
      },
      token,
      { businesses, employee },
    );
  };

  const { data: businessTypes = [] } = useQuery({
    queryKey: ['onboarding-business-types', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}/onboarding/business-types`);
      const result = unwrap<{ types: BusinessTypeOption[] }>(data);
      return result.types;
    },
    enabled: !!business?.id,
  });

  const { data: playbookPreview } = useQuery({
    queryKey: ['onboarding-vertical-playbook', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}/onboarding/vertical-playbook`);
      return unwrap<VerticalPlaybookPreview>(data);
    },
    enabled: !!business?.id && (step === 'review' || step === 'schedule'),
  });

  const saveTypeMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/businesses/${business!.id}/onboarding/business-type`, {
        businessType: selectedType,
        notes: notes.trim() || undefined,
      });
      return unwrap(data);
    },
    onSuccess: () => {
      if (selectedType.trim()) {
        syncBusinessTypeIntoAuthStore(selectedType.trim());
      }
      void queryClient.invalidateQueries({
        queryKey: ['business-profile', business!.id],
      });
    },
    onError: () => setError(t('onboarding.saveTypeFailed')),
  });

  const recommendMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/businesses/${business!.id}/onboarding/recommend-catalog`);
      return unwrap<{
        categories: CatalogCategoryDraft[];
        summary: string;
        source: 'ai' | 'template';
      }>(data);
    },
    onSuccess: (result) => {
      setCatalog(result.categories);
      setSummary(result.summary);
      setSource(result.source);
      setStep('review');
      setError(null);
    },
    onError: () => setError(t('onboarding.recommendFailed')),
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/businesses/${business!.id}/onboarding/apply-catalog`, {
        categories: catalog,
      });
      return unwrap(data);
    },
    onSuccess: () => {
      setStep('schedule');
      setError(null);
    },
    onError: () => setError(t('onboarding.applyFailed')),
  });

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/businesses/${business!.id}/onboarding/apply-schedule`);
      return unwrap(data);
    },
    onSuccess: () => {
      setStep('link');
      setError(null);
    },
    onError: () => setError(t('onboarding.scheduleFailed')),
  });

  const skipScheduleMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/businesses/${business!.id}/onboarding/skip-schedule`);
    },
    onSuccess: () => setStep('link'),
  });

  const applyPlaybookMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/businesses/${business!.id}/onboarding/apply-playbook`);
      return unwrap(data);
    },
    onSuccess: () => {
      setStep('link');
      setError(null);
    },
    onError: () => setError(t('onboarding.playbooks.playbookFailed')),
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/businesses/${business!.id}/onboarding/complete`);
      return unwrap<{ completed: boolean }>(data);
    },
    onSuccess: (status) => {
      queryClient.setQueryData(['onboarding-status', business!.id], status);
      setStep('done');
    },
  });

  const skipAllMutation = useMutation({
    // e2e-bug.60 — persist selected type before complete (Skip used to drop it).
    mutationFn: async () =>
      completeOnboardingPreservingBusinessType({
        selectedType,
        notes,
        persistBusinessType: async (payload) => {
          const { data } = await api.post(
            `/businesses/${business!.id}/onboarding/business-type`,
            payload,
          );
          return unwrap(data);
        },
        completeOnboarding: async () => {
          const { data } = await api.post(
            `/businesses/${business!.id}/onboarding/complete`,
          );
          return unwrap<{ completed: boolean }>(data);
        },
      }),
    onSuccess: (status) => {
      queryClient.setQueryData(['onboarding-status', business!.id], status);
      if (selectedType.trim()) {
        syncBusinessTypeIntoAuthStore(selectedType.trim());
      }
      void queryClient.invalidateQueries({
        queryKey: ['business-profile', business!.id],
      });
      router.push('/dashboard');
    },
    onError: () => setError(t('onboarding.saveTypeFailed')),
  });

  const totalServices = useMemo(
    () => catalog.reduce((sum, cat) => sum + cat.services.length, 0),
    [catalog],
  );

  const stepLabels = [
    t('onboarding.stepServices'),
    t('onboarding.stepSchedule'),
    t('onboarding.stepLink'),
  ];
  const stepIndex = step === 'type' || step === 'review' ? 0 : step === 'schedule' ? 1 : step === 'link' ? 2 : 3;

  const handleContinueFromType = async () => {
    if (!selectedType) return;
    setError(null);
    await saveTypeMutation.mutateAsync();
    await recommendMutation.mutateAsync();
  };

  if (!business?.id) return null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <DashboardPageShell
        ai={
          <AiSuggestionsStack>
            <AiPagePanel
              title={t('onboarding.aiPanelTitle')}
              onboardingStep={step === 'done' ? 'done' : step}
              context={{ route: '/dashboard/onboarding', scheduleTab: step }}
            />
            <p className="text-xs text-gray-500 px-1">{t('onboarding.aiGuidedHint')}</p>
          </AiSuggestionsStack>
        }
      />

      <div className="mb-8 text-center">
        <div className="w-12 h-12 bg-violet-600/15 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6 text-violet-400" />
        </div>
        <h1 className="text-2xl font-bold">{t('onboarding.title')}</h1>
        <p className="text-gray-400 text-sm mt-2">{t('onboarding.subtitle')}</p>
        {step !== 'done' && (
          <div className="flex justify-center gap-2 mt-6">
            {stepLabels.map((label, i) => (
              <span
                key={label}
                className={`text-xs px-3 py-1 rounded-full ${
                  i <= stepIndex ? 'bg-violet-600/20 text-violet-300' : 'bg-gray-800 text-gray-500'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      {step === 'type' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="font-semibold mb-1">{t('onboarding.businessTypeTitle')}</h2>
            <p className="text-sm text-gray-500 mb-4">{t('onboarding.businessTypeSubtitle')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {businessTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`text-left rounded-xl border p-4 transition-colors ${
                    selectedType === type.id
                      ? 'border-violet-500 bg-violet-600/10'
                      : 'border-gray-800 hover:border-gray-600'
                  }`}
                >
                  <p className="font-medium">{t(type.labelKey)}</p>
                  <p className="text-xs text-gray-500 mt-1">{t(type.descriptionKey)}</p>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <label className="label">{t('onboarding.notesOptional')}</label>
              <textarea
                className="input min-h-[80px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('onboarding.notesPlaceholder')}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-between">
            <button
              type="button"
              onClick={() => skipAllMutation.mutate()}
              disabled={
                skipAllMutation.isPending || saveTypeMutation.isPending
              }
              className="btn-secondary inline-flex items-center gap-2"
            >
              {skipAllMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <SkipForward className="w-4 h-4" />
              )}
              {t('onboarding.skip')}
            </button>
            <button
              type="button"
              onClick={() => void handleContinueFromType()}
              disabled={!selectedType || saveTypeMutation.isPending || recommendMutation.isPending}
              className="btn-primary inline-flex items-center gap-2"
            >
              {(saveTypeMutation.isPending || recommendMutation.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {t('onboarding.generateCatalog')}
            </button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-6">
          {playbookPreview && (
            <div className="card border-violet-500/20 bg-violet-600/5">
              <h3 className="font-semibold text-gray-100">{t('onboarding.playbooks.previewTitle')}</h3>
              <p className="text-sm font-medium text-violet-300 mt-1">{t(playbookPreview.labelKey)}</p>
              <p className="text-sm text-gray-400 mt-1">{t(playbookPreview.descriptionKey)}</p>
              <p className="text-xs text-gray-500 mt-2">
                {t('onboarding.playbooks.servicesIncluded', { count: String(playbookPreview.serviceCount) })}
                {' · '}
                {t('onboarding.playbooks.templateCount', {
                  count: String(playbookPreview.scheduleTemplates.length),
                })}
              </p>
              {playbookPreview.playbookId === 'clinic' && playbookPreview.categories && (
                <div className="mt-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-300/80">
                    {t('onboarding.playbooks.clinicSampleTitle')}
                  </p>
                  {playbookPreview.categories.map((category) => (
                    <div
                      key={category.name}
                      className="rounded-lg border border-violet-500/15 bg-gray-900/40 px-3 py-2"
                    >
                      <p className="text-xs font-semibold text-violet-300/90">{category.name}</p>
                      <ul className="mt-2 space-y-1.5">
                        {category.services.map((svc) => (
                          <li key={`${category.name}-${svc.name}`} className="text-sm text-gray-200">
                            {svc.name}
                            {svc.serviceType && (
                              <span className="text-xs text-gray-500 ml-2">
                                · {t(`onboarding.playbooks.clinicType.${svc.serviceType}`)}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
              {playbookPreview.playbookId === 'tour' && playbookPreview.categories && (
                <div className="mt-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-300/80">
                    {t('onboarding.playbooks.tourSampleTitle')}
                  </p>
                  {playbookPreview.categories.flatMap((category) =>
                    category.services.map((svc) => (
                      <div
                        key={`${category.name}-${svc.name}`}
                        className="rounded-lg border border-violet-500/15 bg-gray-900/40 px-3 py-2"
                      >
                        <p className="text-sm font-medium text-gray-100">{svc.name}</p>
                        {svc.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{svc.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {svc.durationDays && svc.durationDays > 1
                            ? t('onboarding.playbooks.tourDurationDays', {
                                count: String(svc.durationDays),
                              })
                            : t('onboarding.playbooks.tourDurationDay')}
                          {' · '}${svc.price}
                          {svc.serviceType === 'tour' ? ` · ${t('onboarding.playbooks.tourTypeBadge')}` : ''}
                        </p>
                      </div>
                    )),
                  )}
                </div>
              )}
            </div>
          )}

          <div className="card bg-violet-600/5 border-violet-500/20">
            <p className="text-sm text-gray-300">{summary}</p>
            <p className="text-xs text-gray-500 mt-2">
              {source === 'ai' ? t('onboarding.aiGenerated') : t('onboarding.templateGenerated')}
            </p>
          </div>

          <div className="space-y-4">
            {catalog.map((category) => (
              <div key={category.name} className="card">
                <h3 className="font-bold text-gray-100 mb-3">{category.name}</h3>
                <ul className="space-y-2">
                  {category.services.map((svc) => (
                    <li
                      key={`${category.name}-${svc.name}`}
                      className="flex items-center justify-between gap-4 text-sm border-b border-gray-800/80 pb-2 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">{svc.name}</p>
                        {svc.description && <p className="text-xs text-gray-500">{svc.description}</p>}
                      </div>
                      <div className="text-right text-gray-400 shrink-0">
                        <p>{svc.durationMinutes} min</p>
                        <p>${svc.price}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 justify-between">
            <button type="button" onClick={() => setStep('type')} className="btn-secondary">
              {t('onboarding.back')}
            </button>
            <div className="flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                onClick={() => applyPlaybookMutation.mutate()}
                disabled={applyPlaybookMutation.isPending}
                className="btn-secondary inline-flex items-center gap-2"
              >
                {applyPlaybookMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {t('onboarding.playbooks.applyFullPlaybook')}
              </button>
              <button type="button" onClick={() => setStep('schedule')} className="btn-secondary">
                {t('onboarding.skip')}
              </button>
              <button
                type="button"
                onClick={() => applyMutation.mutate()}
                disabled={applyMutation.isPending || catalog.length === 0}
                className="btn-primary inline-flex items-center gap-2"
              >
                {applyMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {t('onboarding.createCatalog', {
                  categories: String(catalog.length),
                  services: String(totalServices),
                })}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'schedule' && (
        <div className="space-y-6">
          {playbookPreview && (
            <div className="card border-violet-500/20">
              <p className="text-sm font-medium text-violet-300">{t(playbookPreview.labelKey)}</p>
              <p className="text-sm text-gray-400 mt-1">{t(playbookPreview.descriptionKey)}</p>
              <div className="mt-4 space-y-3">
                {playbookPreview.scheduleTemplates.map((template) => (
                  <div key={template.name} className="rounded-lg border border-gray-800 p-3">
                    <p className="font-medium text-sm text-gray-200">{template.name}</p>
                    <ul className="mt-2 space-y-1">
                      {template.timePeriods.map((period) => (
                        <li key={`${template.name}-${period.startTime}-${period.endTime}`} className="text-xs text-gray-500">
                          {period.startTime}–{period.endTime}{' '}
                          {period.type === 'unavailable_block'
                            ? t('onboarding.playbooks.periodUnavailable')
                            : t('onboarding.playbooks.periodService')}
                          {period.daysActive.length > 0 ? ` (${period.daysActive.join(', ')})` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-violet-400" />
              <h2 className="font-semibold">{t('onboarding.scheduleTitle')}</h2>
            </div>
            <p className="text-sm text-gray-400">{t('onboarding.scheduleSubtitle')}</p>
            <ul className="mt-4 text-sm text-gray-500 space-y-1 list-disc list-inside">
              <li>{t('onboarding.scheduleDetail1')}</li>
              <li>{t('onboarding.scheduleDetail2')}</li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-3 justify-between">
            <button type="button" onClick={() => setStep('review')} className="btn-secondary">
              {t('onboarding.back')}
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => skipScheduleMutation.mutate()}
                disabled={skipScheduleMutation.isPending}
                className="btn-secondary"
              >
                {t('onboarding.skip')}
              </button>
              <button
                type="button"
                onClick={() => scheduleMutation.mutate()}
                disabled={scheduleMutation.isPending}
                className="btn-primary inline-flex items-center gap-2"
              >
                {scheduleMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
                {t('onboarding.applySchedule')}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'link' && (
        <div className="space-y-6">
          <div className="card bg-violet-600/5 border-violet-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Link2 className="w-5 h-5 text-violet-400" />
              <h2 className="font-semibold">{t('onboarding.linkTitle')}</h2>
            </div>
            <p className="text-sm text-gray-400">{t('onboarding.linkSubtitle')}</p>
          </div>

          <EmbedWidgetSection slug={business.slug} businessName={business.name} />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="btn-primary inline-flex items-center gap-2"
            >
              {completeMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {t('onboarding.finishSetup')}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="card text-center py-12">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t('onboarding.doneTitle')}</h2>
          <p className="text-sm text-gray-400 mb-6">{t('onboarding.doneSubtitleFull')}</p>
          <button
            type="button"
            onClick={() => {
              queryClient.setQueryData(['onboarding-status', business.id], { completed: true });
              router.push('/dashboard');
            }}
            className="btn-primary inline-flex items-center gap-2"
          >
            {t('onboarding.goToDashboard')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <AiCommandBar variant="onboarding" onboardingStep={step === 'done' ? 'done' : step} />
    </div>
  );
}
