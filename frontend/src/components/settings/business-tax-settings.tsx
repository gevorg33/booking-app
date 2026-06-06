'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import {
  DEFAULT_BUSINESS_TAX_SETTINGS,
  createEmptyTaxRule,
  getEffectiveTaxRate,
  readBusinessTaxSettings,
  sumTaxRuleRates,
  type TaxPricingModel,
  type TaxRule,
} from '@/lib/business-tax';
import { fetchBusinessSettings, unwrapBusinessApiPayload } from '@/lib/business-query';
import { ToggleChoice } from '@/components/ui/radio-choice';

function parseRuleRate(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function BusinessTaxSettings({ businessId }: { businessId: string }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = useState(DEFAULT_BUSINESS_TAX_SETTINGS.enabled);
  const [name, setName] = useState(DEFAULT_BUSINESS_TAX_SETTINGS.name);
  const [rate, setRate] = useState(String(DEFAULT_BUSINESS_TAX_SETTINGS.rate));
  const [model, setModel] = useState<TaxPricingModel>(DEFAULT_BUSINESS_TAX_SETTINGS.model);
  const [taxNumber, setTaxNumber] = useState(DEFAULT_BUSINESS_TAX_SETTINGS.taxNumber);
  const [useStackedRules, setUseStackedRules] = useState(false);
  const [rules, setRules] = useState<TaxRule[]>([
    createEmptyTaxRule(0),
    createEmptyTaxRule(1),
  ]);
  const [saved, setSaved] = useState(false);

  const { data: businessData, isLoading } = useQuery({
    queryKey: ['business', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}`);
      return unwrapBusinessApiPayload<{ settings?: Record<string, unknown> }>(data);
    },
  });

  useEffect(() => {
    if (!businessData?.settings) return;
    const tax = readBusinessTaxSettings(businessData.settings);
    const stacked = (tax.rules?.length ?? 0) > 0;
    queueMicrotask(() => {
      setEnabled(tax.enabled);
      setName(tax.name);
      setRate(String(tax.rate));
      setModel(tax.model);
      setTaxNumber(tax.taxNumber);
      setUseStackedRules(stacked);
      if (stacked && tax.rules) {
        setRules(tax.rules);
      }
    });
  }, [businessData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const current = await fetchBusinessSettings(businessId);
      const parsedRate = Number(rate);
      const activeRules = useStackedRules
        ? rules
            .map((rule, index) => ({
              id: rule.id || `rule-${index + 1}`,
              name: rule.name.trim() || 'VAT',
              rate: parseRuleRate(String(rule.rate)),
            }))
            .filter((rule) => rule.rate > 0)
        : [];
      const effectiveRate = useStackedRules
        ? sumTaxRuleRates(activeRules)
        : Number.isFinite(parsedRate)
          ? parsedRate
          : 0;

      const { data } = await api.put(`/businesses/${businessId}`, {
        settings: {
          ...current,
          tax: {
            enabled,
            name: name.trim() || 'VAT',
            rate: effectiveRate,
            model,
            taxNumber: taxNumber.trim(),
            ...(activeRules.length > 0 ? { rules: activeRules } : {}),
          },
        },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-settings', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-profile', businessId] });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    },
  });

  const effectiveRate = useStackedRules
    ? sumTaxRuleRates(
        rules.map((rule) => ({
          ...rule,
          rate: parseRuleRate(String(rule.rate)),
        })),
      )
    : Number(rate);

  const validationError = enabled
    ? !Number.isFinite(effectiveRate) || effectiveRate <= 0
      ? t('settings.taxRateRequired')
      : useStackedRules &&
          rules.every((rule) => parseRuleRate(String(rule.rate)) <= 0)
        ? t('settings.taxStackedRateRequired')
        : null
    : null;

  const updateRule = (index: number, patch: Partial<TaxRule>) => {
    setRules((current) =>
      current.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, ...patch } : rule,
      ),
    );
  };

  const addRule = () => {
    setRules((current) => [...current, createEmptyTaxRule(current.length)]);
  };

  const removeRule = (index: number) => {
    setRules((current) =>
      current.length <= 1 ? current : current.filter((_, ruleIndex) => ruleIndex !== index),
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">
          {t('settings.taxSection')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('settings.taxDescription')}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
        </div>
      ) : (
        <>
          <div className="space-y-1 divide-y divide-gray-100 dark:divide-gray-800">
            <ToggleChoice
              variant="dashboard"
              layout="toggle-first"
              checked={enabled}
              disabled={saveMutation.isPending}
              onChange={setEnabled}
              label={t('settings.taxEnabled')}
            />
            <ToggleChoice
              variant="dashboard"
              layout="toggle-first"
              checked={useStackedRules}
              disabled={saveMutation.isPending || !enabled}
              onChange={setUseStackedRules}
              label={t('settings.taxStackedEnabled')}
            />
          </div>

          {useStackedRules ? (
            <div className="space-y-3 max-w-2xl">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('settings.taxStackedDescription')}
              </p>
              {rules.map((rule, index) => (
                <div
                  key={rule.id}
                  className="grid gap-3 sm:grid-cols-[1fr_120px_auto] items-end border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                >
                  <div>
                    <label className="label" htmlFor={`business-tax-rule-name-${index}`}>
                      {t('settings.taxName')}
                    </label>
                    <input
                      id={`business-tax-rule-name-${index}`}
                      className="input w-full"
                      value={rule.name}
                      disabled={saveMutation.isPending || !enabled}
                      onChange={(e) => updateRule(index, { name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor={`business-tax-rule-rate-${index}`}>
                      {t('settings.taxRate')}
                    </label>
                    <input
                      id={`business-tax-rule-rate-${index}`}
                      className="input w-full"
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={rule.rate}
                      disabled={saveMutation.isPending || !enabled}
                      onChange={(e) =>
                        updateRule(index, { rate: parseRuleRate(e.target.value) })
                      }
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-secondary text-sm px-3 py-2"
                    disabled={saveMutation.isPending || !enabled || rules.length <= 1}
                    onClick={() => removeRule(index)}
                    aria-label={t('settings.taxRemoveRule')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn-secondary text-sm inline-flex items-center gap-2"
                disabled={saveMutation.isPending || !enabled}
                onClick={addRule}
              >
                <Plus className="w-4 h-4" />
                {t('settings.taxAddRule')}
              </button>
              <p className="text-xs text-gray-500">
                {t('settings.taxStackedEffectiveRate', {
                  rate: String(getEffectiveTaxRate({ rate: 0, rules })),
                })}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
              <div>
                <label className="label" htmlFor="business-tax-name">
                  {t('settings.taxName')}
                </label>
                <input
                  id="business-tax-name"
                  className="input w-full"
                  value={name}
                  disabled={saveMutation.isPending || !enabled}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VAT"
                />
              </div>
              <div>
                <label className="label" htmlFor="business-tax-rate">
                  {t('settings.taxRate')}
                </label>
                <input
                  id="business-tax-rate"
                  className="input w-full"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={rate}
                  disabled={saveMutation.isPending || !enabled}
                  onChange={(e) => setRate(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
            <div>
              <label className="label" htmlFor="business-tax-model">
                {t('settings.taxModel')}
              </label>
              <select
                id="business-tax-model"
                className="input w-full"
                value={model}
                disabled={saveMutation.isPending || !enabled}
                onChange={(e) => setModel(e.target.value as TaxPricingModel)}
              >
                <option value="exclusive">{t('settings.taxModelExclusive')}</option>
                <option value="inclusive">{t('settings.taxModelInclusive')}</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="business-tax-number">
                {t('settings.taxNumber')}
              </label>
              <input
                id="business-tax-number"
                className="input w-full"
                value={taxNumber}
                disabled={saveMutation.isPending}
                onChange={(e) => setTaxNumber(e.target.value)}
                placeholder="GB123456789"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">{t('settings.taxHint')}</p>

          {validationError && (
            <p className="text-sm text-amber-700 dark:text-amber-300">{validationError}</p>
          )}

          <button
            type="button"
            className="btn-primary text-sm"
            disabled={saveMutation.isPending || Boolean(validationError)}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? t('common.saving') : t('settings.saveTax')}
          </button>
          {saved && (
            <p className="text-sm text-green-600 dark:text-green-400">
              {t('settings.taxSaved')}
            </p>
          )}
        </>
      )}
    </div>
  );
}
