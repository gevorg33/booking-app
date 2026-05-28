'use client';

import { Sun, Sparkles, AlertTriangle, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export interface MorningBriefing {
  date: string;
  utilizationPercent: number;
  todaysBookings: number;
  cancellationsToday: number;
  conflictsToday: number;
  unpaidToday: number;
  highlights: string[];
  suggestedActions: Array<{ title: string; prompt: string }>;
}

function firePrompt(prompt: string) {
  window.dispatchEvent(new CustomEvent('orchestrix:prompt', { detail: { prompt } }));
}

export function AiMorningBriefing() {
  const { business } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['ai-briefing', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${business!.id}/ai/briefing`);
      return (res.data ?? res) as MorningBriefing;
    },
    enabled: !!business?.id,
    refetchInterval: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="card border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-gray-900/40 mb-6 flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
        <span className="text-sm text-gray-400">Preparing morning briefing…</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="card border-amber-500/25 bg-gradient-to-br from-amber-950/25 to-gray-900/50 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <Sun className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-amber-100">Morning briefing · {data.date}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {data.todaysBookings} appointments · {data.utilizationPercent}% utilization
            {data.conflictsToday > 0 && ` · ${data.conflictsToday} conflict(s)`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <Stat label="Bookings" value={data.todaysBookings} />
        <Stat label="Utilization" value={`${data.utilizationPercent}%`} />
        <Stat label="Cancellations" value={data.cancellationsToday} warn={data.cancellationsToday > 0} />
        <Stat label="Unpaid done" value={data.unpaidToday} warn={data.unpaidToday > 0} />
      </div>

      <ul className="space-y-1 mb-4">
        {data.highlights.map((h) => (
          <li key={h} className="text-sm text-gray-300 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            {h}
          </li>
        ))}
      </ul>

      {data.suggestedActions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-violet-300 mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Suggested actions
          </p>
          <div className="flex flex-wrap gap-2">
            {data.suggestedActions.map((a) => (
              <button
                key={a.title}
                type="button"
                onClick={() => firePrompt(a.prompt)}
                className="group flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-gray-800/80 hover:bg-violet-900/30 border border-gray-700 hover:border-violet-500/40 text-gray-300"
              >
                <Calendar className="w-3 h-3 opacity-60" />
                {a.title}
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div className={`rounded-lg px-3 py-2 border ${warn ? 'border-orange-500/30 bg-orange-950/20' : 'border-gray-700 bg-gray-900/40'}`}>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
    </div>
  );
}
