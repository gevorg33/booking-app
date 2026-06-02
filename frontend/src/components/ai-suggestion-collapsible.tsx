'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export type SuggestionGroup = {
  id: string;
  label: string;
  items: string[];
};

type AiCollapsiblePanelProps = {
  title: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
};

/** Tight vertical stack for multiple AI panels on one page. */
export function AiSuggestionsStack({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-1">{children}</div>;
}

/** Outer section wrapper — collapsed by default. */
export function AiCollapsiblePanel({
  title,
  icon,
  children,
  className = '',
  defaultOpen = false,
}: AiCollapsiblePanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`overflow-hidden rounded-xl border border-gray-800 bg-gray-900 dark:bg-gray-900 ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-[0.5625rem] text-left hover:bg-gray-800/40 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 min-w-0">
          {icon}
          <span className="text-sm font-medium text-gray-100 truncate">{title}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="border-t border-gray-800 px-3 pb-3 pt-2">{children}</div>}
    </div>
  );
}

type AiSuggestionGroupListProps = {
  groups: SuggestionGroup[];
  onSelectPrompt: (prompt: string) => void;
  /** Inner category dropdowns — collapsed by default. */
  defaultGroupsOpen?: boolean;
};

function PromptChips({
  items,
  onSelect,
}: {
  items: string[];
  onSelect: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelect(prompt)}
          className="group flex cursor-pointer items-center gap-1 text-xs text-left px-3 py-2 rounded-lg bg-gray-800/80 hover:bg-violet-900/30 border border-gray-700 hover:border-violet-500/40 text-gray-300 hover:text-violet-100 transition-colors"
        >
          <span>{prompt}</span>
          <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </button>
      ))}
    </div>
  );
}

/** Nested dropdown groups for suggestion chips. */
export function AiSuggestionGroupList({
  groups,
  onSelectPrompt,
  defaultGroupsOpen = false,
}: AiSuggestionGroupListProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(() =>
    defaultGroupsOpen ? new Set(groups.map((g) => g.id)) : new Set(),
  );

  if (groups.length === 0) return null;

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (groups.length === 1 && groups[0].items.length > 0) {
    return <PromptChips items={groups[0].items} onSelect={onSelectPrompt} />;
  }

  return (
    <div className="space-y-2">
      {groups.map((group) => {
        const isOpen = openIds.has(group.id);
        return (
          <div
            key={group.id}
            className="rounded-lg border border-gray-700/80 bg-gray-900/40 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggle(group.id)}
              className="flex w-full cursor-pointer items-center justify-between gap-2 px-2.5 py-1.5 text-left hover:bg-gray-800/50 transition-colors"
              aria-expanded={isOpen}
            >
              <span className="flex items-center gap-1.5 min-w-0 text-sm font-medium text-gray-200">
                <ChevronRight
                  className={`w-3.5 h-3.5 shrink-0 text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                />
                <span className="truncate">{group.label}</span>
                <span className="text-xs font-normal text-gray-500 shrink-0">({group.items.length})</span>
              </span>
            </button>
            {isOpen && (
              <div className="px-3 pb-3 pt-1 border-t border-gray-700/50">
                <PromptChips items={group.items} onSelect={onSelectPrompt} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
