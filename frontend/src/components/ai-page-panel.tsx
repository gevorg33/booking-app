'use client';

import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import {
  setAiPageContext,
  clearAiPageContext,
  getAiPageSuggestionGroups,
  type AiPageContext,
} from '@/lib/ai-orchestration';
import { useI18n } from '@/i18n';
import { AiCollapsiblePanel, AiSuggestionGroupList } from '@/components/ai-suggestion-collapsible';

interface AiPagePanelProps {
  title?: string;
  suggestions?: string[];
  context?: AiPageContext;
  onSelectPrompt?: (prompt: string) => void;
  className?: string;
}

/** Contextual AI suggestions panel — dispatches prompt to command bar via custom event */
export function AiPagePanel({
  title,
  suggestions: suggestionsProp,
  context,
  onSelectPrompt,
  className = '',
}: AiPagePanelProps) {
  const { t } = useI18n();
  useEffect(() => {
    if (!context) return;
    setAiPageContext(context);
    const keys = Object.keys(context) as (keyof AiPageContext)[];
    return () => clearAiPageContext(keys);
  }, [context]);

  const firePrompt = (prompt: string) => {
    if (onSelectPrompt) {
      onSelectPrompt(prompt);
      return;
    }
    window.dispatchEvent(new CustomEvent('orchestrix:prompt', { detail: { prompt } }));
  };

  const route = context?.route ?? '';
  const groups = route
    ? getAiPageSuggestionGroups(route, t)
    : suggestionsProp?.length
      ? [{ id: 'commands', label: t('ai.quickCommands'), items: suggestionsProp }]
      : [];

  if (groups.every((g) => g.items.length === 0)) return null;

  return (
    <AiCollapsiblePanel
      title={title ?? t('ai.panelTitle')}
      icon={<Sparkles className="w-4 h-4 text-violet-400 shrink-0" />}
      className={`border-violet-500/20 bg-gradient-to-br from-violet-950/20 to-gray-900/40 ${className}`}
      defaultOpen={false}
    >
      <AiSuggestionGroupList groups={groups} onSelectPrompt={firePrompt} />
    </AiCollapsiblePanel>
  );
}
