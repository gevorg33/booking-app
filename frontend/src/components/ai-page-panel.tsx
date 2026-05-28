'use client';

import { useEffect } from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { setAiPageContext, type AiPageContext } from '@/lib/ai-orchestration';

interface AiPagePanelProps {
  title?: string;
  suggestions: string[];
  context?: AiPageContext;
  onSelectPrompt?: (prompt: string) => void;
}

/** Contextual AI suggestions panel — dispatches prompt to command bar via custom event */
export function AiPagePanel({
  title = 'Orchestrix suggestions',
  suggestions,
  context,
  onSelectPrompt,
}: AiPagePanelProps) {
  useEffect(() => {
    if (context) setAiPageContext(context);
    return () => setAiPageContext({});
  }, [context]);

  const firePrompt = (prompt: string) => {
    if (onSelectPrompt) {
      onSelectPrompt(prompt);
      return;
    }
    window.dispatchEvent(new CustomEvent('orchestrix:prompt', { detail: { prompt } }));
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="card border-violet-500/20 bg-gradient-to-br from-violet-950/20 to-gray-900/40 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-violet-200">{title}</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => firePrompt(s)}
            className="group flex items-center gap-1 text-xs text-left px-3 py-2 rounded-lg bg-gray-800/80 hover:bg-violet-900/30 border border-gray-700 hover:border-violet-500/40 text-gray-300 hover:text-violet-100 transition-colors"
          >
            <span>{s}</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
}
