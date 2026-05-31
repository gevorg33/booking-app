'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Key, Webhook, BookOpen, Plus, Trash2, Copy, Check, Share2, Layers, Shield, Compass } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';
import { GrowthDistributionTab } from '@/components/integrations/growth-distribution-tab';
import { PlatformMaturityTab } from '@/components/integrations/platform-maturity-tab';
import { EnterpriseTrustTab } from '@/components/enterprise-trust/enterprise-trust-tab';
import { StrategyEvalTab } from '@/components/strategy-eval/strategy-eval-tab';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

interface ApiKeyRow {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  createdAt: string;
}

interface WebhookRow {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  description: string | null;
}

interface ApiDocs {
  baseUrl: string;
  authentication: { type: string; header: string; alternateHeader: string };
  publicBookingApi: { description: string; endpoints: { method: string; path: string; description: string }[] };
  businessApi: { description: string; endpoints: { method: string; path: string; description: string }[] };
  webhooks: { description: string; events: string[] };
}

type Tab = 'keys' | 'webhooks' | 'docs' | 'growth' | 'platform' | 'enterprise' | 'strategy';

export default function IntegrationsPage() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('keys');
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>(['booking.created']);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  const base = `/businesses/${business!.id}/integrations`;

  const { data: apiKeys = [] } = useQuery({
    queryKey: ['integrations-api-keys', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`${base}/api-keys`);
      return unwrap<ApiKeyRow[]>(data);
    },
    enabled: !!business?.id,
  });

  const { data: webhooks = [] } = useQuery({
    queryKey: ['integrations-webhooks', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`${base}/webhooks`);
      return unwrap<WebhookRow[]>(data);
    },
    enabled: !!business?.id,
  });

  const { data: webhookEventOptions = [] } = useQuery({
    queryKey: ['integrations-webhook-events', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`${base}/webhooks/events`);
      return unwrap<{ events: string[] }>(data).events;
    },
    enabled: !!business?.id,
  });

  const { data: docs } = useQuery({
    queryKey: ['integrations-docs', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`${base}/docs`);
      return unwrap<ApiDocs>(data);
    },
    enabled: !!business?.id && tab === 'docs',
  });

  const createKeyMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`${base}/api-keys`, { name: newKeyName.trim() });
      return unwrap<{ key: string }>(data);
    },
    onSuccess: (result) => {
      setCreatedKey(result.key);
      setNewKeyName('');
      queryClient.invalidateQueries({ queryKey: ['integrations-api-keys', business?.id] });
    },
  });

  const revokeKeyMutation = useMutation({
    mutationFn: (keyId: string) => api.delete(`${base}/api-keys/${keyId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations-api-keys', business?.id] }),
  });

  const createWebhookMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`${base}/webhooks`, { url: webhookUrl.trim(), events: webhookEvents });
      return unwrap<{ secret: string }>(data);
    },
    onSuccess: (result) => {
      setCreatedSecret(result.secret);
      setWebhookUrl('');
      queryClient.invalidateQueries({ queryKey: ['integrations-webhooks', business?.id] });
    },
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: (id: string) => api.delete(`${base}/webhooks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations-webhooks', business?.id] }),
  });

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!business?.id) return null;

  const tabs: { id: Tab; label: string; icon: typeof Key }[] = [
    { id: 'keys', label: t('integrations.tabKeys'), icon: Key },
    { id: 'webhooks', label: t('integrations.tabWebhooks'), icon: Webhook },
    { id: 'growth', label: 'Growth & distribution', icon: Share2 },
    { id: 'platform', label: 'Platform maturity', icon: Layers },
    { id: 'enterprise', label: t('enterpriseTrust.tabLabel'), icon: Shield },
    { id: 'strategy', label: t('strategyEval.tabLabel'), icon: Compass },
    { id: 'docs', label: t('integrations.tabDocs'), icon: BookOpen },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('integrations.title')}</h1>
        <p className="text-gray-400 text-sm mt-1">{t('integrations.subtitle')}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'keys' && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <h2 className="font-semibold">{t('integrations.createKey')}</h2>
            <div className="flex gap-3">
              <input
                className="input flex-1"
                placeholder={t('integrations.keyNamePlaceholder')}
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
              <button
                type="button"
                className="btn-primary inline-flex items-center gap-2"
                disabled={!newKeyName.trim() || createKeyMutation.isPending}
                onClick={() => createKeyMutation.mutate()}
              >
                <Plus className="w-4 h-4" />
                {t('integrations.createKeyBtn')}
              </button>
            </div>
            {createdKey && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm">
                <p className="text-amber-200 mb-2">{t('integrations.keyCreatedWarning')}</p>
                <div className="flex gap-2">
                  <code className="flex-1 text-xs break-all bg-black/30 p-2 rounded">{createdKey}</code>
                  <button type="button" className="btn-secondary" onClick={() => void copyText(createdKey)}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="font-semibold mb-4">{t('integrations.activeKeys')}</h2>
            {apiKeys.length === 0 ? (
              <p className="text-sm text-gray-500">{t('integrations.noKeys')}</p>
            ) : (
              <ul className="space-y-3">
                {apiKeys.map((key) => (
                  <li key={key.id} className="flex items-center justify-between gap-4 border-b border-gray-800 pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{key.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{key.keyPrefix}</p>
                    </div>
                    <button
                      type="button"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => revokeKeyMutation.mutate(key.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === 'webhooks' && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <h2 className="font-semibold">{t('integrations.addWebhook')}</h2>
            <input
              className="input"
              placeholder="https://example.com/webhooks/optischedule"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {webhookEventOptions.map((ev) => (
                <label key={ev} className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={webhookEvents.includes(ev)}
                    onChange={(e) => {
                      setWebhookEvents((prev) =>
                        e.target.checked ? [...prev, ev] : prev.filter((x) => x !== ev),
                      );
                    }}
                  />
                  <span className="font-mono text-xs">{ev}</span>
                </label>
              ))}
            </div>
            <button
              type="button"
              className="btn-primary"
              disabled={!webhookUrl.trim() || webhookEvents.length === 0 || createWebhookMutation.isPending}
              onClick={() => createWebhookMutation.mutate()}
            >
              {t('integrations.addWebhookBtn')}
            </button>
            {createdSecret && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm">
                <p className="text-amber-200 mb-2">{t('integrations.webhookSecretWarning')}</p>
                <code className="text-xs break-all">{createdSecret}</code>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="font-semibold mb-4">{t('integrations.activeWebhooks')}</h2>
            {webhooks.length === 0 ? (
              <p className="text-sm text-gray-500">{t('integrations.noWebhooks')}</p>
            ) : (
              <ul className="space-y-3">
                {webhooks.map((wh) => (
                  <li key={wh.id} className="flex items-start justify-between gap-4 border-b border-gray-800 pb-3 last:border-0">
                    <div>
                      <p className="font-mono text-sm break-all">{wh.url}</p>
                      <p className="text-xs text-gray-500 mt-1">{wh.events.join(', ')}</p>
                    </div>
                    <button
                      type="button"
                      className="text-red-400 hover:text-red-300 shrink-0"
                      onClick={() => deleteWebhookMutation.mutate(wh.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === 'growth' && <GrowthDistributionTab />}

      {tab === 'platform' && <PlatformMaturityTab />}
      {tab === 'enterprise' && <EnterpriseTrustTab />}
      {tab === 'strategy' && <StrategyEvalTab />}

      {tab === 'docs' && docs && (
        <div className="space-y-4">
          <div className="card space-y-3">
            <h2 className="font-semibold">{t('integrations.authTitle')}</h2>
            <p className="text-sm text-gray-400">{docs.authentication.header}</p>
            <p className="text-sm text-gray-500">{docs.authentication.alternateHeader}</p>
            <p className="text-xs text-gray-500">{t('integrations.baseUrl')}: {docs.baseUrl}</p>
          </div>

          <div className="card space-y-3">
            <h2 className="font-semibold">{t('integrations.publicApiTitle')}</h2>
            <p className="text-sm text-gray-400">{docs.publicBookingApi.description}</p>
            <ul className="space-y-2">
              {docs.publicBookingApi.endpoints.map((ep) => (
                <li key={ep.path} className="text-sm font-mono">
                  <span className="text-blue-400">{ep.method}</span> {ep.path}
                  <span className="text-gray-500 ml-2 font-sans">— {ep.description}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card space-y-3">
            <h2 className="font-semibold">{t('integrations.businessApiTitle')}</h2>
            <p className="text-sm text-gray-400">{docs.businessApi.description}</p>
            <ul className="space-y-2">
              {docs.businessApi.endpoints.map((ep) => (
                <li key={ep.path} className="text-sm font-mono">
                  <span className="text-emerald-400">{ep.method}</span> {docs.baseUrl}{ep.path}
                  <span className="text-gray-500 ml-2 font-sans">— {ep.description}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card space-y-3">
            <h2 className="font-semibold">{t('integrations.webhooksDocTitle')}</h2>
            <p className="text-sm text-gray-400">{docs.webhooks.description}</p>
            <p className="text-xs text-gray-500">{docs.webhooks.events.join(', ')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
