'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { ToggleChoice } from '@/components/ui/radio-choice';
import {
  DEFAULT_MULTI_SERVICE_ADMIN_SETTINGS,
  UNCATEGORIZED_CATEGORY_KEY,
  type IncompatiblePairMode,
  type MultiServiceAdminSettings,
} from '@/lib/multi-service-booking';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

function normalizePair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function pairKey(a: string, b: string) {
  const [x, y] = normalizePair(a, b);
  return `${x}|${y}`;
}

interface MultiServiceSettingsTabProps {
  businessId: string;
  services: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
}

export function MultiServiceSettingsTab({
  businessId,
  services,
  categories,
}: MultiServiceSettingsTabProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<MultiServiceAdminSettings>(DEFAULT_MULTI_SERVICE_ADMIN_SETTINGS);
  const [pairA, setPairA] = useState('');
  const [pairB, setPairB] = useState('');

  const categoryOptions = useMemo(
    () => [
      { id: UNCATEGORIZED_CATEGORY_KEY, name: t('servicesPage.multiServiceUncategorized') },
      ...categories,
    ],
    [categories, t],
  );

  const { data, isLoading } = useQuery({
    queryKey: ['multi-service-settings', businessId],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${businessId}/multi-service/settings`);
      return unwrap<MultiServiceAdminSettings>(res);
    },
  });

  useEffect(() => {
    if (data) {
      queueMicrotask(() =>
        setForm({
          ...DEFAULT_MULTI_SERVICE_ADMIN_SETTINGS,
          ...data,
          incompatiblePairMode: data.incompatiblePairMode ?? 'service',
          incompatibleCategoryPairs: data.incompatibleCategoryPairs ?? [],
        }),
      );
    }
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

  const activePairs =
    form.incompatiblePairMode === 'category'
      ? form.incompatibleCategoryPairs
      : form.incompatiblePairs;

  const addPair = () => {
    if (!pairA || !pairB || pairA === pairB) return;
    const key = pairKey(pairA, pairB);
    if (activePairs.some(([a, b]) => pairKey(a, b) === key)) return;

    if (form.incompatiblePairMode === 'category') {
      setForm({
        ...form,
        incompatibleCategoryPairs: [
          ...form.incompatibleCategoryPairs,
          normalizePair(pairA, pairB),
        ],
      });
    } else {
      setForm({
        ...form,
        incompatiblePairs: [...form.incompatiblePairs, normalizePair(pairA, pairB)],
      });
    }
    setPairA('');
    setPairB('');
  };

  const removePair = (index: number) => {
    if (form.incompatiblePairMode === 'category') {
      setForm({
        ...form,
        incompatibleCategoryPairs: form.incompatibleCategoryPairs.filter((_, i) => i !== index),
      });
    } else {
      setForm({
        ...form,
        incompatiblePairs: form.incompatiblePairs.filter((_, i) => i !== index),
      });
    }
  };

  const resolvePairLabel = (a: string, b: string) => {
    if (form.incompatiblePairMode === 'category') {
      const nameA = categoryOptions.find((cat) => cat.id === a)?.name ?? a;
      const nameB = categoryOptions.find((cat) => cat.id === b)?.name ?? b;
      return `${nameA} + ${nameB}`;
    }
    const nameA = services.find((svc) => svc.id === a)?.name ?? a;
    const nameB = services.find((svc) => svc.id === b)?.name ?? b;
    return `${nameA} + ${nameB}`;
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

      <ToggleChoice variant="dashboard"
        checked={form.enabled}
        onChange={(enabled) => setForm({ ...form, enabled })}
        label={t('servicesPage.multiServiceEnabled')}
      />

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

      <div className="rounded-lg border border-gray-800 p-4 space-y-4">
        <div>
          <p className="text-sm font-medium">{t('servicesPage.multiServiceIncompatible')}</p>
          <p className="text-xs text-gray-500 mt-1">{t('servicesPage.multiServiceIncompatibleHint')}</p>
        </div>

        <div>
          <label className="label">{t('servicesPage.multiServiceIncompatibleMode')}</label>
          <select
            className="input max-w-md"
            value={form.incompatiblePairMode}
            onChange={(e) => {
              setPairA('');
              setPairB('');
              setForm({
                ...form,
                incompatiblePairMode: e.target.value as IncompatiblePairMode,
              });
            }}
          >
            <option value="service">{t('servicesPage.multiServiceIncompatibleByService')}</option>
            <option value="category">{t('servicesPage.multiServiceIncompatibleByCategory')}</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2 items-end">
          <select className="input max-w-xs" value={pairA} onChange={(e) => setPairA(e.target.value)}>
            <option value="">
              {form.incompatiblePairMode === 'category'
                ? t('servicesPage.multiServiceCategoryA')
                : t('servicesPage.multiServiceServiceA')}
            </option>
            {(form.incompatiblePairMode === 'category' ? categoryOptions : services).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select className="input max-w-xs" value={pairB} onChange={(e) => setPairB(e.target.value)}>
            <option value="">
              {form.incompatiblePairMode === 'category'
                ? t('servicesPage.multiServiceCategoryB')
                : t('servicesPage.multiServiceServiceB')}
            </option>
            {(form.incompatiblePairMode === 'category' ? categoryOptions : services).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <button type="button" className="btn-secondary text-sm" onClick={addPair}>
            {t('servicesPage.multiServiceAddPair')}
          </button>
        </div>

        {activePairs.length > 0 && (
          <ul className="text-sm text-gray-400 space-y-2">
            {activePairs.map(([a, b], index) => (
              <li key={`${a}-${b}`} className="flex items-center justify-between gap-3">
                <span>{resolvePairLabel(a, b)}</span>
                <button
                  type="button"
                  className="text-xs text-red-400 hover:text-red-300"
                  onClick={() => removePair(index)}
                >
                  {t('common.delete')}
                </button>
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
