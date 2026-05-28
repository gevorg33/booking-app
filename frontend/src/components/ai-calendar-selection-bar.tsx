'use client';

import { Ban, CalendarPlus, Sparkles, X } from 'lucide-react';
import { setAiPageContext } from '@/lib/ai-orchestration';

export interface CalendarSelection {
  date: string;
  timeFrom: string;
  timeTo: string;
  employeeName: string;
  employeeId: string;
}

function firePrompt(prompt: string) {
  window.dispatchEvent(new CustomEvent('orchestrix:prompt', { detail: { prompt } }));
}

export function AiCalendarSelectionBar({
  selection,
  onClear,
}: {
  selection: CalendarSelection;
  onClear: () => void;
}) {
  const { date, timeFrom, timeTo, employeeName, employeeId } = selection;

  const runAction = (action: 'block' | 'fill' | 'apply') => {
    setAiPageContext({
      route: '/dashboard/calendar',
      employeeName,
      selectionDate: date,
      selectionTimeFrom: timeFrom,
      selectionTimeTo: timeTo,
      selectionEmployeeId: employeeId,
      date,
      timeFrom,
      timeTo,
    });

    const prompts = {
      block: `Block ${employeeName} on ${date} from ${timeFrom} to ${timeTo}`,
      fill: `Fill gaps for ${employeeName} on ${date} between ${timeFrom} and ${timeTo}`,
      apply: `Apply weekday template to ${employeeName} on ${date}`,
    };
    firePrompt(prompts[action]);
  };

  return (
    <div className="sticky bottom-4 z-20 mx-auto max-w-3xl rounded-xl border border-violet-500/40 bg-gray-950/95 backdrop-blur shadow-lg shadow-violet-900/20 p-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-xs font-semibold text-violet-200 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Selection · {employeeName}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {date} · {timeFrom} – {timeTo}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="p-1 rounded-md text-gray-500 hover:text-gray-200 hover:bg-gray-800"
          aria-label="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => runAction('block')}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-red-950/40 border border-gray-700 hover:border-red-500/40 text-gray-200"
        >
          <Ban className="w-3.5 h-3.5" />
          Block
        </button>
        <button
          type="button"
          onClick={() => runAction('fill')}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-emerald-950/40 border border-gray-700 hover:border-emerald-500/40 text-gray-200"
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          Fill gaps
        </button>
        <button
          type="button"
          onClick={() => runAction('apply')}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-900/40 hover:bg-violet-800/50 border border-violet-500/30 text-violet-100"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Apply template
        </button>
      </div>
    </div>
  );
}
