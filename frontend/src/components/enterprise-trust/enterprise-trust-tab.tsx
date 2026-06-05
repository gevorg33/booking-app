'use client';

import { useEffect, useState } from 'react';
import { Download, FileText, Loader2, Shield } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

interface EnterpriseTrustSettings {
  legalBusinessName?: string | null;
  registeredAddress?: string | null;
  country?: string | null;
  dpoEmail?: string | null;
  euRepresentative?: string | null;
  privacyPolicyEffectiveDate?: string | null;
  dpaEffectiveDate?: string | null;
  customDataProcessingNotes?: string | null;
}

interface TrustDocument {
  id: 'dpa' | 'privacy_policy';
  title: string;
  markdown: string;
}

interface SecurityOnePager {
  title: string;
  lastUpdated: string;
  summary: string;
  contactEmail: string;
  sections: Array<{ id: string; title: string; bullets: string[] }>;
}

function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function EnterpriseTrustTab() {
  const { business } = useAuthStore();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EnterpriseTrustSettings | null>(null);
  const [activeDoc, setActiveDoc] = useState<'dpa' | 'privacy_policy'>('dpa');

  const base = `/businesses/${business!.id}/enterprise-trust`;

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['enterprise-trust-settings', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`${base}/settings`);
      return unwrap<{ settings: EnterpriseTrustSettings }>(data).settings;
    },
    enabled: !!business?.id,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['enterprise-trust-documents', business?.id, form],
    queryFn: async () => {
      const { data } = await api.get(`${base}/documents`);
      return unwrap<{ documents: TrustDocument[] }>(data).documents;
    },
    enabled: !!business?.id,
  });

  const { data: securityOnePager } = useQuery({
    queryKey: ['enterprise-trust-security', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`${base}/security-one-pager`);
      return unwrap<SecurityOnePager>(data);
    },
    enabled: !!business?.id,
  });

  useEffect(() => {
    if (settings) queueMicrotask(() => setForm(settings));
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put(`${base}/settings`, form);
      return unwrap<{ settings: EnterpriseTrustSettings }>(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['enterprise-trust-settings', business?.id] });
      void queryClient.invalidateQueries({ queryKey: ['enterprise-trust-documents', business?.id] });
    },
  });

  if (settingsLoading || !form) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t('common.loading')}
      </div>
    );
  }

  const selectedDoc = documents.find((doc) => doc.id === activeDoc);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-100">{t('enterpriseTrust.title')}</h2>
        <p className="text-sm text-gray-400 mt-1">{t('enterpriseTrust.subtitle')}</p>
      </div>

      <section className="card space-y-4">
        <h3 className="font-semibold text-gray-100">{t('enterpriseTrust.settingsTitle')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">{t('enterpriseTrust.legalName')}</label>
            <input
              className="input"
              value={form.legalBusinessName ?? ''}
              onChange={(e) => setForm({ ...form, legalBusinessName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t('enterpriseTrust.country')}</label>
            <input
              className="input"
              value={form.country ?? ''}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">{t('enterpriseTrust.registeredAddress')}</label>
            <input
              className="input"
              value={form.registeredAddress ?? ''}
              onChange={(e) => setForm({ ...form, registeredAddress: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t('enterpriseTrust.dpoEmail')}</label>
            <input
              type="email"
              className="input"
              value={form.dpoEmail ?? ''}
              onChange={(e) => setForm({ ...form, dpoEmail: e.target.value })}
            />
          </div>
          <div>
            <label className="label">{t('enterpriseTrust.euRepresentative')}</label>
            <input
              className="input"
              value={form.euRepresentative ?? ''}
              onChange={(e) => setForm({ ...form, euRepresentative: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">{t('enterpriseTrust.customNotes')}</label>
            <textarea
              className="input min-h-[80px]"
              value={form.customDataProcessingNotes ?? ''}
              onChange={(e) => setForm({ ...form, customDataProcessingNotes: e.target.value })}
            />
          </div>
        </div>
        <button
          type="button"
          className="btn-primary"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending ? t('common.saving') : t('common.saveChanges')}
        </button>
      </section>

      <section className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold text-gray-100 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {t('enterpriseTrust.documentsTitle')}
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              className={`btn-secondary text-sm ${activeDoc === 'dpa' ? 'ring-1 ring-violet-500' : ''}`}
              onClick={() => setActiveDoc('dpa')}
            >
              DPA
            </button>
            <button
              type="button"
              className={`btn-secondary text-sm ${activeDoc === 'privacy_policy' ? 'ring-1 ring-violet-500' : ''}`}
              onClick={() => setActiveDoc('privacy_policy')}
            >
              {t('enterpriseTrust.privacyPolicy')}
            </button>
          </div>
        </div>
        {selectedDoc && (
          <>
            <pre className="text-xs text-gray-400 whitespace-pre-wrap max-h-72 overflow-y-auto bg-gray-900/60 rounded-lg p-4 border border-gray-800">
              {selectedDoc.markdown}
            </pre>
            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-2 text-sm"
              onClick={() =>
                downloadMarkdown(`${selectedDoc.id}.md`, selectedDoc.markdown)
              }
            >
              <Download className="w-4 h-4" />
              {t('enterpriseTrust.downloadMarkdown')}
            </button>
          </>
        )}
      </section>

      {securityOnePager && (
        <section className="card space-y-4">
          <h3 className="font-semibold text-gray-100 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            {securityOnePager.title}
          </h3>
          <p className="text-sm text-gray-400">{securityOnePager.summary}</p>
          <p className="text-xs text-gray-500">
            {t('enterpriseTrust.lastUpdated')}: {securityOnePager.lastUpdated} ·{' '}
            {securityOnePager.contactEmail}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {securityOnePager.sections.map((section) => (
              <div key={section.id} className="rounded-lg border border-gray-800 p-3">
                <p className="font-medium text-sm text-gray-200 mb-2">{section.title}</p>
                <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
