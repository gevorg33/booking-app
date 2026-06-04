'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Share2,
  LifeBuoy,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';
import { MarketingAutomationSettingsPanel } from '@/components/integrations/marketing-automation-settings';
import { CheckboxChoice, ToggleChoice } from '@/components/ui/radio-choice';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

interface ZendeskSettings {
  configured: boolean;
  enabled: boolean;
  subdomain?: string;
  apiUserEmail?: string;
  hasApiToken: boolean;
  apiTokenHint?: string;
  widgetKey?: string;
  widgetEnabledOnDashboard: boolean;
  widgetEnabledOnPublicBooking: boolean;
  syncCustomersEnabled: boolean;
  createTicketOnReview: boolean;
  reviewTicketMaxRating?: number;
  defaultAssigneeEmail?: string;
}

interface DistributionSettings {
  googleReserve: { enabled: boolean; merchantId?: string; partnerNotes?: string };
  metaBooking: {
    enabled: boolean;
    facebookPageId?: string;
    facebookPageUrl?: string;
    instagramUsername?: string;
    bookingButtonLabel?: string;
    bookingUrl: string;
  };
  messaging: {
    publicBookingUrl: string;
    telegramUrl: string | null;
    whatsappUrl: string | null;
    facebookBookingUrl: string | null;
    instagramBookingUrl: string | null;
    telegramEnabled: boolean;
    whatsappBookingEnabled: boolean;
    telegramBotUsername?: string;
    whatsappBusinessPhone?: string;
  };
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

function normalizeZendeskSubdomain(raw: string): string {
  let value = raw.trim().toLowerCase();
  value = value.replace(/^https?:\/\//, '');
  value = value.replace(/\.zendesk\.com\/?.*$/, '');
  value = value.split('/')[0] ?? value;
  return value;
}

function formatSaveError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const message = (err as { response?: { data?: { message?: string | string[] } } }).response?.data
      ?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string' && message.trim()) return message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function GrowthDistributionTab() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const queryClient = useQueryClient();
  const base = `/businesses/${business!.id}/integrations`;

  const { data: zendesk, isLoading: zendeskLoading } = useQuery({
    queryKey: ['integrations-zendesk', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`${base}/zendesk`);
      return unwrap<ZendeskSettings>(data);
    },
    enabled: !!business?.id,
  });

