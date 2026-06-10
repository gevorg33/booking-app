'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Users } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { fetchBusinessSettings, unwrapBusinessApiPayload } from '@/lib/business-query';
import { useI18n } from '@/i18n';
import { ToggleChoice } from '@/components/ui/radio-choice';
import { useBusinessCurrency } from '@/hooks/use-business-currency';
import { usePlanEntitlements, canUseFeature } from '@/lib/use-plan-entitlements';
import {
  buildReferralProgramSavePayload,
  describeReferrerReward,
  readReferralProgramForm,
  type ReferralProgramFormState,
  type ReferrerRewardType,
} from '@/lib/referral-program-settings.util';
import {
  buildShareRewardsSavePayload,
  describeShareReward,
  readShareRewardsForm,
  type ShareRewardsFormState,
  type ShareRewardKind,
} from '@/lib/share-rewards-settings.util';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

export function DashboardReferralProgramTab({ businessId }: { businessId: string }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { formatMoney } = useBusinessCurrency();
  const { data: entitlements } = usePlanEntitlements(businessId);
  const giftCardsAllowed = canUseFeature(entitlements, 'giftCards');
  const loyaltyAllowed = canUseFeature(entitlements, 'loyalty');

  const [form, setForm] = useState<ReferralProgramFormState>(() => readReferralProgramForm());
  const [shareForm, setShareForm] = useState<ShareRewardsFormState>(() => readShareRewardsForm());
  const [saved, setSaved] = useState(false);

  const { data: businessData, isLoading } = useQuery({
    queryKey: ['business', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}`);
      return unwrapBusinessApiPayload<{ settings?: Record<string, unknown> }>(data);
    },
  });

  const { data: promoCodes = [] } = useQuery({
    queryKey: ['promo-codes', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/promo-codes`);
      return unwrap<Array<{ code: string; isActive?: boolean }>>(data);
    },
  });

  useEffect(() => {
    if (businessData?.settings) {
      queueMicrotask(() => {
        setForm(readReferralProgramForm(businessData.settings));
        setShareForm(readShareRewardsForm(businessData.settings));
      });
    }
  }, [businessData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const current = await fetchBusinessSettings(businessId);
      const { data } = await api.put(`/businesses/${businessId}`, {
        settings: {
          ...current,
          referralProgram: buildReferralProgramSavePayload(form),
          shareRewards: buildShareRewardsSavePayload(shareForm),
        },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', businessId] });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    },
  });

  const referrerPreview = useMemo(
    () => describeReferrerReward(form, (amount) => formatMoney(amount)),
    [form, formatMoney],
  );

  const salonSharePreview = useMemo(
    () => describeShareReward(shareForm.salon, (amount) => formatMoney(amount)),
    [shareForm.salon, formatMoney],
  );

  const bookingSharePreview = useMemo(
    () => describeShareReward(shareForm.booking, (amount) => formatMoney(amount)),
    [shareForm.booking, formatMoney],
  );

  const activePromoCodes = promoCodes.filter((code) => code.isActive !== false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-8">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-400" />
          {t('monetization.referralProgramTitle')}
        </h2>
        <p className="text-sm text-gray-400 mt-1">{t('monetization.referralProgramSubtitle')}</p>
      </div>

      <form
        className="card space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
      >
        <ToggleChoice
          variant="dashboard"
          checked={form.enabled}
          onChange={(enabled) => setForm({ ...form, enabled })}
          label={t('monetization.referralProgramEnabled')}
        />

        <fieldset className="space-y-3">
          <legend className="label">{t('monetization.referralReferrerReward')}</legend>
          <p className="text-xs text-gray-500">{t('monetization.referralReferrerRewardHint')}</p>

          <div className="flex flex-wrap gap-3">
            {(['loyalty_points', 'gift_card'] as ReferrerRewardType[]).map((type) => {
              const disabled =
                (type === 'loyalty_points' && !loyaltyAllowed) ||
                (type === 'gift_card' && !giftCardsAllowed);
              return (
                <label
                  key={type}
                  className={`flex items-center gap-2 text-sm ${disabled ? 'opacity-50' : ''}`}
                >
                  <input
                    type="radio"
                    name="referrerRewardType"
                    checked={form.referrerRewardType === type}
                    disabled={disabled}
                    onChange={() => setForm({ ...form, referrerRewardType: type })}
                  />
                  {type === 'loyalty_points'
                    ? t('monetization.referralRewardLoyalty')
                    : t('monetization.referralRewardGiftCard')}
                </label>
              );
            })}
          </div>

          {form.referrerRewardType === 'loyalty_points' ? (
            <div>
              <label className="label">{t('monetization.referralLoyaltyPoints')}</label>
              <input
                type="number"
                min={0}
                max={500}
                className="input max-w-[160px]"
                value={form.referrerBonusPoints}
                onChange={(e) =>
                  setForm({ ...form, referrerBonusPoints: Number(e.target.value) || 0 })
                }
                disabled={!loyaltyAllowed}
              />
            </div>
          ) : (
            <div>
              <label className="label">{t('monetization.referralGiftCardAmount')}</label>
              <input
                type="number"
                min={1}
                max={500}
                step="0.01"
                className="input max-w-[160px]"
                value={form.referrerGiftCardAmount}
                onChange={(e) =>
                  setForm({ ...form, referrerGiftCardAmount: Number(e.target.value) || 1 })
                }
                disabled={!giftCardsAllowed}
              />
              {!giftCardsAllowed ? (
                <p className="text-xs text-amber-400 mt-1">
                  {t('monetization.referralGiftCardUpgradeHint')}
                </p>
              ) : null}
            </div>
          )}
        </fieldset>

        <fieldset className="space-y-3 border-t border-gray-800 pt-4">
          <legend className="label">{t('monetization.referralRefereeReward')}</legend>
          <p className="text-xs text-gray-500">{t('monetization.referralRefereeRewardHint')}</p>
          <div>
            <label className="label">{t('monetization.referralRefereeBonusPoints')}</label>
            <input
              type="number"
              min={0}
              max={500}
              className="input max-w-[160px]"
              value={form.refereeBonusPoints}
              onChange={(e) =>
                setForm({ ...form, refereeBonusPoints: Number(e.target.value) || 0 })
              }
              disabled={!loyaltyAllowed}
            />
          </div>
          <div>
            <label className="label">{t('monetization.referralRefereePromoCode')}</label>
            <select
              className="input max-w-xs"
              value={form.refereePromoCode}
              onChange={(e) => setForm({ ...form, refereePromoCode: e.target.value })}
            >
              <option value="">{t('monetization.referralNoPromoCode')}</option>
              {activePromoCodes.map((promo) => (
                <option key={promo.code} value={promo.code}>
                  {promo.code}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {t('monetization.referralRefereePromoHint')}
            </p>
          </div>
        </fieldset>

        <p className="text-sm text-gray-400 bg-gray-900/40 rounded-lg px-3 py-2">
          {t('monetization.referralPreview')
            .replace('{referrerReward}', referrerPreview)
            .replace('{refereeBonus}', String(form.refereeBonusPoints))}
        </p>

        <fieldset className="space-y-4 border-t border-gray-800 pt-4">
          <legend className="text-base font-semibold">{t('monetization.shareRewardsTitle')}</legend>
          <p className="text-xs text-gray-500">{t('monetization.shareRewardsSubtitle')}</p>
          <ToggleChoice
            variant="dashboard"
            checked={shareForm.enabled}
            onChange={(enabled) => setShareForm({ ...shareForm, enabled })}
            label={t('monetization.shareRewardsEnabled')}
          />
          <div>
            <label className="label">{t('monetization.shareRewardsCooldown')}</label>
            <input
              type="number"
              min={1}
              max={168}
              className="input max-w-[160px]"
              value={shareForm.cooldownHours}
              onChange={(e) =>
                setShareForm({
                  ...shareForm,
                  cooldownHours: Number(e.target.value) || 24,
                })
              }
            />
          </div>

          {(['salon', 'booking'] as const).map((channel) => {
            const channelForm = shareForm[channel];
            const setChannel = (next: Partial<typeof channelForm>) =>
              setShareForm({ ...shareForm, [channel]: { ...channelForm, ...next } });
            return (
              <div key={channel} className="rounded-lg border border-gray-800 p-4 space-y-3">
                <ToggleChoice
                  variant="dashboard"
                  checked={channelForm.enabled}
                  onChange={(enabled) => setChannel({ enabled })}
                  label={
                    channel === 'salon'
                      ? t('monetization.shareSalonRewardEnabled')
                      : t('monetization.shareBookingRewardEnabled')
                  }
                />
                <div className="flex flex-wrap gap-3">
                  {(['loyalty_points', 'gift_card'] as ShareRewardKind[]).map((type) => {
                    const disabled =
                      (type === 'loyalty_points' && !loyaltyAllowed) ||
                      (type === 'gift_card' && !giftCardsAllowed);
                    return (
                      <label
                        key={type}
                        className={`flex items-center gap-2 text-sm ${disabled ? 'opacity-50' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`${channel}-rewardType`}
                          checked={channelForm.rewardType === type}
                          disabled={disabled}
                          onChange={() => setChannel({ rewardType: type })}
                        />
                        {type === 'loyalty_points'
                          ? t('monetization.referralRewardLoyalty')
                          : t('monetization.referralRewardGiftCard')}
                      </label>
                    );
                  })}
                </div>
                {channelForm.rewardType === 'loyalty_points' ? (
                  <input
                    type="number"
                    min={0}
                    max={500}
                    className="input max-w-[160px]"
                    value={channelForm.loyaltyPoints}
                    onChange={(e) =>
                      setChannel({ loyaltyPoints: Number(e.target.value) || 0 })
                    }
                    disabled={!loyaltyAllowed}
                  />
                ) : (
                  <input
                    type="number"
                    min={1}
                    max={500}
                    step="0.01"
                    className="input max-w-[160px]"
                    value={channelForm.giftCardAmount}
                    onChange={(e) =>
                      setChannel({ giftCardAmount: Number(e.target.value) || 1 })
                    }
                    disabled={!giftCardsAllowed}
                  />
                )}
              </div>
            );
          })}

          <p className="text-sm text-gray-400 bg-gray-900/40 rounded-lg px-3 py-2">
            {t('monetization.shareRewardsPreview')
              .replace('{salonReward}', salonSharePreview)
              .replace('{bookingReward}', bookingSharePreview)}
          </p>
        </fieldset>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saveMutation.isPending} className="btn-primary">
            {saveMutation.isPending ? t('monetization.saving') : t('monetization.saveSettings')}
          </button>
          {saved ? (
            <span className="text-sm text-green-500">{t('monetization.referralSaved')}</span>
          ) : null}
        </div>
      </form>
    </div>
  );
}
