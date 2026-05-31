'use client';

import { useEffect, useState } from 'react';
import { Loader2, Mail, Users } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

interface MarketingAutomationSettings {
  postVisitReviewEnabled: boolean;
  reEngagementEnabled: boolean;
  inactiveDaysThreshold: number;
  reEngagementEmailEnabled: boolean;
  reEngagementSmsEnabled: boolean;
  minDaysBetweenReEngagement: number;
  reEngagementPromoCode?: string | null;
}

interface MarketingSummary {
  settings: MarketingAutomationSettings;
  eligibleInactiveCustomers: number;
  reEngagementSentLast30Days: number;
}

export function MarketingAutomationSettingsPanel() {
  const { business } = useAuthStore();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<MarketingAutomationSettings | null>(null);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['marketing-automation-summary', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}/marketing-automation/summary`);
      return unwrap<MarketingSummary>(data);
    },
    enabled: !!business?.id,
  });

  useEffect(() => {
    if (summary?.settings) {
      setForm(summary.settings);
    }
  }, [summary]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put(`/businesses/${business!.id}/marketing-automation/settings`, form);
      return unwrap<{ settings: MarketingAutomationSettings }>(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['marketing-automation-summary', business?.id] });
    },
  });

  if (isLoading || !form) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-100">{t('marketingAutomation.title')}</h2>
        <p className="text-sm text-gray-400 mt-1">{t('marketingAutomation.subtitle')}</p>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card flex items-start gap-3">
            <Users className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-2xl font-bold text-gray-100">{summary.eligibleInactiveCustomers}</p>
              <p className="text-sm text-gray-400">{t('marketingAutomation.eligibleInactive')}</p>
            </div>
          </div>
          <div className="card flex items-start gap-3">
            <Mail className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-2xl font-bold text-gray-100">{summary.reEngagementSentLast30Days}</p>
              <p className="text-sm text-gray-400">{t('marketingAutomation.sentLast30Days')}</p>
            </div>
          </div>
        </div>
      )}

      <section className="card space-y-4">
        <h3 className="font-semibold text-gray-100">{t('marketingAutomation.postVisitTitle')}</h3>
        <label className="flex items-start gap-3 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={form.postVisitReviewEnabled}
            onChange={(e) => setForm({ ...form, postVisitReviewEnabled: e.target.checked })}
            className="mt-1"
          />
          <span>{t('marketingAutomation.postVisitReview')}</span>
        </label>
      </section>

      <section className="card space-y-4">
        <h3 className="font-semibold text-gray-100">{t('marketingAutomation.reEngagementTitle')}</h3>
        <p className="text-sm text-gray-400">{t('marketingAutomation.reEngagementHint')}</p>
        <label className="flex items-start gap-3 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={form.reEngagementEnabled}
            onChange={(e) => setForm({ ...form, reEngagementEnabled: e.target.checked })}
            className="mt-1"
          />
          <span>{t('marketingAutomation.reEngagementEnabled')}</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">{t('marketingAutomation.inactiveDays')}</label>
            <input
              type="number"
              min={30}
              max={365}
              className="input"
              value={form.inactiveDaysThreshold}
              onChange={(e) =>
                setForm({ ...form, inactiveDaysThreshold: parseInt(e.target.value, 10) || 90 })
              }
            />
          </div>
          <div>
            <label className="label">{t('marketingAutomation.minDaysBetween')}</label>
            <input
              type="number"
              min={7}
              max={180}
              className="input"
              value={form.minDaysBetweenReEngagement}
              onChange={(e) =>
                setForm({
                  ...form,
                  minDaysBetweenReEngagement: parseInt(e.target.value, 10) || 30,
                })
              }
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={form.reEngagementEmailEnabled}
              onChange={(e) => setForm({ ...form, reEngagementEmailEnabled: e.target.checked })}
            />
            {t('marketingAutomation.channelEmail')}
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={form.reEngagementSmsEnabled}
              onChange={(e) => setForm({ ...form, reEngagementSmsEnabled: e.target.checked })}
            />
            {t('marketingAutomation.channelSms')}
          </label>
        </div>

        <div>
          <label className="label">{t('marketingAutomation.promoCodeOptional')}</label>
          <input
            className="input uppercase"
            placeholder="WINBACK10"
            value={form.reEngagementPromoCode ?? ''}
            onChange={(e) =>
              setForm({ ...form, reEngagementPromoCode: e.target.value.toUpperCase() || null })
            }
          />
        </div>
      </section>

      <button
        type="button"
        className="btn-primary"
        disabled={saveMutation.isPending}
        onClick={() => saveMutation.mutate()}
      >
        {saveMutation.isPending ? t('common.saving') : t('common.saveChanges')}
      </button>
    </div>
  );
}
