'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { fetchBusinessSettings, unwrapBusinessApiPayload } from '@/lib/business-query';
import { ToggleChoice } from '@/components/ui/radio-choice';
import {
  createEmptyStaffMessageTemplate,
  normalizeStaffMessageTemplatesSettings,
  readStaffMessageTemplatesSettings,
  seedDefaultStaffMessageTemplates,
  STAFF_MESSAGE_TEMPLATE_BODY_MAX,
  STAFF_MESSAGE_TEMPLATE_LABEL_MAX,
  STAFF_MESSAGE_TEMPLATE_MAX_COUNT,
  type StaffMessageTemplate,
  type StaffMessageTemplatesSettings,
} from '@/lib/staff-message-templates.util';

export function StaffMessageTemplatesSettings({
  businessId,
}: {
  businessId: string;
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<StaffMessageTemplatesSettings>({
    enabled: false,
    templates: [],
  });
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
    queueMicrotask(() => {
      setForm(readStaffMessageTemplatesSettings(businessData.settings));
    });
  }, [businessData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const current = await fetchBusinessSettings(businessId);
      const normalized = normalizeStaffMessageTemplatesSettings(form);
      const { data } = await api.put(`/businesses/${businessId}`, {
        settings: {
          ...current,
          staffMessageTemplates: normalized,
        },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-settings', businessId] });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    },
  });

  const updateTemplate = (
    index: number,
    patch: Partial<StaffMessageTemplate>,
  ) => {
    setForm((prev) => ({
      ...prev,
      templates: prev.templates.map((row, i) =>
        i === index ? { ...row, ...patch } : row,
      ),
    }));
  };

  const removeTemplate = (index: number) => {
    setForm((prev) => ({
      ...prev,
      templates: prev.templates.filter((_, i) => i !== index),
    }));
  };

  const addTemplate = () => {
    setForm((prev) => {
      if (prev.templates.length >= STAFF_MESSAGE_TEMPLATE_MAX_COUNT) return prev;
      return {
        ...prev,
        templates: [...prev.templates, createEmptyStaffMessageTemplate()],
      };
    });
  };

  const loadDefaults = () => {
    setForm((prev) => ({
      ...prev,
      enabled: true,
      templates: seedDefaultStaffMessageTemplates(),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-4 space-y-4">
      <div>
        <h3 className="font-medium text-gray-900 dark:text-gray-100">
          {t('settings.staffMessageTemplatesTitle')}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('settings.staffMessageTemplatesDescription')}
        </p>
      </div>

      <ToggleChoice
        variant="dashboard"
        layout="toggle-first"
        label={t('settings.staffMessageTemplatesEnabled')}
        checked={form.enabled}
        onChange={(enabled) => setForm((prev) => ({ ...prev, enabled }))}
      />

      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t('settings.staffMessageTemplatesPlaceholders')}
      </p>

      <div className="space-y-3">
        {form.templates.map((template, index) => (
          <div
            key={template.id}
            className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-2"
          >
            <div className="flex items-start gap-2">
              <input
                type="text"
                value={template.label}
                maxLength={STAFF_MESSAGE_TEMPLATE_LABEL_MAX}
                placeholder={t('settings.staffMessageTemplatesLabelPlaceholder')}
                onChange={(event) =>
                  updateTemplate(index, { label: event.target.value })
                }
                className="flex-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
              <button
                type="button"
                aria-label={t('settings.staffMessageTemplatesRemove')}
                onClick={() => removeTemplate(index)}
                className="p-2 text-gray-500 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={template.body}
              maxLength={STAFF_MESSAGE_TEMPLATE_BODY_MAX}
              rows={3}
              placeholder={t('settings.staffMessageTemplatesBodyPlaceholder')}
              onChange={(event) =>
                updateTemplate(index, { body: event.target.value })
              }
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            />
            <ToggleChoice
              variant="dashboard"
              layout="toggle-first"
              label={t('settings.staffMessageTemplatesRowEnabled')}
              checked={template.enabled}
              onChange={(enabled) => updateTemplate(index, { enabled })}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addTemplate}
          disabled={form.templates.length >= STAFF_MESSAGE_TEMPLATE_MAX_COUNT}
          className="btn-secondary text-sm inline-flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          {t('settings.staffMessageTemplatesAdd')}
        </button>
        <button
          type="button"
          onClick={loadDefaults}
          className="btn-secondary text-sm"
        >
          {t('settings.staffMessageTemplatesLoadDefaults')}
        </button>
      </div>

      <button
        type="button"
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="btn-primary text-sm"
      >
        {saveMutation.isPending
          ? t('common.saving')
          : t('settings.staffMessageTemplatesSave')}
      </button>
      {saved ? (
        <p className="text-sm text-green-600 dark:text-green-400">
          {t('settings.staffMessageTemplatesSaved')}
        </p>
      ) : null}
    </div>
  );
}
