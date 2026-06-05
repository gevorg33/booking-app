'use client';

import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Compass, Loader2, Scale, Stethoscope } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';
import { CheckboxChoice } from '@/components/ui/radio-choice';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

type HipaaAnswer = 'yes' | 'no' | 'unsure';
type HipaaDecision = 'defer' | 'wellness_only' | 'pursue_baa';
type MarketplaceDecision = 'software_only' | 'partner_directory' | 'full_marketplace' | 'undecided';

interface HipaaChecklistItem {
  id: string;
  category: string;
  blockerOnYes: boolean;
}

interface HipaaEval {
  answers: Record<string, HipaaAnswer>;
  readinessPercent: number;
  blockers: string[];
  recommendation: HipaaDecision;
  recommendationKey: string;
  notes: string | null;
  decidedAt: string | null;
}

interface MarketplaceEval {
  criterionWeights: Record<string, number>;
  optionScores: Record<string, number>;
  recommendation: MarketplaceDecision;
  recommendationKey: string;
  directoryOptIn: boolean | null;
  notes: string | null;
  decidedAt: string | null;
}

interface StrategySummary {
  hipaa: HipaaEval | null;
  marketplace: MarketplaceEval | null;
  medicalVerticalBlocked: boolean;
  marketplaceDecisionLocked: boolean;
}

const DEFAULT_CRITERION_WEIGHTS: Record<string, number> = {
  tenant_autonomy: 4,
  new_client_acquisition: 5,
  implementation_speed: 4,
  brand_control: 3,
  seo_discoverability: 4,
  operational_complexity: 3,
  marketplace_fees_tolerance: 3,
  support_burden: 3,
};

const HIPAA_QUESTION_IDS = [
  'handles_phi',
  'us_patients',
  'diagnosis_documentation',
  'baa_with_vendors',
  'privacy_officer',
  'encryption_at_rest',
  'encryption_in_transit',
  'access_audit_logs',
  'mfa_admin_access',
  'staff_hipaa_training',
  'incident_response_plan',
  'minimum_necessary_policy',
] as const;

