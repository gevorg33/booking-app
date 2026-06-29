'use client';

import { useEffect, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import {
  setAiPageContext,
  clearAiPageContext,
  type AiPageContext,
} from '@/lib/ai-orchestration';
import type { OnboardingAiStep } from '@/lib/ai-onboarding.util';
import {
  aiPagePanelHasSuggestions,
  resolveAiPagePanelGroups,
} from '@/lib/ai-page-panel.util';
import { useI18n } from '@/i18n';
import { AiCollapsiblePanel, AiSuggestionGroupList } from '@/components/ai-suggestion-collapsible';
import { useAssistantExampleTenant } from '@/hooks/use-assistant-example-tenant';

interface AiPagePanelProps {
  title?: string;
  suggestions?: string[];
  context?: AiPageContext;
  onboardingStep?: OnboardingAiStep;
  onSelectPrompt?: (prompt: string) => void;
  className?: string;
}

/** Contextual AI suggestions panel — dispatches prompt to command bar via custom event */
export function AiPagePanel({
  title,
  suggestions: suggestionsProp,
  context,
  onboardingStep,
  onSelectPrompt,
  className = '',
}: AiPagePanelProps) {
  const { t } = useI18n();
  const tenant = useAssistantExampleTenant();
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

  const groups = useMemo(
    () =>
      resolveAiPagePanelGroups({
        route: context?.route ?? '',
        onboardingStep,
        suggestions: suggestionsProp,
        tenant,
        t,
      }),
    [context?.route, onboardingStep, suggestionsProp, tenant, t],
  );

  if (!aiPagePanelHasSuggestions(groups)) return null;

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
