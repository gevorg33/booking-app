'use client';

import { useEffect, useState } from 'react';
import { Loader2, Mail, Users } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';
import { ToggleChoice, StylishChoice } from '@/components/ui/radio-choice';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

interface MarketingAutomationSettings {
  postVisitReviewEnabled: boolean;
  reEngagementEnabled: boolean;
  inactiveDaysThreshold: number;
  reEngagementEmailEnabled: boolean;
  reEngagementSmsEnabled: boolean;
  reEngagementPushEnabled: boolean;
  minDaysBetweenReEngagement: number;
  reEngagementPromoCode?: string | null;
  reEngagementLoyaltyBonusPoints?: number | null;
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
      queueMicrotask(() => setForm(summary.settings));
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
        <ToggleChoice variant="dashboard"
          checked={form.postVisitReviewEnabled}
          onChange={(postVisitReviewEnabled) => setForm({ ...form, postVisitReviewEnabled })}
          label={t('marketingAutomation.postVisitReview')}
        />
      </section>

      <section className="card space-y-4">
        <h3 className="font-semibold text-gray-100">{t('marketingAutomation.reEngagementTitle')}</h3>
        <p className="text-sm text-gray-400">{t('marketingAutomation.reEngagementHint')}</p>
        <ToggleChoice variant="dashboard"
          checked={form.reEngagementEnabled}
          onChange={(reEngagementEnabled) => setForm({ ...form, reEngagementEnabled })}
          label={t('marketingAutomation.reEngagementEnabled')}
        />

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
          <StylishChoice
            type="checkbox"
            checked={form.reEngagementEmailEnabled}
            onChange={(reEngagementEmailEnabled) =>
              setForm({ ...form, reEngagementEmailEnabled })
            }
            label={t('marketingAutomation.channelEmail')}
            labelClassName="text-sm text-gray-300"
          />
          <StylishChoice
            type="checkbox"
            checked={form.reEngagementSmsEnabled}
            onChange={(reEngagementSmsEnabled) => setForm({ ...form, reEngagementSmsEnabled })}
            label={t('marketingAutomation.channelSms')}
            labelClassName="text-sm text-gray-300"
          />
          <StylishChoice
            type="checkbox"
            checked={form.reEngagementPushEnabled}
            onChange={(reEngagementPushEnabled) =>
              setForm({ ...form, reEngagementPushEnabled })
            }
            label={t('marketingAutomation.channelPush')}
            labelClassName="text-sm text-gray-300"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div>
            <label className="label">{t('marketingAutomation.loyaltyBonusOptional')}</label>
            <input
              type="number"
              min={1}
              max={500}
              className="input"
              placeholder="5"
              value={form.reEngagementLoyaltyBonusPoints ?? ''}
              onChange={(e) => {
                const raw = e.target.value.trim();
                setForm({
                  ...form,
                  reEngagementLoyaltyBonusPoints: raw ? parseInt(raw, 10) || null : null,
                });
              }}
            />
          </div>
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
