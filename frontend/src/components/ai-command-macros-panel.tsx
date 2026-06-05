'use client';

import { Bookmark, Play, Plus, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';
import { fireOrchestrixRun, fireOrchestrixEdit } from '@/lib/orchestrix-events';
import { useState } from 'react';

export interface AiCommandMacro {
  id: string;
  name: string;
  prompt: string;
}

interface AiSettingsResponse {
  macros?: AiCommandMacro[];
}

export function AiCommandMacrosPanel({ compact }: { compact?: boolean }) {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');

  const { data: settings } = useQuery({
    queryKey: ['ai-settings', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}/ai/settings`);
      return (data.data ?? data) as AiSettingsResponse;
    },
    enabled: !!business?.id,
  });

  const macros = settings?.macros ?? [];

  const saveMutation = useMutation({
    mutationFn: async (next: AiCommandMacro[]) => {
      const { data } = await api.put(`/businesses/${business!.id}/ai/settings`, { macros: next });
      return data.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings', business?.id] });
      setName('');
      setPrompt('');
    },
  });

  const addMacro = () => {
    const trimmedName = name.trim();
    const trimmedPrompt = prompt.trim();
    if (!trimmedName || !trimmedPrompt) return;
    const id = `macro-${Date.now()}`;
    saveMutation.mutate([...macros, { id, name: trimmedName, prompt: trimmedPrompt }]);
  };

  const removeMacro = (id: string) => {
    saveMutation.mutate(macros.filter((m) => m.id !== id));
  };

  if (!business) return null;

  return (
    <div className={compact ? 'space-y-2' : 'card space-y-4'}>
      <p className={`font-semibold text-violet-300 flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
        <Bookmark className="w-4 h-4" />
        {t('ai.macrosTitle')}
      </p>
      {macros.length === 0 ? (
        <p className="text-xs text-gray-500">{t('ai.macrosEmpty')}</p>
      ) : (
        <ul className="space-y-1.5">
          {macros.map((macro) => (
            <li
              key={macro.id}
              className="flex items-center gap-1 rounded-md border border-gray-700 bg-gray-800/50 px-2 py-1.5"
            >
              <span className="flex-1 min-w-0 text-xs text-gray-200 truncate">{macro.name}</span>
              <button
                type="button"
                title={t('ai.suggestionRun')}
                onClick={() => fireOrchestrixRun(macro.prompt, true)}
                className="p-1 text-violet-300 hover:text-violet-100"
              >
                <Play className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title={t('ai.suggestionEdit')}
                onClick={() => fireOrchestrixEdit(macro.prompt)}
                className="p-1 text-gray-400 hover:text-gray-200 text-[10px]"
              >
                {t('ai.suggestionEdit')}
              </button>
              <button
                type="button"
                onClick={() => removeMacro(macro.id)}
                className="p-1 text-gray-500 hover:text-red-400"
                aria-label={t('ai.macroDelete')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {!compact && (
        <div className="space-y-2 border-t border-gray-800 pt-3">
          <p className="text-xs text-gray-500">{t('ai.macroAddHint')}</p>
          <input
            className="input w-full text-sm"
            placeholder={t('ai.macroNamePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            className="input w-full text-sm min-h-[4rem]"
            placeholder={t('ai.macroPromptPlaceholder')}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            type="button"
            onClick={addMacro}
            disabled={saveMutation.isPending}
            className="btn-secondary text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            {t('ai.macroSave')}
          </button>
        </div>
      )}
    </div>
  );
}
