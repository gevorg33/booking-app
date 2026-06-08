'use client';

import {
  Check,
  ClipboardCopy,
  Download,
  Loader2,
  Tags,
  X,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';

interface LabelQueueItem {
  id: string;
  promptSnippet: string;
  locale: string;
  surface: string;
  classifiedAction: string;
  correctedAction: string | null;
  confidence: number | null;
  failureCount: number;
  failureSignals: Record<string, number> | null;
  labelOutcome: 'execution' | 'clarify';
  expectedAction: string | null;
  expectedRescuedAction: string | null;
  rescueFromAction: string | null;
  expectedParams: Record<string, unknown> | null;
  expectedClarifyFields: string[] | null;
  status: string;
  fixType?: string | null;
  fixStatus?: string | null;
  fixRef?: string | null;
  closureSummary?: string | null;
  evalCaseId?: string | null;
}

interface LabelQueueExport {
  total: number;
  items: LabelQueueItem[];
}

interface LabelDraft {
  outcome: 'execution' | 'clarify';
  action: string;
  rescued: string;
  rescueFrom: string;
  paramsJson: string;
  clarifyFields: string;
}

function formatAction(action: string) {
  return action.replace(/_/g, ' ');
}

function buildDraft(item: LabelQueueItem): LabelDraft {
  return {
    outcome: item.labelOutcome ?? 'execution',
    action: item.expectedAction ?? item.classifiedAction,
    rescued: item.expectedRescuedAction ?? item.correctedAction ?? '',
    rescueFrom: item.rescueFromAction ?? item.classifiedAction,
    paramsJson: item.expectedParams ? JSON.stringify(item.expectedParams, null, 2) : '',
    clarifyFields: item.expectedClarifyFields?.join(', ') ?? '',
  };
}

function parseParamsJson(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = JSON.parse(trimmed) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Params must be a JSON object');
  }
  return parsed as Record<string, unknown>;
}

function parseClarifyFields(raw: string): string[] | null {
  const values = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return values.length ? values : null;
}

