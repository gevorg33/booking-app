'use client';

import { Building2, Loader2, Save } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';
import { useState } from 'react';

interface AiEnterpriseSettings {
  defaultLocationId?: string | null;
  hitlSlaMinutes?: number;
  verticalPlugin?: 'salon' | 'clinic' | 'fitness' | null;
  roleProfiles?: Record<string, string>;
  abExperiments?: Array<{ id: string; name: string; enabled: boolean }>;
}

interface AiSettings {
  enterprise?: AiEnterpriseSettings;
}

export function AiEnterpriseSettingsPanel() {
  const { t } = useI18n();
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

  const enterprise = data?.enterprise ?? {};

  const saveMutation = useMutation({
    mutationFn: async (patch: AiSettings) => {
      const { data: res } = await api.put(`/businesses/${business!.id}/ai/settings`, patch);
      return (res.data ?? res) as AiSettings;
    },
    onSuccess: (next) => {
      queryClient.setQueryData(['ai-settings', business?.id], next);
    },
  });

  if (isLoading || !data) {
    return (
      <div className="card flex items-center gap-2 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" /> {t('ai.enterpriseLoading')}
      </div>
    );
  }

  const abExperiment = enterprise.abExperiments?.[0];

  return (
    <div className="card space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Building2 className="w-5 h-5 text-sky-400" />
        {t('ai.enterpriseTitle')}
      </h2>

      <label className="block text-sm">
        <span className="text-gray-400">{t('ai.enterpriseDefaultBranch')}</span>
        <input
          className="input mt-1 w-full"
          placeholder={t('ai.enterpriseBranchPlaceholder')}
          defaultValue={enterprise.defaultLocationId ?? ''}
          onBlur={(e) => {
            enterprise.defaultLocationId = e.target.value.trim() || null;
          }}
        />
      </label>

      <label className="block text-sm">
        <span className="text-gray-400">{t('ai.enterpriseHitlSla')}</span>
        <input
          type="number"
          min={5}
          max={240}
          className="input mt-1 w-full"
          defaultValue={enterprise.hitlSlaMinutes ?? 30}
          onBlur={(e) => {
            enterprise.hitlSlaMinutes = Number(e.target.value) || 30;
          }}
        />
      </label>

      <label className="block text-sm">
        <span className="text-gray-400">{t('ai.enterpriseVertical')}</span>
        <select
          className="input mt-1 w-full"
          defaultValue={enterprise.verticalPlugin ?? ''}
          onChange={(e) => {
            enterprise.verticalPlugin = (e.target.value || null) as AiEnterpriseSettings['verticalPlugin'];
          }}
        >
          <option value="">{t('ai.enterpriseVerticalAuto')}</option>
          <option value="salon">Salon</option>
          <option value="clinic">Clinic</option>
          <option value="fitness">Fitness</option>
        </select>
      </label>

      {abExperiment && (
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            defaultChecked={abExperiment.enabled}
            onChange={(e) => {
              abExperiment.enabled = e.target.checked;
            }}
          />
          {t('ai.enterpriseAbExperiment', { name: abExperiment.name })}
        </label>
      )}

      <button
        type="button"
        disabled={saving || saveMutation.isPending}
        className="btn-primary text-sm flex items-center gap-2"
        onClick={async () => {
          setSaving(true);
          try {
            await saveMutation.mutateAsync({ enterprise });
          } finally {
            setSaving(false);
          }
        }}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {t('ai.enterpriseSave')}
      </button>
    </div>
  );
}
