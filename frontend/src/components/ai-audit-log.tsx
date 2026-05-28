'use client';

import { ScrollText, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface AuditEntry {
  id: string;
  eventType: string;
  summary: string;
  timestamp: string;
  approvedBy?: string;
  planDiff?: Array<{ description: string; action: string }>;
}

export function AiAuditLog() {
  const { business } = useAuthStore();

  const { data = [], isLoading } = useQuery({
    queryKey: ['ai-audit', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${business!.id}/ai/audit`, {
        params: { limit: 30 },
      });
      return (res.data ?? res ?? []) as AuditEntry[];
    },
    enabled: !!business?.id,
    refetchInterval: 30_000,
  });

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <ScrollText className="w-5 h-5 text-gray-400" />
        <h3 className="font-semibold">AI audit log</h3>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : data.length === 0 ? (
        <p className="text-sm text-gray-500">No AI mutations recorded yet.</p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {data.map((entry) => (
            <div key={entry.id} className="border-b border-gray-800 pb-3 last:border-0">
              <div className="flex justify-between gap-2 text-xs">
                <span className="text-violet-300 font-mono">{entry.eventType.replace('agent.plan.', '')}</span>
                <span className="text-gray-600 shrink-0">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-200 mt-1">{entry.summary}</p>
              {entry.approvedBy && (
                <p className="text-xs text-gray-500 mt-0.5">Approved by user {entry.approvedBy.slice(0, 8)}…</p>
              )}
              {entry.planDiff && entry.planDiff.length > 0 && (
                <ul className="mt-1 text-xs text-gray-500 list-disc list-inside">
                  {entry.planDiff.slice(0, 3).map((s, i) => (
                    <li key={i}>{s.description}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
