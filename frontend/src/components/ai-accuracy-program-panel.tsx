'use client';

import { CheckCircle2, Loader2, Target, TrendingUp } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';

interface LadderStage {
  stage: number;
  label: string;
  targetNoClarify: number;
  reached: boolean;
}

interface RatchetHistoryEntry {
  at: string;
  from: number;
  to: number;
  measuredAccuracy: number;
}

export function AiAccuracyProgramPanel() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['ai-accuracy-program', business?.id],
    queryFn: async () => {
      if (!business?.id) return null;
      const { data: payload } = await api.get(
        `/businesses/${business.id}/ai/accuracy/program?days=30`,
      );
      return payload.data ?? payload;
    },
    enabled: !!business?.id,
  });

  const applyRatchetMutation = useMutation({
    mutationFn: async () => {
      const { data: payload } = await api.post(
        `/businesses/${business!.id}/ai/accuracy/ratchet/apply`,
      );
      return payload.data ?? payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-accuracy-program', business?.id] });
    },
  });

  if (isLoading || !data) {
    return (
      <div className="card flex items-center gap-2 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t('ai.loadingAnalytics')}
      </div>
    );
  }

  const pct = (value: number) => `${(value * 100).toFixed(1)}%`;
  const ladder = data.ladder ?? {};
  const ratchet = data.ratchet ?? {};
  const stages = (ladder.stages ?? []) as LadderStage[];
  const history = (ratchet.ratchetHistory ?? []) as RatchetHistoryEntry[];
  const floorProgress = ratchet.floorProgressPct ?? ladder.floorProgressPct ?? 0;
  const gapPts = ratchet.gapToTargetPts ?? ladder.gapToTargetPts ?? 0;
  const ciTarget = ratchet.ciTarget ?? ladder.ciTarget ?? 0.99;

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-violet-400" />
        <h2 className="text-lg font-semibold">{t('ai.programTitle')}</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <div className="rounded-lg border border-gray-800 p-3">
          <p className="text-gray-500">{t('ai.programCiFloor')}</p>
          <p className="text-xl font-semibold">{pct(ladder.ciFloor ?? ratchet.ciFloor ?? 0)}</p>
        </div>
        <div className="rounded-lg border border-gray-800 p-3">
          <p className="text-gray-500">{t('ai.programEscalationRate')}</p>
          <p
            className={`text-xl font-semibold ${
              data.escalation?.meetsTarget ?? (data.headline?.escalationRate ?? 0) <= 0.01
                ? 'text-green-400'
                : 'text-amber-400'
            }`}
          >
            {pct(data.headline?.escalationRate ?? 0, 2)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 p-3">
          <p className="text-gray-500">{t('ai.programExitGate')}</p>
          <p
            className={`text-xl font-semibold ${
              data.exitGate?.met ? 'text-green-400' : 'text-amber-400'
            }`}
          >
            {data.exitGate?.met ? t('ai.programExitMet') : t('ai.programExitPending')}
          </p>
        </div>
        <div className="rounded-lg border border-gray-800 p-3">
          <p className="text-gray-500">{t('ai.programStage')}</p>
          <p className="text-xl font-semibold flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            {ladder.currentStage ?? 0}/{ladder.targetStage ?? 4}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-800 p-4 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">{t('ai.programRatchetProgress')}</p>
            <p className="text-xs text-gray-500">
              {t('ai.programRatchetGap', { pts: gapPts.toFixed(1), target: pct(ciTarget) })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => applyRatchetMutation.mutate()}
            disabled={!ratchet.ratchet?.shouldBump || applyRatchetMutation.isPending}
            className="btn btn-secondary text-sm disabled:opacity-50"
          >
            {applyRatchetMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
            ) : null}
            {t('ai.programApplyRatchet')}
          </button>
        </div>
        <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
          <div
            className="h-full bg-violet-500 transition-all"
            style={{ width: `${Math.min(100, floorProgress)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">
          {ratchet.ratchet?.shouldBump
            ? t('ai.programRatchetEligible', {
                next: pct(ratchet.ratchet.proposedFloor),
                reason: ratchet.ratchet.reason,
              })
            : t('ai.programRatchetIneligible', { reason: ratchet.ratchet?.reason ?? '—' })}
        </p>
      </div>

      {stages.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">{t('ai.programLadderTitle')}</p>
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {stages.map((stage) => (
              <li
                key={stage.stage}
                className={`rounded-lg border p-3 text-sm ${
                  stage.reached
                    ? 'border-green-800/60 bg-green-950/20'
                    : 'border-gray-800'
                }`}
              >
                <div className="flex items-center gap-2 font-medium">
                  {stage.reached ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-gray-600 shrink-0" />
                  )}
                  {stage.label}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('ai.programLadderTarget', { target: pct(stage.targetNoClarify) })}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">{t('ai.programRatchetHistory')}</p>
          <ul className="text-xs text-gray-400 space-y-1">
            {history.slice(-5).reverse().map((entry) => (
              <li key={entry.at}>
                {new Date(entry.at).toLocaleDateString()} — {pct(entry.from)} → {pct(entry.to)}{' '}
                ({t('ai.programRatchetMeasured', { acc: pct(entry.measuredAccuracy) })})
              </li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(data.recommendedActions) && data.recommendedActions.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">{t('ai.programRecommendedActions')}</p>
          <ul className="text-sm text-gray-300 space-y-1 list-disc pl-5">
            {data.recommendedActions.map((action: string) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
