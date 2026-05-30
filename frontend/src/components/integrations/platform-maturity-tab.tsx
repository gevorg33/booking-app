'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Check, Download, Zap, Calculator } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

interface ZapierSettings {
  enabled: boolean;
  hookDescription?: string;
  apiBaseUrl: string;
  webhookEvents: string[];
  samplePayloads: unknown[];
  setupSteps: string[];
  makeCompatible: boolean;
}

interface AccountingSettings {
  enabled: boolean;
  provider: 'quickbooks' | 'xero' | 'csv';
  incomeAccountName?: string;
  accountCode?: string;
  includeCommissions: boolean;
  includeExpenses: boolean;
}

function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <input className="input text-xs flex-1 font-mono" readOnly value={value} aria-label={label} />
      <button
        type="button"
        className="btn-secondary text-xs px-2 py-1.5"
        onClick={() => {
          void navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

export function PlatformMaturityTab() {
  const { business } = useAuthStore();
  const queryClient = useQueryClient();
  const base = `/businesses/${business!.id}/integrations`;

  const { data: zapier } = useQuery({
    queryKey: ['integrations-zapier', business?.id],
    queryFn: async () => unwrap<ZapierSettings>((await api.get(`${base}/zapier`)).data),
    enabled: !!business?.id,
  });

  const { data: accounting } = useQuery({
    queryKey: ['integrations-accounting', business?.id],
    queryFn: async () => unwrap<AccountingSettings>((await api.get(`${base}/accounting`)).data),
    enabled: !!business?.id,
  });

  const [zapierForm, setZapierForm] = useState({ enabled: false, hookDescription: '' });
  const [acctForm, setAcctForm] = useState({
    enabled: false,
    provider: 'csv' as AccountingSettings['provider'],
    incomeAccountName: 'Service Income',
    accountCode: '200',
    includeCommissions: true,
    includeExpenses: true,
  });
  const [zapierWebhookUrl, setZapierWebhookUrl] = useState('');
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [exportPreview, setExportPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!zapier) return;
    setZapierForm({
      enabled: zapier.enabled,
      hookDescription: zapier.hookDescription || '',
    });
  }, [zapier]);

  useEffect(() => {
    if (!accounting) return;
    setAcctForm({
      enabled: accounting.enabled,
      provider: accounting.provider,
      incomeAccountName: accounting.incomeAccountName || 'Service Income',
      accountCode: accounting.accountCode || '200',
      includeCommissions: accounting.includeCommissions,
      includeExpenses: accounting.includeExpenses,
    });
  }, [accounting]);

  const saveZapier = useMutation({
    mutationFn: async () => unwrap((await api.put(`${base}/zapier`, zapierForm)).data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations-zapier', business?.id] }),
  });

  const createZapierHook = useMutation({
    mutationFn: async () =>
      unwrap<{ secret?: string }>(
        (
          await api.post(`${base}/zapier/webhook`, {
            url: zapierWebhookUrl.trim(),
            events: ['booking.created', 'booking.cancelled', 'payment.received'],
            description: zapierForm.hookDescription || 'Zapier automation',
          })
        ).data,
      ),
    onSuccess: (data) => {
      setCreatedSecret(data.secret ?? null);
      setZapierWebhookUrl('');
      queryClient.invalidateQueries({ queryKey: ['integrations-webhooks', business?.id] });
    },
  });

  const saveAccounting = useMutation({
    mutationFn: async () => unwrap((await api.put(`${base}/accounting`, acctForm)).data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations-accounting', business?.id] }),
  });

  const downloadExport = useMutation({
    mutationFn: async () =>
      unwrap<{ filename: string; content: string; rowCount: number; provider: string }>(
        (await api.get(`${base}/accounting/export`)).data,
      ),
    onSuccess: (data) => {
      setExportPreview(`${data.provider} · ${data.rowCount} rows`);
      const blob = new Blob([data.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold">Zapier / Make automation</h3>
        </div>
        <p className="text-sm text-gray-400">
          Connect OptiSchedule to Zapier or Make using webhooks and the REST API. Triggers fire on
          booking and payment events.
        </p>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            saveZapier.mutate();
          }}
        >
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={zapierForm.enabled}
              onChange={(e) => setZapierForm({ ...zapierForm, enabled: e.target.checked })}
            />
            Enable automation connector
          </label>
          <input
            className="input text-sm"
            placeholder="Hook description (optional)"
            value={zapierForm.hookDescription}
            onChange={(e) => setZapierForm({ ...zapierForm, hookDescription: e.target.value })}
          />
          <button type="submit" disabled={saveZapier.isPending} className="btn-primary text-sm">
            {saveZapier.isPending ? 'Saving…' : 'Save Zapier settings'}
          </button>
        </form>
        {zapier && (
          <>
            <CopyField value={zapier.apiBaseUrl} label="API base URL" />
            <ol className="list-decimal list-inside text-sm text-gray-400 space-y-1">
              {zapier.setupSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <div className="flex gap-2">
              <input
                className="input text-sm flex-1"
                placeholder="Zapier Catch Hook URL"
                value={zapierWebhookUrl}
                onChange={(e) => setZapierWebhookUrl(e.target.value)}
              />
              <button
                type="button"
                className="btn-secondary text-sm"
                disabled={!zapierWebhookUrl.trim() || createZapierHook.isPending}
                onClick={() => createZapierHook.mutate()}
              >
                Register webhook
              </button>
            </div>
            {createdSecret && (
              <p className="text-xs text-amber-300">
                Webhook signing secret (save now): <code className="font-mono">{createdSecret}</code>
              </p>
            )}
          </>
        )}
      </div>

      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold">Accounting export</h3>
        </div>
        <p className="text-sm text-gray-400">
          Export paid bookings, expenses, and commissions for QuickBooks (IIF), Xero (CSV), or generic CSV.
        </p>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            saveAccounting.mutate();
          }}
        >
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={acctForm.enabled}
              onChange={(e) => setAcctForm({ ...acctForm, enabled: e.target.checked })}
            />
            Enable accounting export
          </label>
          <select
            className="input text-sm"
            value={acctForm.provider}
            onChange={(e) =>
              setAcctForm({ ...acctForm, provider: e.target.value as AccountingSettings['provider'] })
            }
          >
            <option value="csv">Generic CSV</option>
            <option value="quickbooks">QuickBooks (IIF)</option>
            <option value="xero">Xero (CSV)</option>
          </select>
          {acctForm.provider === 'quickbooks' && (
            <input
              className="input text-sm"
              placeholder="Income account name"
              value={acctForm.incomeAccountName}
              onChange={(e) => setAcctForm({ ...acctForm, incomeAccountName: e.target.value })}
            />
          )}
          {acctForm.provider === 'xero' && (
            <input
              className="input text-sm"
              placeholder="Account code"
              value={acctForm.accountCode}
              onChange={(e) => setAcctForm({ ...acctForm, accountCode: e.target.value })}
            />
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={acctForm.includeExpenses}
              onChange={(e) => setAcctForm({ ...acctForm, includeExpenses: e.target.checked })}
            />
            Include expenses
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={acctForm.includeCommissions}
              onChange={(e) => setAcctForm({ ...acctForm, includeCommissions: e.target.checked })}
            />
            Include commissions
          </label>
          <button type="submit" disabled={saveAccounting.isPending} className="btn-primary text-sm">
            {saveAccounting.isPending ? 'Saving…' : 'Save accounting settings'}
          </button>
        </form>
        <button
          type="button"
          className="btn-secondary text-sm inline-flex items-center gap-2"
          disabled={downloadExport.isPending}
          onClick={() => downloadExport.mutate()}
        >
          <Download className="w-4 h-4" />
          {downloadExport.isPending ? 'Generating…' : 'Download export'}
        </button>
        {exportPreview && <p className="text-xs text-gray-500">Last export: {exportPreview}</p>}
      </div>
    </div>
  );
}
