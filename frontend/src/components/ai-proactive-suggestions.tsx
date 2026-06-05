'use client';

import { Pencil, Play, Sparkles, Zap } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import type { AiPageContext } from '@/lib/ai-orchestration';
import type { AiSuggestion } from '@/lib/ai-client.types';
import {
  useAiSuggestions,
  useContextualAiSuggestions,
  useOrchestrixEvents,
} from '@/lib/use-ai-suggestions';
import { fireOrchestrixEdit, fireOrchestrixRun } from '@/lib/orchestrix-events';
import { AiCollapsiblePanel } from '@/components/ai-suggestion-collapsible';
import { useI18n } from '@/i18n';

export type { AiSuggestion };
export { useOrchestrixEvents };

const PRIORITY_COLOR = {
  high: 'border-red-500/30 bg-red-950/20',
  medium: 'border-amber-500/30 bg-amber-950/20',
  low: 'border-gray-600 bg-gray-800/40',
};

function OpportunityCards({
  suggestions,
  runLabel,
  editLabel,
}: {
  suggestions: AiSuggestion[];
  runLabel: string;
  editLabel: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:items-start">
      {suggestions.map((s) => (
        <div
          key={s.id}
          className={`rounded-md border px-2.5 py-2 text-left ${PRIORITY_COLOR[s.priority]}`}
        >
          <p className="text-sm font-medium leading-snug text-gray-200">{s.title}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => fireOrchestrixRun(s.prompt, true)}
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-violet-200 bg-violet-600/30 hover:bg-violet-600/50 transition-colors"
            >
              <Play className="h-3 w-3 shrink-0" />
              {runLabel}
            </button>
            <button
              type="button"
              onClick={() => fireOrchestrixEdit(s.prompt)}
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-gray-400 hover:text-gray-200 bg-gray-800/60 hover:bg-gray-800 transition-colors"
            >
              <Pencil className="h-3 w-3 shrink-0" />
              {editLabel}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AiProactiveSuggestions() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const { data: suggestions = [] } = useAiSuggestions(business?.id);

  if (suggestions.length === 0) return null;

  return (
    <AiCollapsiblePanel
      title={t('ai.opportunitiesTitle')}
      icon={<Zap className="w-4 h-4 text-violet-400 shrink-0" />}
      className="border-violet-500/25"
      defaultOpen={false}
    >
      <OpportunityCards
        suggestions={suggestions}
        runLabel={t('ai.suggestionRun')}
        editLabel={t('ai.suggestionEdit')}
      />
    </AiCollapsiblePanel>
  );
}

interface AiContextualSuggestionsProps {
  context: AiPageContext;
  title?: string;
}

/** Live suggestions filtered by page context (schedule gaps, conflicts, etc.) */
export function AiContextualSuggestions({
  context,
  title,
}: AiContextualSuggestionsProps) {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const route = context.route ?? '';

  const { data: suggestions = [] } = useContextualAiSuggestions(business?.id, context);

  if (suggestions.length === 0) return null;

  return (
    <AiCollapsiblePanel
      title={title ?? t('ai.opportunitiesOnPage')}
      icon={<Zap className="w-4 h-4 text-violet-400 shrink-0" />}
      className="border-violet-500/20 bg-gradient-to-br from-violet-950/15 to-gray-900/30"
      defaultOpen={false}
    >
      <OpportunityCards
        suggestions={suggestions}
        runLabel={t('ai.suggestionRun')}
        editLabel={t('ai.suggestionEdit')}
      />
    </AiCollapsiblePanel>
  );
}
