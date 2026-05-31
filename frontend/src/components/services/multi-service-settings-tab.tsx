'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import {
  DEFAULT_MULTI_SERVICE_ADMIN_SETTINGS,
  type MultiServiceAdminSettings,
} from '@/lib/multi-service-booking';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

interface MultiServiceSettingsTabProps {
  businessId: string;
  services: Array<{ id: string; name: string }>;
}

export function MultiServiceSettingsTab({ businessId, services }: MultiServiceSettingsTabProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<MultiServiceAdminSettings>(DEFAULT_MULTI_SERVICE_ADMIN_SETTINGS);
  const [pairA, setPairA] = useState('');
  const [pairB, setPairB] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['multi-service-settings', businessId],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${businessId}/multi-service/settings`);
      return unwrap<MultiServiceAdminSettings>(res);
    },
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: res } = await api.put(`/businesses/${businessId}/multi-service/settings`, form);
      return unwrap<MultiServiceAdminSettings>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['multi-service-settings', businessId] });
    },
  });

  const addPair = () => {
    if (!pairA || !pairB || pairA === pairB) return;
    const key = pairA < pairB ? `${pairA}|${pairB}` : `${pairB}|${pairA}`;
    const exists = form.incompatiblePairs.some(([a, b]) => {
      const existing = a < b ? `${a}|${b}` : `${b}|${a}`;
      return existing === key;
    });
    if (exists) return;
    setForm({
      ...form,
      incompatiblePairs: [...form.incompatiblePairs, pairA < pairB ? [pairA, pairB] : [pairB, pairA]],
    });
    setPairA('');
    setPairB('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 py-12 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t('servicesPage.multiServiceTitle')}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('servicesPage.multiServiceSubtitle')}</p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
        />
        {t('servicesPage.multiServiceEnabled')}
      </label>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="label">{t('servicesPage.multiServiceMaxCount')}</label>
          <input
            type="number"
            min={2}
            className="input"
            value={form.maxServiceCount}
            onChange={(e) => setForm({ ...form, maxServiceCount: parseInt(e.target.value, 10) || 2 })}
          />
        </div>
        <div>
          <label className="label">{t('servicesPage.multiServiceMaxDuration')}</label>
          <input
            type="number"
            min={15}
            className="input"
            value={form.maxDurationMinutes}
            onChange={(e) =>
              setForm({ ...form, maxDurationMinutes: parseInt(e.target.value, 10) || 180 })
            }
          />
        </div>
        <div>
          <label className="label">{t('servicesPage.multiServiceTurnover')}</label>
          <input
            type="number"
            min={0}
            className="input"
            value={form.turnoverBufferMinutes}
            onChange={(e) =>
              setForm({ ...form, turnoverBufferMinutes: parseInt(e.target.value, 10) || 0 })
            }
          />
        </div>
        <div>
          <label className="label">{t('servicesPage.multiServiceSchedulingMode')}</label>
          <select
            className="input"
            value={form.schedulingMode}
            onChange={(e) =>
              setForm({
                ...form,
                schedulingMode: e.target.value as MultiServiceAdminSettings['schedulingMode'],
              })
            }
          >
            <option value="same_visit">{t('servicesPage.multiServiceModeSameVisit')}</option>
            <option value="per_service">{t('servicesPage.multiServiceModePerService')}</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-gray-800 p-4 space-y-3">
        <p className="text-sm font-medium">{t('servicesPage.multiServiceIncompatible')}</p>
        <div className="flex flex-wrap gap-2 items-end">
          <select className="input max-w-xs" value={pairA} onChange={(e) => setPairA(e.target.value)}>
            <option value="">Service A</option>
            {services.map((svc) => (
              <option key={svc.id} value={svc.id}>
                {svc.name}
              </option>
            ))}
          </select>
          <select className="input max-w-xs" value={pairB} onChange={(e) => setPairB(e.target.value)}>
            <option value="">Service B</option>
            {services.map((svc) => (
              <option key={svc.id} value={svc.id}>
                {svc.name}
              </option>
            ))}
          </select>
          <button type="button" className="btn-secondary text-sm" onClick={addPair}>
            {t('servicesPage.multiServiceAddPair')}
          </button>
        </div>
        {form.incompatiblePairs.length > 0 && (
          <ul className="text-sm text-gray-400 space-y-1">
            {form.incompatiblePairs.map(([a, b]) => (
              <li key={`${a}-${b}`}>
                {services.find((s) => s.id === a)?.name ?? a} +{' '}
                {services.find((s) => s.id === b)?.name ?? b}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="btn-primary"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending ? t('common.saving') : t('common.save')}
        </button>
      </div>
    </div>
  );
}
