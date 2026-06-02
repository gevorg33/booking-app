'use client';

import { useState } from 'react';
import { Bot, Loader2, Save } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ToggleChoice } from '@/components/ui/radio-choice';
import { useAuthStore } from '@/lib/store';

interface AutopilotRule {
  id: string;
  name: string;
  enabled: boolean;
  cron?: string;
  prompt: string;
  lastRunAt?: string | null;
}

interface AiSettings {
  autopilot: { enabled: boolean; rules: AutopilotRule[] };
  playbooks: Array<{ id: string; name: string; description: string; enabled: boolean }>;
  confidence: { low: number; high: number };
}

export function AiAutopilotSettings() {
  const { business } = useAuthStore();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['ai-settings', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${business!.id}/ai/settings`);
      return (res.data ?? res) as AiSettings;
    },
    enabled: !!business?.id,
  });

  const [local, setLocal] = useState<AiSettings | null>(null);
  const settings = local ?? data;

  const saveMutation = useMutation({
    mutationFn: async (body: AiSettings) => {
      const { data: res } = await api.put(`/businesses/${business!.id}/ai/settings`, body);
      return (res.data ?? res) as AiSettings;
    },
    onSuccess: (next) => {
      setLocal(null);
      queryClient.setQueryData(['ai-settings', business?.id], next);
    },
  });

  if (isLoading || !settings) {
    return (
      <div className="card flex items-center gap-2 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading AI settings…
      </div>
    );
  }

  const updateRule = (id: string, patch: Partial<AutopilotRule>) => {
    setLocal({
      ...settings,
      autopilot: {
        ...settings.autopilot,
        rules: settings.autopilot.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      },
    });
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        <Bot className="w-5 h-5 text-violet-400" />
        <h3 className="font-semibold">Autopilot & playbooks</h3>
      </div>

      <ToggleChoice variant="dashboard"
        checked={settings.autopilot.enabled}
        onChange={(enabled) =>
          setLocal({
            ...settings,
            autopilot: { ...settings.autopilot, enabled },
          })
        }
        label="Enable autopilot (scheduled AI rules, UTC cron)"
      />

      <div className="space-y-3">
        {settings.autopilot.rules.map((rule) => (
          <div key={rule.id} className="rounded-lg border border-gray-700 p-3 space-y-2">
            <ToggleChoice variant="dashboard"
              checked={rule.enabled}
              onChange={(enabled) => updateRule(rule.id, { enabled })}
              label={rule.name}
            />
            <p className="text-xs text-gray-500 font-mono">{rule.cron}</p>
            <p className="text-xs text-gray-400">{rule.prompt}</p>
            {rule.lastRunAt && (
              <p className="text-[10px] text-gray-600">Last run: {new Date(rule.lastRunAt).toLocaleString()}</p>
            )}
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-400 mb-2">Playbooks (NL triggers)</p>
        <ul className="space-y-1">
          {settings.playbooks.filter((p) => p.enabled).map((p) => (
            <li key={p.id} className="text-xs text-gray-400">
              <span className="text-gray-200">{p.name}</span> — {p.description}
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        disabled={saveMutation.isPending || !local}
        onClick={async () => {
          setSaving(true);
          await saveMutation.mutateAsync(settings);
          setSaving(false);
        }}
        className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save autopilot settings
      </button>
    </div>
  );
}
