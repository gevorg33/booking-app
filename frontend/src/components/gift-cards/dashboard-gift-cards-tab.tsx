'use client';

import { Fragment, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Loader2, Plus, Truck } from 'lucide-react';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { dateKeyToExpiresAtEndOfDay, formatDateDisplay, isExpiredAt } from '@/lib/date-format';

import { GiftCardProductsPanel, type GiftCardProductBundle, type GiftCardPurchasableService } from '@/components/gift-cards/gift-card-products-panel';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

function expiresAtToDateKey(expiresAt: string | null | undefined): string {
  if (!expiresAt) return '';
  const d = new Date(expiresAt);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

type GiftCardRow = {
  id: string;
  code: string;
  balance: number;
  currency: string;
  cardType?: string;
  expiresAt?: string | null;
  isActive?: boolean;
  codeRevealed?: boolean;
  deliveryMethod?: string;
  fulfillmentStatus?: string;
  recipientName?: string | null;
  purchaserEmail?: string | null;
};

function GiftCardExpirationEditor({
  businessId,
  card,
  onClose,
}: {
  businessId: string;
  card: GiftCardRow;
  onClose: () => void;
}) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'set' | 'extend'>('set');
  const [expiresAtDay, setExpiresAtDay] = useState(expiresAtToDateKey(card.expiresAt));
  const [extendMonths, setExtendMonths] = useState('3');
  const [extendDays, setExtendDays] = useState('');
  const [note, setNote] = useState('');

  const { data: auditEntries = [], isLoading: auditLoading } = useQuery({
    queryKey: ['gift-card-expiration-audit', businessId, card.id],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/gift-cards/${card.id}/expiration-audit`);
      return unwrap<{ entries: Array<{ action: string; previousExpiresAt?: string | null; newExpiresAt?: string | null; note?: string | null; createdAt: string }> }>(data).entries;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.put(`/businesses/${businessId}/gift-cards/${card.id}/expiration`, body);
      return unwrap<{ card: GiftCardRow }>(data).card;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-cards', businessId] });
      queryClient.invalidateQueries({ queryKey: ['gift-card-fulfillment', businessId] });
      queryClient.invalidateQueries({ queryKey: ['gift-card-expiration-audit', businessId, card.id] });
      onClose();
    },
  });

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-4 space-y-4 mt-2">
      <div className="flex gap-2 text-xs">
        <button
          type="button"
          className={`px-2 py-1 rounded ${mode === 'set' ? 'bg-blue-600/20 text-blue-300' : 'text-gray-400'}`}
          onClick={() => setMode('set')}
        >
          {t('monetization.expirationDate')}
        </button>
        <button
          type="button"
          className={`px-2 py-1 rounded ${mode === 'extend' ? 'bg-blue-600/20 text-blue-300' : 'text-gray-400'}`}
          onClick={() => setMode('extend')}
        >
          {t('monetization.giftCardExtendBy')}
        </button>
      </div>

      {mode === 'set' ? (
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">{t('monetization.expirationDate')}</label>
            <input
              type="date"
              className="input max-w-[160px]"
              value={expiresAtDay}
              onChange={(e) => setExpiresAtDay(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn-secondary text-sm"
            disabled={saveMutation.isPending}
            onClick={() => {
              const expiresAt = expiresAtDay ? dateKeyToExpiresAtEndOfDay(expiresAtDay) : null;
              saveMutation.mutate({ expiresAt, note: note || undefined });
            }}
          >
            {saveMutation.isPending ? t('monetization.saving') : t('monetization.giftCardSaveExpiration')}
          </button>
          <button
            type="button"
            className="text-sm text-gray-400 hover:text-gray-200"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate({ expiresAt: null, note: note || undefined })}
          >
            {t('monetization.giftCardClearExpiration')}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">{t('monetization.giftCardExtendMonths')}</label>
            <input
              type="number"
              min="0"
              className="input max-w-[100px]"
              value={extendMonths}
              onChange={(e) => setExtendMonths(e.target.value)}
            />
          </div>
          <div>
            <label className="label">{t('monetization.giftCardExtendDays')}</label>
            <input
              type="number"
              min="0"
              className="input max-w-[100px]"
              value={extendDays}
              onChange={(e) => setExtendDays(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn-primary text-sm"
            disabled={saveMutation.isPending}
            onClick={() =>
              saveMutation.mutate({
                extendMonths: extendMonths ? Number(extendMonths) : 0,
                extendDays: extendDays ? Number(extendDays) : 0,
                note: note || undefined,
              })
            }
          >
            {saveMutation.isPending ? t('monetization.saving') : t('monetization.giftCardSaveExpiration')}
          </button>
        </div>
      )}

      <div>
        <label className="label">{t('monetization.giftCardExpirationNote')}</label>
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div>
        <p className="text-xs font-medium text-gray-400 mb-2">{t('monetization.giftCardExpirationAudit')}</p>
        {auditLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
        ) : auditEntries.length === 0 ? (
          <p className="text-xs text-gray-500">—</p>
        ) : (
          <ul className="text-xs text-gray-400 space-y-1">
            {auditEntries.map((entry, i) => (
              <li key={i}>
                <span className="capitalize text-gray-300">{entry.action}</span>
                {' · '}
                {entry.previousExpiresAt
                  ? formatDateDisplay(entry.previousExpiresAt, locale)
                  : t('monetization.noExpiration')}
                {' → '}
                {entry.newExpiresAt ? formatDateDisplay(entry.newExpiresAt, locale) : t('monetization.noExpiration')}
                {entry.note ? ` · ${entry.note}` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

type GiftCardSubTab = 'orders' | 'products' | 'settings' | 'manual' | 'requests';

interface GiftCardSettings {
  purchaseEnabled: boolean;
  digitalDeliveryEnabled: boolean;
  physicalDeliveryEnabled: boolean;
  presetAmounts: number[];
  defaultExpiryMonths: number | null;
  purchasableServices: GiftCardPurchasableService[];
  bundles: GiftCardProductBundle[];
  cardCreatorStaffIds: string[];
  deliveryStaffIds: string[];
  cancelModifyEnabled: boolean;
  cancelModifyWindowHours: number;
  physicalCancelBeforeReady: boolean;
}

export function DashboardGiftCardsTab({ businessId }: { businessId: string }) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<GiftCardSubTab>('orders');
  const [amount, setAmount] = useState('50');
  const [currency, setCurrency] = useState('USD');
  const [expiresAtDay, setExpiresAtDay] = useState('');
  const [fulfillmentStatus, setFulfillmentStatus] = useState('');
  const [settingsForm, setSettingsForm] = useState<GiftCardSettings | null>(null);
  const [editingExpirationCardId, setEditingExpirationCardId] = useState<string | null>(null);

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['gift-cards', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/gift-cards`);
      return unwrap<any[]>(data);
    },
  });

  const { data: settingsData } = useQuery({
    queryKey: ['gift-card-settings', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/gift-cards/settings`);
      const settings = unwrap<{ settings: GiftCardSettings }>(data).settings;
      setSettingsForm(settings);
      return settings;
    },
  });

  const { data: fulfillmentOrders = [], isLoading: fulfillmentLoading } = useQuery({
    queryKey: ['gift-card-fulfillment', businessId, fulfillmentStatus],
    queryFn: async () => {
      const q = fulfillmentStatus ? `?status=${encodeURIComponent(fulfillmentStatus)}` : '';
      const { data } = await api.get(`/businesses/${businessId}/gift-cards/fulfillment${q}`);
      return unwrap<{ orders: any[] }>(data).orders;
    },
    enabled: subTab === 'orders',
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/employees`);
      return unwrap<any[]>(data);
    },
    enabled: subTab === 'settings',
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/services`);
      return unwrap<Array<{ id: string; name: string; price: number }>>(data);
    },
    enabled: subTab === 'products' || subTab === 'settings',
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const expiresAt = expiresAtDay ? dateKeyToExpiresAtEndOfDay(expiresAtDay) : undefined;
      const { data } = await api.post(`/businesses/${businessId}/gift-cards`, {
        amount: parseFloat(amount),
        currency,
        ...(expiresAt ? { expiresAt } : {}),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-cards', businessId] });
      setAmount('50');
      setExpiresAtDay('');
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put(`/businesses/${businessId}/gift-cards/settings`, settingsForm);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-card-settings', businessId] });
    },
  });

  const shipMutation = useMutation({
    mutationFn: async ({ id, carrier, trackingNumber }: { id: string; carrier: string; trackingNumber: string }) => {
      const { data } = await api.put(`/businesses/${businessId}/gift-cards/fulfillment/${id}/ship`, {
        carrier,
        trackingNumber,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-card-fulfillment', businessId] });
      queryClient.invalidateQueries({ queryKey: ['gift-cards', businessId] });
    },
  });

  const { data: changeRequests = [], isLoading: changeRequestsLoading } = useQuery({
    queryKey: ['gift-card-change-requests', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/gift-cards/change-requests`);
      return unwrap<{ requests: any[] }>(data).requests;
    },
    enabled: subTab === 'requests',
  });

  const resolveRequestMutation = useMutation({
    mutationFn: async ({
      requestId,
      resolution,
      specialistNotes,
    }: {
      requestId: string;
      resolution: 'approve' | 'deny' | 'needs_info';
      specialistNotes?: string;
    }) => {
      const { data } = await api.put(
        `/businesses/${businessId}/gift-cards/change-requests/${requestId}/resolve`,
        { resolution, specialistNotes },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-card-change-requests', businessId] });
      queryClient.invalidateQueries({ queryKey: ['gift-cards', businessId] });
      queryClient.invalidateQueries({ queryKey: ['gift-card-fulfillment', businessId] });
    },
  });

  const subTabs: { id: GiftCardSubTab; label: string }[] = [
    { id: 'orders', label: t('monetization.giftCardOrders') },
    { id: 'requests', label: t('monetization.giftCardChangeRequests') },
    { id: 'products', label: t('monetization.giftCardProducts') },
    { id: 'settings', label: t('monetization.giftCardSettings') },
    { id: 'manual', label: t('monetization.giftCardManual') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {subTabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSubTab(item.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              subTab === item.id ? 'bg-blue-600/10 text-blue-400' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {subTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex gap-2 items-center">
            <select
              className="input max-w-[220px]"
              value={fulfillmentStatus}
              onChange={(e) => setFulfillmentStatus(e.target.value)}
            >
              <option value="">{t('monetization.giftCardAllStatuses')}</option>
              <option value="awaiting_card_creation">{t('monetization.giftCardStatusAwaitingCreation')}</option>
              <option value="ready_for_delivery">{t('monetization.giftCardStatusReady')}</option>
              <option value="out_for_delivery">{t('monetization.giftCardStatusOutForDelivery')}</option>
              <option value="shipped">{t('monetization.giftCardStatusShipped')}</option>
              <option value="delivered">{t('monetization.giftCardStatusDelivered')}</option>
            </select>
          </div>
          <div className="card overflow-hidden p-0">
            {fulfillmentLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              </div>
            ) : fulfillmentOrders.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-12">{t('monetization.giftCardNoOrders')}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-left">
                    <th className="px-4 py-3 font-medium text-gray-400">Code</th>
                    <th className="px-4 py-3 font-medium text-gray-400">Type</th>
                    <th className="px-4 py-3 font-medium text-gray-400">Delivery</th>
                    <th className="px-4 py-3 font-medium text-gray-400">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-400">Recipient</th>
                    <th className="px-4 py-3 font-medium text-gray-400">{t('monetization.expirationDate')}</th>
                    <th className="px-4 py-3 font-medium text-gray-400" />
                  </tr>
                </thead>
                <tbody>
                  {fulfillmentOrders.map((order) => (
                    <Fragment key={order.id}>
                      <tr key={order.id} className="border-b border-gray-800/80">
                        <td className="px-4 py-3 font-mono">{order.codeRevealed ? order.code : '****'}</td>
                        <td className="px-4 py-3 capitalize">{order.cardType}</td>
                        <td className="px-4 py-3 capitalize">{order.deliveryMethod}</td>
                        <td className="px-4 py-3">{order.fulfillmentStatus}</td>
                        <td className="px-4 py-3">{order.recipientName ?? order.purchaserEmail ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-400">
                          {order.expiresAt ? formatDateDisplay(order.expiresAt, locale) : t('monetization.noExpiration')}
                        </td>
                        <td className="px-4 py-3 space-x-2">
                          <button
                            type="button"
                            className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1"
                            onClick={() =>
                              setEditingExpirationCardId((id) => (id === order.id ? null : order.id))
                            }
                          >
                            <CalendarClock className="w-3 h-3" />
                            {t('monetization.giftCardEditExpiration')}
                          </button>
                          {order.deliveryMethod === 'physical' && order.fulfillmentStatus === 'out_for_delivery' && (
                            <button
                              type="button"
                              className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1"
                              onClick={() => {
                                const carrier = window.prompt('Carrier name', 'Courier') ?? '';
                                const trackingNumber = window.prompt('Tracking number', '') ?? '';
                                if (carrier && trackingNumber) {
                                  shipMutation.mutate({ id: order.id, carrier, trackingNumber });
                                }
                              }}
                            >
                              <Truck className="w-3 h-3" />
                              Mark shipped
                            </button>
                          )}
                        </td>
                      </tr>
                      {editingExpirationCardId === order.id && (
                        <tr key={`${order.id}-expiry`}>
                          <td colSpan={7} className="px-4 pb-4">
                            <GiftCardExpirationEditor
                              businessId={businessId}
                              card={order}
                              onClose={() => setEditingExpirationCardId(null)}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {subTab === 'requests' && (
        <div className="card overflow-hidden p-0">
          {changeRequestsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : changeRequests.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-12">{t('monetization.giftCardNoChangeRequests')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="px-4 py-3 font-medium text-gray-400">Type</th>
                  <th className="px-4 py-3 font-medium text-gray-400">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-400">Gift card</th>
                  <th className="px-4 py-3 font-medium text-gray-400">Notes</th>
                  <th className="px-4 py-3 font-medium text-gray-400" />
                </tr>
              </thead>
              <tbody>
                {changeRequests.map((request) => (
                  <tr key={request.id} className="border-b border-gray-800/80">
                    <td className="px-4 py-3 capitalize">{request.requestType}</td>
                    <td className="px-4 py-3">{request.status}</td>
                    <td className="px-4 py-3 font-mono text-xs">{request.giftCardId}</td>
                    <td className="px-4 py-3 text-gray-400 max-w-[240px] truncate">
                      {request.customerNotes ?? '—'}
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      {['pending', 'in_review', 'needs_info'].includes(request.status) && (
                        <>
                          <button
                            type="button"
                            className="text-xs text-green-400 hover:underline"
                            disabled={resolveRequestMutation.isPending}
                            onClick={() =>
                              resolveRequestMutation.mutate({
                                requestId: request.id,
                                resolution: 'approve',
                              })
                            }
                          >
                            {t('monetization.giftCardApproveRequest')}
                          </button>
                          <button
                            type="button"
                            className="text-xs text-amber-400 hover:underline"
                            disabled={resolveRequestMutation.isPending}
                            onClick={() => {
                              const specialistNotes = window.prompt('Message to customer') ?? '';
                              resolveRequestMutation.mutate({
                                requestId: request.id,
                                resolution: 'needs_info',
                                specialistNotes,
                              });
                            }}
                          >
                            {t('monetization.giftCardNeedsInfo')}
                          </button>
                          <button
                            type="button"
                            className="text-xs text-red-400 hover:underline"
                            disabled={resolveRequestMutation.isPending}
                            onClick={() => {
                              const specialistNotes = window.prompt('Reason for denial') ?? '';
                              resolveRequestMutation.mutate({
                                requestId: request.id,
                                resolution: 'deny',
                                specialistNotes,
                              });
                            }}
                          >
                            {t('monetization.giftCardDenyRequest')}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {subTab === 'products' && settingsForm && (
        <div className="space-y-4">
          <GiftCardProductsPanel
            services={services}
            purchasableServices={settingsForm.purchasableServices ?? []}
            bundles={settingsForm.bundles ?? []}
            onChange={({ purchasableServices, bundles }) =>
              setSettingsForm({ ...settingsForm, purchasableServices, bundles })
            }
          />
          <button
            type="button"
            disabled={saveSettingsMutation.isPending}
            className="btn-primary"
            onClick={() => saveSettingsMutation.mutate()}
          >
            {saveSettingsMutation.isPending ? t('monetization.saving') : t('monetization.saveSettings')}
          </button>
        </div>
      )}

      {subTab === 'settings' && settingsForm && (
        <form
          className="card space-y-4 max-w-2xl"
          onSubmit={(e) => {
            e.preventDefault();
            saveSettingsMutation.mutate();
          }}
        >
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settingsForm.purchaseEnabled}
              onChange={(e) => setSettingsForm({ ...settingsForm, purchaseEnabled: e.target.checked })}
            />
            {t('monetization.giftCardPurchaseEnabled')}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settingsForm.digitalDeliveryEnabled}
              onChange={(e) => setSettingsForm({ ...settingsForm, digitalDeliveryEnabled: e.target.checked })}
            />
            {t('monetization.giftCardDigitalDelivery')}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settingsForm.physicalDeliveryEnabled}
              onChange={(e) => setSettingsForm({ ...settingsForm, physicalDeliveryEnabled: e.target.checked })}
            />
            {t('monetization.giftCardPhysicalDelivery')}
          </label>
          <div>
            <label className="label">{t('monetization.giftCardPresetAmounts')}</label>
            <input
              className="input"
              value={settingsForm.presetAmounts.join(', ')}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  presetAmounts: e.target.value
                    .split(',')
                    .map((n) => Number(n.trim()))
                    .filter((n) => n > 0),
                })
              }
            />
          </div>
          <div>
            <label className="label">{t('monetization.giftCardDefaultExpiryMonths')}</label>
            <input
              type="number"
              min="0"
              className="input max-w-[120px]"
              value={settingsForm.defaultExpiryMonths ?? ''}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  defaultExpiryMonths: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settingsForm.cancelModifyEnabled}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, cancelModifyEnabled: e.target.checked })
              }
            />
            {t('monetization.giftCardCancelModifyEnabled')}
          </label>
          <div>
            <label className="label">{t('monetization.giftCardCancelModifyWindow')}</label>
            <input
              type="number"
              min="0"
              className="input max-w-[120px]"
              value={settingsForm.cancelModifyWindowHours}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  cancelModifyWindowHours: Number(e.target.value) || 0,
                })
              }
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settingsForm.physicalCancelBeforeReady ?? true}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, physicalCancelBeforeReady: e.target.checked })
              }
            />
            {t('monetization.giftCardPhysicalCancelBeforeReady')}
          </label>
          <div>
            <label className="label">{t('monetization.giftCardCreators')}</label>
            <select
              multiple
              className="input min-h-[100px]"
              value={settingsForm.cardCreatorStaffIds}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  cardCreatorStaffIds: Array.from(e.target.selectedOptions, (o) => o.value),
                })
              }
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name ?? emp.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t('monetization.giftCardDrivers')}</label>
            <select
              multiple
              className="input min-h-[100px]"
              value={settingsForm.deliveryStaffIds}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  deliveryStaffIds: Array.from(e.target.selectedOptions, (o) => o.value),
                })
              }
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name ?? emp.email}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={saveSettingsMutation.isPending} className="btn-primary">
            {saveSettingsMutation.isPending ? t('monetization.saving') : t('monetization.saveSettings')}
          </button>
        </form>
      )}

      {subTab === 'manual' && (
        <>
          <form
            className="card flex flex-wrap gap-4 items-end"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
          >
            <div>
              <label className="label">Amount</label>
              <input type="number" min="1" step="0.01" className="input max-w-[140px]" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div>
              <label className="label">Currency</label>
              <input className="input max-w-[100px]" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
            </div>
            <div>
              <label className="label">{t('monetization.expirationDate')}</label>
              <input type="date" className="input max-w-[160px]" value={expiresAtDay} onChange={(e) => setExpiresAtDay(e.target.value)} />
            </div>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary inline-flex items-center gap-2">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create gift card
            </button>
          </form>

          <div className="card overflow-hidden p-0">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              </div>
            ) : cards.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-12">No gift cards yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-left">
                    <th className="px-4 py-3 font-medium text-gray-400">Code</th>
                    <th className="px-4 py-3 font-medium text-gray-400">Balance</th>
                    <th className="px-4 py-3 font-medium text-gray-400">Type</th>
                    <th className="px-4 py-3 font-medium text-gray-400">{t('monetization.expirationDate')}</th>
                    <th className="px-4 py-3 font-medium text-gray-400">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-400" />
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card) => (
                    <Fragment key={card.id}>
                      <tr key={card.id} className="border-b border-gray-800/80">
                        <td className="px-4 py-3 font-mono">{card.code}</td>
                        <td className="px-4 py-3">
                          {Number(card.balance).toFixed(2)} {card.currency}
                        </td>
                        <td className="px-4 py-3 capitalize">{card.cardType ?? 'monetary'}</td>
                        <td className="px-4 py-3 text-gray-400">
                          {card.expiresAt ? formatDateDisplay(card.expiresAt, locale) : t('monetization.noExpiration')}
                        </td>
                        <td className="px-4 py-3">
                          {!card.isActive ? 'Inactive' : isExpiredAt(card.expiresAt) ? t('monetization.expired') : 'Active'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1"
                            onClick={() =>
                              setEditingExpirationCardId((id) => (id === card.id ? null : card.id))
                            }
                          >
                            <CalendarClock className="w-3 h-3" />
                            {t('monetization.giftCardEditExpiration')}
                          </button>
                        </td>
                      </tr>
                      {editingExpirationCardId === card.id && (
                        <tr key={`${card.id}-expiry`}>
                          <td colSpan={6} className="px-4 pb-4">
                            <GiftCardExpirationEditor
                              businessId={businessId}
                              card={card}
                              onClose={() => setEditingExpirationCardId(null)}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {!settingsData && (subTab === 'settings' || subTab === 'products') && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        </div>
      )}
    </div>
  );
}