export function StrategyEvalTab() {
  const { business } = useAuthStore();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const base = `/businesses/${business!.id}/strategy-eval`;

  const [hipaaAnswers, setHipaaAnswers] = useState<Record<string, HipaaAnswer>>({});
  const [hipaaNotes, setHipaaNotes] = useState('');
  const [hipaaDecision, setHipaaDecision] = useState<HipaaDecision | ''>('');
  const [marketplaceWeights, setMarketplaceWeights] = useState(DEFAULT_CRITERION_WEIGHTS);
  const [marketplaceNotes, setMarketplaceNotes] = useState('');
  const [marketplaceDecision, setMarketplaceDecision] = useState<MarketplaceDecision | ''>('');
  const [directoryOptIn, setDirectoryOptIn] = useState<boolean | null>(null);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['strategy-eval-summary', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`${base}/summary`);
      return unwrap<{ summary: StrategySummary }>(data).summary;
    },
    enabled: !!business?.id,
  });

  const { data: hipaaFramework } = useQuery({
    queryKey: ['strategy-eval-hipaa-framework', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`${base}/hipaa/framework`);
      return unwrap<{ checklist: HipaaChecklistItem[] }>(data);
    },
    enabled: !!business?.id,
  });

  const { data: marketplaceFramework } = useQuery({
    queryKey: ['strategy-eval-marketplace-framework', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`${base}/marketplace/framework`);
      return unwrap<{ criteria: Array<{ id: string; defaultWeight: number }> }>(data);
    },
    enabled: !!business?.id,
  });

  useEffect(() => {
    if (summary?.hipaa) {
      queueMicrotask(() => {
        setHipaaAnswers(summary.hipaa.answers);
        setHipaaNotes(summary.hipaa.notes ?? '');
        setHipaaDecision(summary.hipaa.decidedAt ? summary.hipaa.recommendation : '');
      });
    }
    if (summary?.marketplace) {
      queueMicrotask(() => {
        setMarketplaceWeights(summary.marketplace.criterionWeights);
        setMarketplaceNotes(summary.marketplace.notes ?? '');
        setMarketplaceDecision(summary.marketplace.decidedAt ? summary.marketplace.recommendation : '');
        setDirectoryOptIn(summary.marketplace.directoryOptIn);
      });
    }
  }, [summary]);

  const hipaaMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put(`${base}/hipaa`, {
        answers: hipaaAnswers,
        notes: hipaaNotes.trim() || undefined,
        decision: hipaaDecision || undefined,
      });
      return unwrap<{ evaluation: HipaaEval }>(data).evaluation;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['strategy-eval-summary', business?.id] });
    },
  });

  const marketplaceMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put(`${base}/marketplace`, {
        criterionWeights: marketplaceWeights,
        notes: marketplaceNotes.trim() || undefined,
        directoryOptIn: directoryOptIn ?? undefined,
        decision: marketplaceDecision || undefined,
      });
      return unwrap<{ evaluation: MarketplaceEval }>(data).evaluation;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['strategy-eval-summary', business?.id] });
    },
  });

  const hipaaPreview = useMemo(() => {
    if (!Object.keys(hipaaAnswers).length) return null;
    return hipaaMutation.data ?? summary?.hipaa;
  }, [hipaaAnswers, hipaaMutation.data, summary?.hipaa]);

  const marketplacePreview = useMemo(() => {
    return marketplaceMutation.data ?? summary?.marketplace;
  }, [marketplaceMutation.data, summary?.marketplace]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t('common.loading')}
      </div>
    );
  }

  const recommendationClass = (kind: 'warning' | 'success' | 'neutral') => {
    if (kind === 'warning') return 'border-amber-500/40 bg-amber-500/10 text-amber-100';
    if (kind === 'success') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100';
    return 'border-gray-700 bg-gray-900/60 text-gray-200';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-100">{t('strategyEval.title')}</h2>
        <p className="text-sm text-gray-400 mt-1">{t('strategyEval.subtitle')}</p>
      </div>

      {summary && (
        <section className="card space-y-3">
          <h3 className="font-semibold text-gray-100 flex items-center gap-2">
            <Compass className="w-4 h-4" />
            {t('strategyEval.summaryTitle')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className={`rounded-lg border p-3 ${recommendationClass(summary.medicalVerticalBlocked ? 'warning' : 'success')}`}>
              <p className="font-medium flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                {t('strategyEval.medicalVertical')}
              </p>
              <p className="mt-1 text-xs opacity-90">
                {summary.hipaa
                  ? t(summary.hipaa.recommendationKey)
                  : t('strategyEval.hipaa.notStarted')}
              </p>
            </div>
            <div className={`rounded-lg border p-3 ${recommendationClass(summary.marketplaceDecisionLocked ? 'success' : 'neutral')}`}>
              <p className="font-medium flex items-center gap-2">
                <Scale className="w-4 h-4" />
                {t('strategyEval.marketplacePositioning')}
              </p>
              <p className="mt-1 text-xs opacity-90">
                {summary.marketplace
                  ? t(summary.marketplace.recommendationKey)
                  : t('strategyEval.marketplace.notStarted')}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="card space-y-4">
        <h3 className="font-semibold text-gray-100 flex items-center gap-2">
          <Stethoscope className="w-4 h-4" />
          {t('strategyEval.hipaa.title')}
        </h3>
        <p className="text-sm text-gray-400">{t('strategyEval.hipaa.subtitle')}</p>

        <div className="space-y-3">
          {HIPAA_QUESTION_IDS.map((id) => (
            <div key={id} className="rounded-lg border border-gray-800 p-3">
              <p className="text-sm text-gray-200 mb-2">{t(`strategyEval.hipaa.questions.${id}`)}</p>
              <div className="flex flex-wrap gap-2">
                {(['yes', 'no', 'unsure'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      hipaaAnswers[id] === value
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                    onClick={() => setHipaaAnswers((prev) => ({ ...prev, [id]: value }))}
                  >
                    {t(`strategyEval.hipaa.answer.${value}`)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {(hipaaPreview || hipaaMutation.isSuccess) && (
          <div className={`rounded-lg border p-4 space-y-2 ${recommendationClass('neutral')}`}>
            <p className="text-sm font-medium">{t('strategyEval.hipaa.readiness')}: {hipaaPreview?.readinessPercent ?? 0}%</p>
            {hipaaPreview?.blockers.length ? (
              <p className="text-xs text-amber-200">
                {t('strategyEval.hipaa.blockers')}: {hipaaPreview.blockers.map((b) => t(`strategyEval.hipaa.questions.${b}`)).join('; ')}
              </p>
            ) : null}
            <p className="text-sm">{t(hipaaPreview?.recommendationKey ?? 'strategyEval.hipaa.recDefer')}</p>
          </div>
        )}

        <div>
          <label className="label">{t('strategyEval.hipaa.decisionLabel')}</label>
          <select
            className="input"
            value={hipaaDecision}
            onChange={(e) => setHipaaDecision(e.target.value as HipaaDecision | '')}
          >
            <option value="">{t('strategyEval.hipaa.decisionPending')}</option>
            {(hipaaFramework?.checklist ? ['defer', 'wellness_only', 'pursue_baa'] : []).map((d) => (
              <option key={d} value={d}>
                {t(`strategyEval.hipaa.decision.${d}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">{t('strategyEval.notes')}</label>
          <textarea
            className="input min-h-[72px]"
            value={hipaaNotes}
            onChange={(e) => setHipaaNotes(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="btn-primary inline-flex items-center gap-2"
          disabled={hipaaMutation.isPending || HIPAA_QUESTION_IDS.some((id) => !hipaaAnswers[id])}
          onClick={() => hipaaMutation.mutate()}
        >
          {hipaaMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
          {t('strategyEval.saveHipaa')}
        </button>
      </section>

      <section className="card space-y-4">
        <h3 className="font-semibold text-gray-100 flex items-center gap-2">
          <Scale className="w-4 h-4" />
          {t('strategyEval.marketplace.title')}
        </h3>
        <p className="text-sm text-gray-400">{t('strategyEval.marketplace.subtitle')}</p>

        <div className="space-y-3">
          {(marketplaceFramework?.criteria ?? Object.entries(DEFAULT_CRITERION_WEIGHTS).map(([id, defaultWeight]) => ({ id, defaultWeight }))).map(
            (criterion) => (
              <div key={criterion.id} className="flex items-center justify-between gap-4">
                <label className="text-sm text-gray-300 flex-1">
                  {t(`strategyEval.marketplace.criteria.${criterion.id}`)}
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={marketplaceWeights[criterion.id] ?? criterion.defaultWeight}
                  onChange={(e) =>
                    setMarketplaceWeights((prev) => ({
                      ...prev,
                      [criterion.id]: Number(e.target.value),
                    }))
                  }
                  className="w-32"
                />
                <span className="text-xs text-gray-500 w-4 text-right">
                  {marketplaceWeights[criterion.id] ?? criterion.defaultWeight}
                </span>
              </div>
            ),
          )}
        </div>

        {marketplacePreview && (
          <div className="rounded-lg border border-gray-800 p-4 space-y-2">
            <p className="text-sm font-medium text-gray-200">{t('strategyEval.marketplace.scoresTitle')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {(['software_only', 'partner_directory', 'full_marketplace'] as const).map((option) => (
                <div key={option} className="rounded-lg bg-gray-900/60 p-2">
                  <p className="text-gray-400">{t(`strategyEval.marketplace.option.${option}`)}</p>
                  <p className="text-lg font-semibold text-gray-100">{marketplacePreview.optionScores[option] ?? 0}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-300">{t(marketplacePreview.recommendationKey)}</p>
          </div>
        )}

        <CheckboxChoice
          className="w-full rounded-lg border border-gray-800/80 px-3 py-2.5 transition-colors hover:bg-gray-800/30"
          checked={directoryOptIn === true}
          onChange={(checked) => setDirectoryOptIn(checked ? true : null)}
          label={t('strategyEval.marketplace.directoryOptIn')}
          labelClassName="text-sm text-gray-200"
        />

        <div>
          <label className="label">{t('strategyEval.marketplace.decisionLabel')}</label>
          <select
            className="input"
            value={marketplaceDecision}
            onChange={(e) => setMarketplaceDecision(e.target.value as MarketplaceDecision | '')}
          >
            <option value="">{t('strategyEval.marketplace.decisionPending')}</option>
            {(['software_only', 'partner_directory', 'full_marketplace', 'undecided'] as const).map((d) => (
              <option key={d} value={d}>
                {t(`strategyEval.marketplace.decision.${d}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">{t('strategyEval.notes')}</label>
          <textarea
            className="input min-h-[72px]"
            value={marketplaceNotes}
            onChange={(e) => setMarketplaceNotes(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="btn-primary inline-flex items-center gap-2"
          disabled={marketplaceMutation.isPending}
          onClick={() => marketplaceMutation.mutate()}
        >
          {marketplaceMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
          {t('strategyEval.saveMarketplace')}
        </button>
      </section>
    </div>
  );
}