export function AiEvalLabelingPanel() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, LabelDraft>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [harvestMessage, setHarvestMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ai-eval-label-queue', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${business!.id}/ai/eval/label-queue?status=pending&limit=25`,
      );
      return (res.data ?? res) as LabelQueueExport;
    },
    enabled: !!business?.id,
    staleTime: 60_000,
  });

  const draftFor = useMemo(() => {
    const map: Record<string, LabelDraft> = { ...drafts };
    for (const item of data?.items ?? []) {
      map[item.id] ??= buildDraft(item);
    }
    return map;
  }, [data?.items, drafts]);

  const { data: closureData } = useQuery({
    queryKey: ['ai-eval-closure-queue', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(
        `/businesses/${business!.id}/ai/eval/closure-queue?fixStatus=applied&limit=10`,
      );
      return (res.data ?? res) as LabelQueueExport;
    },
    enabled: !!business?.id,
    staleTime: 60_000,
  });

  const harvestMutation = useMutation({
    mutationFn: async () => {
      const { data: res } = await api.post(
        `/businesses/${business!.id}/ai/eval/label-queue/harvest?days=7`,
      );
      return res.data ?? res;
    },
    onSuccess: (result) => {
      const payload = result as { inserted?: number; updated?: number };
      setHarvestMessage(
        t('ai.evalLabelingHarvestDone', {
          inserted: String(payload.inserted ?? 0),
          updated: String(payload.updated ?? 0),
        }),
      );
      queryClient.invalidateQueries({ queryKey: ['ai-eval-label-queue', business?.id] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ item, draft }: { item: LabelQueueItem; draft: LabelDraft }) => {
      const payload = {
        labelOutcome: draft.outcome,
        expectedAction: draft.action || null,
        expectedRescuedAction: draft.outcome === 'execution' ? draft.rescued || null : null,
        rescueFromAction: draft.outcome === 'execution' ? draft.rescueFrom || null : null,
        expectedParams: draft.outcome === 'execution' ? parseParamsJson(draft.paramsJson) : null,
        expectedClarifyFields:
          draft.outcome === 'clarify' ? parseClarifyFields(draft.clarifyFields) : null,
      };
      const { data: res } = await api.patch(
        `/businesses/${business!.id}/ai/eval/label-queue/${item.id}`,
        payload,
      );
      return res.data ?? res;
    },
    onSuccess: () => {
      setActionError(null);
      setActionMessage(t('ai.evalLabelingSaved'));
      queryClient.invalidateQueries({ queryKey: ['ai-eval-label-queue', business?.id] });
    },
    onError: (error: unknown) => {
      setActionMessage(null);
      setActionError(error instanceof Error ? error.message : t('ai.evalLabelingSaveFailed'));
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ item, draft }: { item: LabelQueueItem; draft: LabelDraft }) => {
      await saveMutation.mutateAsync({ item, draft });
      const { data: res } = await api.post(
        `/businesses/${business!.id}/ai/eval/label-queue/${item.id}/approve`,
      );
      return res.data ?? res;
    },
    onSuccess: async (exported) => {
      setActionError(null);
      const payload = exported as {
        fixtureSnippet?: string;
        appendedToFixtures?: boolean;
        fixturesPath?: string;
        appendReason?: string;
        closurePlan?: {
          fixType?: string;
          fixStatus?: string;
          summary?: string;
        };
      };
      const snippet = payload.fixtureSnippet ?? JSON.stringify(exported, null, 2);
      await navigator.clipboard.writeText(snippet);
      const closureNote =
        payload.closurePlan?.fixType && payload.closurePlan?.fixStatus
          ? t('ai.evalLabelingClosureApplied', {
              fixType: payload.closurePlan.fixType,
              fixStatus: payload.closurePlan.fixStatus,
            })
          : '';
      setActionMessage(
        [
          payload.appendedToFixtures
            ? t('ai.evalLabelingAddedToFixtures', { path: payload.fixturesPath ?? '' })
            : t('ai.evalLabelingCopiedFixture', { reason: payload.appendReason ?? '' }),
          closureNote,
        ]
          .filter(Boolean)
          .join(' · '),
      );
      queryClient.invalidateQueries({ queryKey: ['ai-eval-label-queue', business?.id] });
      queryClient.invalidateQueries({ queryKey: ['ai-eval-closure-queue', business?.id] });
    },
    onError: (error: unknown) => {
      setActionMessage(null);
      setActionError(error instanceof Error ? error.message : t('ai.evalLabelingSaveFailed'));
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await api.post(`/businesses/${business!.id}/ai/eval/label-queue/${itemId}/dismiss`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-eval-label-queue', business?.id] });
    },
  });

  const downloadFixturesModule = async () => {
    if (!business?.id) return;
    setActionError(null);
    try {
      const { data: res } = await api.get(
        `/businesses/${business.id}/ai/eval/label-queue/export-fixtures-module`,
      );
      const payload = res.data ?? res;
      const blob = new Blob([payload.moduleSource as string], { type: 'text/typescript' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'ai-command-eval.harvested.cases.ts';
      anchor.click();
      URL.revokeObjectURL(url);
      setActionMessage(t('ai.evalLabelingModuleDownloaded'));
    } catch {
      setActionError(t('ai.evalLabelingModuleDownloadFailed'));
    }
  };

  if (!business) return null;

  return (
    <div className="card space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Tags className="w-5 h-5 text-fuchsia-400" />
            {t('ai.evalLabelingTitle')}
          </h2>
          <p className="text-xs text-gray-500 mt-1">{t('ai.evalLabelingHint')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => harvestMutation.mutate()}
            disabled={harvestMutation.isPending}
            className="btn-secondary text-sm"
          >
            {harvestMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              t('ai.evalLabelingHarvest')
            )}
          </button>
          <button type="button" onClick={downloadFixturesModule} className="btn-secondary text-sm">
            <Download className="w-4 h-4 inline mr-1" />
            {t('ai.evalLabelingDownloadModule')}
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-secondary text-sm"
          >
            {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : t('ai.analyticsRefresh')}
          </button>
        </div>
      </div>

      {harvestMessage && <p className="text-xs text-green-400">{harvestMessage}</p>}
      {actionMessage && <p className="text-xs text-green-400">{actionMessage}</p>}
      {actionError && <p className="text-xs text-red-400">{actionError}</p>}

      {isLoading ? (
        <p className="text-sm text-gray-500">{t('ai.analyticsLoading')}</p>
      ) : !data?.items?.length ? (
        <p className="text-sm text-gray-500">{t('ai.evalLabelingEmpty')}</p>
      ) : (
        <div className="space-y-3">
          {data.items.map((item) => {
            const draft = draftFor[item.id] ?? buildDraft(item);
            const expanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-lg border border-gray-800 bg-gray-900/30 p-3 space-y-3"
              >
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-200">{item.promptSnippet}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.surface} · {item.locale.toUpperCase()} · {item.failureCount}{' '}
                      {t('ai.evalLabelingFailures').toLowerCase()}
                      {item.confidence != null
                        ? ` · ${Math.round(item.confidence * 100)}% conf`
                        : ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('ai.evalLabelingClassified')}: {formatAction(item.classifiedAction)}
                      {item.correctedAction
                        ? ` → ${formatAction(item.correctedAction)}`
                        : ''}
                    </p>
                    {item.failureSignals && (
                      <p className="text-[11px] text-amber-400/80 mt-1">
                        {Object.entries(item.failureSignals)
                          .filter(([, count]) => count > 0)
                          .map(([key, count]) => `${key.replace(/_/g, ' ')} (${count})`)
                          .join(' · ')}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      type="button"
                      className="btn-secondary text-xs"
                      onClick={() => setExpandedId(expanded ? null : item.id)}
                    >
                      {expanded ? t('ai.evalLabelingCollapse') : t('ai.evalLabelingReview')}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary text-xs"
                      disabled={dismissMutation.isPending}
                      onClick={() => dismissMutation.mutate(item.id)}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="grid gap-3 lg:grid-cols-2 border-t border-gray-800 pt-3">
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400">{t('ai.evalLabelingOutcome')}</label>
                      <div className="flex gap-2">
                        {(['execution', 'clarify'] as const).map((outcome) => (
                          <button
                            key={outcome}
                            type="button"
                            className={`text-xs px-3 py-1 rounded-full border ${
                              draft.outcome === outcome
                                ? 'border-fuchsia-500 bg-fuchsia-950/40 text-fuchsia-200'
                                : 'border-gray-700 text-gray-400'
                            }`}
                            onClick={() =>
                              setDrafts((prev) => ({
                                ...prev,
                                [item.id]: { ...draft, outcome },
                              }))
                            }
                          >
                            {outcome === 'execution'
                              ? t('ai.evalLabelingOutcomeExecution')
                              : t('ai.evalLabelingOutcomeClarify')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {draft.outcome === 'execution' ? (
                      <>
                        <div>
                          <label className="text-xs text-gray-400">
                            {t('ai.evalLabelingRescuePlaceholder')}
                          </label>
                          <input
                            className="input text-xs mt-1 w-full"
                            value={draft.rescued}
                            onChange={(event) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [item.id]: { ...draft, rescued: event.target.value },
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">
                            {t('ai.evalLabelingRescueFrom')}
                          </label>
                          <input
                            className="input text-xs mt-1 w-full"
                            value={draft.rescueFrom}
                            onChange={(event) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [item.id]: { ...draft, rescueFrom: event.target.value },
                              }))
                            }
                          />
                        </div>
                        <div className="lg:col-span-2">
                          <label className="text-xs text-gray-400">
                            {t('ai.evalLabelingParams')}
                          </label>
                          <textarea
                            className="input text-xs mt-1 w-full min-h-[88px] font-mono"
                            value={draft.paramsJson}
                            onChange={(event) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [item.id]: { ...draft, paramsJson: event.target.value },
                              }))
                            }
                            placeholder={'{\n  "employeeName": "Anna"\n}'}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="lg:col-span-2">
                        <label className="text-xs text-gray-400">
                          {t('ai.evalLabelingClarifyFields')}
                        </label>
                        <input
                          className="input text-xs mt-1 w-full"
                          value={draft.clarifyFields}
                          onChange={(event) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [item.id]: { ...draft, clarifyFields: event.target.value },
                            }))
                          }
                          placeholder={t('ai.evalLabelingClarifyFieldsPlaceholder')}
                        />
                        <p className="text-[11px] text-gray-500 mt-1">
                          {t('ai.evalLabelingClarifyHint')}
                        </p>
                      </div>
                    )}

                    <div className="lg:col-span-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn-secondary text-xs"
                        disabled={saveMutation.isPending}
                        onClick={() => saveMutation.mutate({ item, draft })}
                      >
                        <Check className="w-3 h-3 inline mr-1" />
                        {t('ai.evalLabelingSaveDraft')}
                      </button>
                      <button
                        type="button"
                        className="btn-primary text-xs"
                        disabled={approveMutation.isPending}
                        onClick={() => approveMutation.mutate({ item, draft })}
                      >
                        <ClipboardCopy className="w-3 h-3 inline mr-1" />
                        {t('ai.evalLabelingAddToFixtures')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="border-t border-gray-800 pt-4 space-y-2">
        <h3 className="text-sm font-medium text-gray-300">{t('ai.evalLabelingClosureTitle')}</h3>
        {!closureData?.items?.length ? (
          <p className="text-xs text-gray-500">{t('ai.evalLabelingClosureEmpty')}</p>
        ) : (
          <ul className="space-y-2">
            {closureData.items.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-gray-800 bg-gray-900/20 px-3 py-2 text-xs text-gray-400"
              >
                <span className="text-gray-200">{item.promptSnippet.slice(0, 80)}</span>
                <span className="block mt-1">
                  {item.fixType ?? 'fix'} · {item.fixStatus ?? 'unknown'}
                  {item.evalCaseId ? ` · ${item.evalCaseId}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