  const { data: distribution, isLoading: distLoading } = useQuery({
    queryKey: ['integrations-distribution', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`${base}/distribution`);
      return unwrap<DistributionSettings>(data);
    },
    enabled: !!business?.id,
  });

  const [zendeskForm, setZendeskForm] = useState({
    enabled: false,
    subdomain: '',
    apiUserEmail: '',
    apiToken: '',
    widgetKey: '',
    widgetEnabledOnDashboard: true,
    widgetEnabledOnPublicBooking: false,
    syncCustomersEnabled: false,
    createTicketOnReview: false,
    reviewTicketMaxRating: '',
    defaultAssigneeEmail: '',
  });

  const [zendeskError, setZendeskError] = useState<string | null>(null);
  const [zendeskSaved, setZendeskSaved] = useState(false);

  const [distForm, setDistForm] = useState({
    googleReserveEnabled: false,
    googleMerchantId: '',
    googlePartnerNotes: '',
    metaBookingEnabled: false,
    facebookPageId: '',
    facebookPageUrl: '',
    instagramUsername: '',
    metaBookingButtonLabel: 'Book online',
    telegramEnabled: false,
    telegramBotUsername: '',
    whatsappBookingEnabled: false,
    whatsappBusinessPhone: '',
    whatsappBookingMessage: '',
  });

  useEffect(() => {
    if (!zendesk) return;
    setZendeskForm((prev) => ({
      ...prev,
      enabled: zendesk.enabled,
      subdomain: zendesk.subdomain ?? '',
      apiUserEmail: zendesk.apiUserEmail ?? '',
      widgetKey: zendesk.widgetKey ?? '',
      widgetEnabledOnDashboard: zendesk.widgetEnabledOnDashboard,
      widgetEnabledOnPublicBooking: zendesk.widgetEnabledOnPublicBooking,
      syncCustomersEnabled: zendesk.syncCustomersEnabled,
      createTicketOnReview: zendesk.createTicketOnReview,
      reviewTicketMaxRating:
        zendesk.reviewTicketMaxRating != null ? String(zendesk.reviewTicketMaxRating) : '',
      defaultAssigneeEmail: zendesk.defaultAssigneeEmail ?? '',
    }));
  }, [zendesk]);

  useEffect(() => {
    if (!distribution) return;
    setDistForm({
      googleReserveEnabled: distribution.googleReserve.enabled,
      googleMerchantId: distribution.googleReserve.merchantId ?? '',
      googlePartnerNotes: distribution.googleReserve.partnerNotes ?? '',
      metaBookingEnabled: distribution.metaBooking.enabled,
      facebookPageId: distribution.metaBooking.facebookPageId ?? '',
      facebookPageUrl: distribution.metaBooking.facebookPageUrl ?? '',
      instagramUsername: distribution.metaBooking.instagramUsername ?? '',
      metaBookingButtonLabel: distribution.metaBooking.bookingButtonLabel ?? 'Book online',
      telegramEnabled: distribution.messaging.telegramEnabled,
      telegramBotUsername: distribution.messaging.telegramBotUsername ?? '',
      whatsappBookingEnabled: distribution.messaging.whatsappBookingEnabled,
      whatsappBusinessPhone: distribution.messaging.whatsappBusinessPhone ?? '',
      whatsappBookingMessage: '',
    });
  }, [distribution]);

  const saveZendesk = useMutation({
    mutationFn: async () => {
      const subdomain = normalizeZendeskSubdomain(zendeskForm.subdomain);
      const payload: Record<string, unknown> = {
        enabled: zendeskForm.enabled,
        subdomain: subdomain || undefined,
        apiUserEmail: zendeskForm.apiUserEmail.trim().toLowerCase() || undefined,
        widgetKey: zendeskForm.widgetKey.trim() || undefined,
        widgetEnabledOnDashboard: zendeskForm.widgetEnabledOnDashboard,
        widgetEnabledOnPublicBooking: zendeskForm.widgetEnabledOnPublicBooking,
        syncCustomersEnabled: zendeskForm.syncCustomersEnabled,
        createTicketOnReview: zendeskForm.createTicketOnReview,
        reviewTicketMaxRating: zendeskForm.reviewTicketMaxRating.trim()
          ? Number(zendeskForm.reviewTicketMaxRating)
          : null,
        defaultAssigneeEmail: zendeskForm.defaultAssigneeEmail.trim() || undefined,
      };
      if (zendeskForm.apiToken.trim()) payload.apiToken = zendeskForm.apiToken.trim();
      const { data } = await api.put(`${base}/zendesk`, payload);
      return unwrap<ZendeskSettings>(data);
    },
    onSuccess: (result) => {
      setZendeskError(null);
      setZendeskSaved(true);
      setZendeskForm((f) => ({
        ...f,
        apiToken: '',
        enabled: result.enabled,
        subdomain: result.subdomain ?? f.subdomain,
        apiUserEmail: result.apiUserEmail ?? f.apiUserEmail,
      }));
      queryClient.setQueryData(['integrations-zendesk', business?.id], result);
      void queryClient.invalidateQueries({ queryKey: ['integrations-zendesk-widget', business?.id] });
    },
    onError: (err) => {
      setZendeskSaved(false);
      setZendeskError(formatSaveError(err, t('errors.zendeskSaveFailed')));
    },
  });

  const saveDistribution = useMutation({
    mutationFn: async () => {
      const { data } = await api.put(`${base}/distribution`, distForm);
      return unwrap<DistributionSettings>(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['integrations-distribution', business?.id] });
    },
  });

  const downloadGoogleFeed = useMutation({
    mutationFn: async () => {
      const { data } = await api.get(`${base}/google-reserve/feed`);
      const feed = unwrap<Record<string, unknown>>(data);
      const blob = new Blob([JSON.stringify(feed, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `google-reserve-feed-${business!.slug}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  if (zendeskLoading || distLoading) {
    return <p className="text-gray-500 text-sm py-8 text-center">Loading growth integrations…</p>;
  }

  return (
    <div className="space-y-6">
      <MarketingAutomationSettingsPanel />

      {/* int-5 to int-8 Zendesk */}
      <div className="card">
        <div className="flex items-start gap-3 mb-4">
          <LifeBuoy className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">Zendesk support</h3>
            <p className="text-sm text-gray-400">
              Connect Zendesk for help widget, support tickets, and customer sync.
            </p>
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setZendeskError(null);
            setZendeskSaved(false);
            saveZendesk.mutate();
          }}
        >
          <ToggleChoice variant="dashboard"
            checked={zendeskForm.enabled}
            onChange={(enabled) => setZendeskForm({ ...zendeskForm, enabled })}
            label="Enable Zendesk"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Subdomain</label>
              <input
                className="input"
                placeholder="yourcompany"
                value={zendeskForm.subdomain}
                onChange={(e) => setZendeskForm({ ...zendeskForm, subdomain: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">yourcompany.zendesk.com</p>
            </div>
            <div>
              <label className="label">Account email</label>
              <input
                type="email"
                className="input"
                placeholder="agent@yourcompany.com"
                value={zendeskForm.apiUserEmail}
                onChange={(e) => setZendeskForm({ ...zendeskForm, apiUserEmail: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Zendesk agent email paired with your API token
              </p>
            </div>
            <div>
              <label className="label">API token</label>
              <input
                type="password"
                className="input"
                placeholder={zendesk?.hasApiToken ? zendesk.apiTokenHint : 'Zendesk API token'}
                value={zendeskForm.apiToken}
                onChange={(e) => setZendeskForm({ ...zendeskForm, apiToken: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Web Widget key</label>
              <input
                className="input"
                placeholder="Snippet key from Zendesk Admin → Channels → Web Widget"
                value={zendeskForm.widgetKey}
                onChange={(e) => setZendeskForm({ ...zendeskForm, widgetKey: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Not your API token. Copy the key from the Web Widget install snippet.
              </p>
            </div>
            <div>
              <label className="label">Default assignee email (optional)</label>
              <input
                type="email"
                className="input"
                value={zendeskForm.defaultAssigneeEmail}
                onChange={(e) =>
                  setZendeskForm({ ...zendeskForm, defaultAssigneeEmail: e.target.value })
                }
              />
            </div>
          </div>

          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <li>
              <CheckboxChoice
                className="w-full min-h-[44px] rounded-lg border border-gray-800/80 px-3 py-2.5 transition-colors hover:bg-gray-800/30"
                checked={zendeskForm.widgetEnabledOnDashboard}
                onChange={(widgetEnabledOnDashboard) =>
                  setZendeskForm({ ...zendeskForm, widgetEnabledOnDashboard })
                }
                label="Widget on dashboard"
                labelClassName="text-sm text-gray-200"
              />
            </li>
            <li>
              <CheckboxChoice
                className="w-full min-h-[44px] rounded-lg border border-gray-800/80 px-3 py-2.5 transition-colors hover:bg-gray-800/30"
                checked={zendeskForm.widgetEnabledOnPublicBooking}
                onChange={(widgetEnabledOnPublicBooking) =>
                  setZendeskForm({ ...zendeskForm, widgetEnabledOnPublicBooking })
                }
                label="Widget on public booking"
                labelClassName="text-sm text-gray-200"
              />
            </li>
            <li>
              <CheckboxChoice
                className="w-full min-h-[44px] rounded-lg border border-gray-800/80 px-3 py-2.5 transition-colors hover:bg-gray-800/30"
                checked={zendeskForm.syncCustomersEnabled}
                onChange={(syncCustomersEnabled) =>
                  setZendeskForm({ ...zendeskForm, syncCustomersEnabled })
                }
                label="Sync customers to Zendesk"
                labelClassName="text-sm text-gray-200"
              />
            </li>
            <li>
              <CheckboxChoice
                className="w-full min-h-[44px] rounded-lg border border-gray-800/80 px-3 py-2.5 transition-colors hover:bg-gray-800/30"
                checked={zendeskForm.createTicketOnReview}
                onChange={(createTicketOnReview) =>
                  setZendeskForm({ ...zendeskForm, createTicketOnReview })
                }
                label="Create ticket on new review"
                labelClassName="text-sm text-gray-200"
              />
            </li>
          </ul>

          {zendeskForm.createTicketOnReview && (
            <div>
              <label className="label">Review ticket max rating (optional)</label>
              <input
                type="number"
                min={1}
                max={5}
                className="input max-w-[8rem]"
                placeholder="All reviews"
                value={zendeskForm.reviewTicketMaxRating}
                onChange={(e) =>
                  setZendeskForm({ ...zendeskForm, reviewTicketMaxRating: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty for every review. Set to 3 to ticket only 1–3 star reviews.
              </p>
            </div>
          )}

          {zendeskError && (
            <p className="text-sm text-red-400">{zendeskError}</p>
          )}

          {zendeskSaved && !zendeskError && (
            <p className="text-sm text-green-400">Zendesk settings saved.</p>
          )}

          {zendesk?.configured && (
            <p className="text-xs text-green-400">Connected to {zendesk.subdomain}.zendesk.com</p>
          )}

          <button type="submit" disabled={saveZendesk.isPending} className="btn-primary text-sm">
            {saveZendesk.isPending ? t('common.saving') : t('integrations.saveZendesk')}
          </button>
        </form>
      </div>

      {/* dist-2 Google Reserve */}
      <div className="card">
        <div className="flex items-start gap-3 mb-4">
          <Share2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">Google Reserve</h3>
            <p className="text-sm text-gray-400">
              Prepare your catalog feed for Reserve with Google. Full sync requires Google partner approval.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <ToggleChoice variant="dashboard"
            checked={distForm.googleReserveEnabled}
            onChange={(googleReserveEnabled) =>
              setDistForm({ ...distForm, googleReserveEnabled })
            }
            label="Enable Google Reserve setup"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Merchant Center ID</label>
              <input
                className="input"
                value={distForm.googleMerchantId}
                onChange={(e) =>
                  setDistForm({ ...distForm, googleMerchantId: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Partner notes</label>
              <input
                className="input"
                placeholder="Actions Center link or onboarding status"
                value={distForm.googlePartnerNotes}
                onChange={(e) =>
                  setDistForm({ ...distForm, googlePartnerNotes: e.target.value })
                }
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => downloadGoogleFeed.mutate()}
            disabled={downloadGoogleFeed.isPending}
            className="btn-secondary text-sm"
          >
            Download service feed (JSON)
          </button>
        </div>
      </div>

      {/* dist-3 Meta booking */}
      <div className="card">
        <div className="flex items-start gap-3 mb-4">
          <Share2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">Facebook & Instagram booking</h3>
            <p className="text-sm text-gray-400">
              Link social profiles to your public booking page. Add the booking URL to your bio or page CTA.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <ToggleChoice variant="dashboard"
            checked={distForm.metaBookingEnabled}
            onChange={(metaBookingEnabled) =>
              setDistForm({ ...distForm, metaBookingEnabled })
            }
            label="Show booking links on public page"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Facebook Page URL</label>
              <input
                className="input"
                placeholder="https://facebook.com/yourpage"
                value={distForm.facebookPageUrl}
                onChange={(e) =>
                  setDistForm({ ...distForm, facebookPageUrl: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Instagram username</label>
              <input
                className="input"
                placeholder="yourbusiness"
                value={distForm.instagramUsername}
                onChange={(e) =>
                  setDistForm({ ...distForm, instagramUsername: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Booking button label</label>
              <input
                className="input"
                value={distForm.metaBookingButtonLabel}
                onChange={(e) =>
                  setDistForm({ ...distForm, metaBookingButtonLabel: e.target.value })
                }
              />
            </div>
          </div>
          {distribution?.metaBooking.bookingUrl && (
            <CopyField value={distribution.metaBooking.bookingUrl} label="Public booking URL" />
          )}
        </div>
      </div>

      {/* dist-4 Messenger channels */}
      <div className="card">
        <div className="flex items-start gap-3 mb-4">
          <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">Messenger booking links</h3>
            <p className="text-sm text-gray-400">
              Telegram deep links and WhatsApp click-to-chat for booking. Outbound WhatsApp reminders use Settings → WhatsApp.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border border-gray-800 rounded-lg p-4 space-y-3">
            <ToggleChoice variant="dashboard"
              checked={distForm.telegramEnabled}
              onChange={(telegramEnabled) =>
                setDistForm({ ...distForm, telegramEnabled })
              }
              label="Telegram bot deep link"
            />
            <input
              className="input"
              placeholder="Bot username (without @)"
              value={distForm.telegramBotUsername}
              onChange={(e) =>
                setDistForm({ ...distForm, telegramBotUsername: e.target.value })
              }
            />
            {distribution?.messaging.telegramUrl && (
              <CopyField value={distribution.messaging.telegramUrl} label="Telegram link" />
            )}
          </div>

          <div className="border border-gray-800 rounded-lg p-4 space-y-3">
            <ToggleChoice variant="dashboard"
              checked={distForm.whatsappBookingEnabled}
              onChange={(whatsappBookingEnabled) =>
                setDistForm({ ...distForm, whatsappBookingEnabled })
              }
              label="WhatsApp booking chat"
            />
            <input
              className="input"
              placeholder="Business phone E.164 e.g. 37499123456"
              value={distForm.whatsappBusinessPhone}
              onChange={(e) =>
                setDistForm({ ...distForm, whatsappBusinessPhone: e.target.value })
              }
            />
            {distribution?.messaging.whatsappUrl && (
              <CopyField value={distribution.messaging.whatsappUrl} label="WhatsApp link" />
            )}
          </div>

          {distribution?.messaging.publicBookingUrl && (
            <div>
              <label className="label">Public booking URL</label>
              <CopyField
                value={distribution.messaging.publicBookingUrl}
                label="Public booking URL"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => saveDistribution.mutate()}
          disabled={saveDistribution.isPending}
          className="btn-primary text-sm"
        >
          {saveDistribution.isPending ? t('common.saving') : t('integrations.saveDistribution')}
        </button>
      </div>

      <p className="text-xs text-gray-500 flex items-center gap-1">
        <ExternalLink className="w-3 h-3" />
        Use the Support button in the dashboard sidebar to create Zendesk tickets with business context.
      </p>
    </div>
  );
}
