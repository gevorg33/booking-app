'use client';

import { Fragment, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, CalendarClock, Loader2, Plus, Search, Truck } from 'lucide-react';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { dateKeyToExpiresAtEndOfDay, formatDateDisplay, isExpiredAt } from '@/lib/date-format';
import { GiftCardProductsPanel, type GiftCardProductBundle, type GiftCardPurchasableService } from '@/components/gift-cards/gift-card-products-panel';
import {
  GiftCardExpirationEditor,
  type GiftCardRow,
} from '@/components/gift-cards/gift-card-expiration-editor';
import { GiftCardOrderDetailModal } from '@/components/gift-cards/gift-card-order-detail-modal';
import { DEFAULT_PAGE_SIZE, TablePagination } from '@/components/table/table-pagination';
import { ToggleChoice } from '@/components/ui/radio-choice';
import { promptDialog } from '@/lib/app-dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { toast } from 'sonner';
import { useBusinessCurrency } from '@/hooks/use-business-currency';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

type GiftCardEmployee = {
  id: string;
  name?: string;
  email?: string;
};

type GiftCardPackagePreview = {
  id: string;
  name: string;
  preview?: {
    pricing?: { packagePrice?: number };
    items?: Array<{ serviceName: string; quantity: number }>;
  };
};

type GiftCardSubscriptionPlanPreview = {
  id: string;
  name: string;
  service?: { name?: string };
  preview?: { pricing?: { subscriptionPrice?: number } };
};

type GiftCardChangeRequestRow = {
  id: string;
  requestType: 'cancel' | 'modify';
  status: string;
  displayStatus?: string;
  giftCardId: string;
  giftCardCode?: string;
  giftCardStatus?: string | null;
  refundStatus?: 'refunded' | 'failed' | 'skipped' | 'already_refunded' | null;
  customerNotes?: string | null;
  specialistNotes?: string | null;
};

function formatGiftCardFulfillmentStatus(
  status: string | null | undefined,
  t: (key: string) => string,
): string {
  switch (status) {
    case 'cancelled':
      return t('monetization.giftCardStatusCancelled');
    case 'pending':
      return t('monetization.giftCardStatusPending');
    case 'awaiting_card_creation':
      return t('monetization.giftCardStatusAwaitingCreation');
    case 'ready_for_delivery':
      return t('monetization.giftCardStatusReady');
    case 'out_for_delivery':
      return t('monetization.giftCardStatusOutForDelivery');
    case 'shipped':
      return t('monetization.giftCardStatusShipped');
    case 'delivered':
      return t('monetization.giftCardStatusDelivered');
    case 'package':
      return t('public.giftCards.type.package');
    case 'subscription':
      return t('public.giftCards.type.subscription');
    default:
      return status ?? '—';
  }
}

function formatChangeRequestStatus(request: GiftCardChangeRequestRow, t: (key: string) => string): string {
  const status = request.displayStatus ?? request.status;
  if (status === 'cancelled') return t('monetization.giftCardStatusCancelled');
  return status.replace(/_/g, ' ');
}

function formatRefundStatus(
  refundStatus: GiftCardChangeRequestRow['refundStatus'],
  t: (key: string) => string,
): string | null {
  if (!refundStatus) return null;
  if (refundStatus === 'refunded' || refundStatus === 'already_refunded') {
    return t('monetization.giftCardRefundRefunded');
  }
  if (refundStatus === 'failed') return t('monetization.giftCardRefundFailed');
  return t('monetization.giftCardRefundSkipped');
}

type GiftCardSubTab = 'orders' | 'products' | 'settings' | 'manual' | 'requests';

interface GiftCardSettings {
  purchaseEnabled: boolean;
  digitalDeliveryEnabled: boolean;
  physicalDeliveryEnabled: boolean;
  presetAmounts: number[];
  defaultExpiryMonths: number | null;
  purchasableServices: GiftCardPurchasableService[];
  purchasablePackages?: Array<{ packageId: string; price?: number | null }>;
  purchasableSubscriptionPlans?: Array<{ planId: string; price?: number | null }>;
  bundles: GiftCardProductBundle[];
  cardCreatorStaffIds: string[];
  deliveryStaffIds: string[];
  cancelModifyEnabled: boolean;
  cancelModifyWindowHours: number;
  physicalCancelBeforeReady: boolean;
}

export function DashboardGiftCardsTab({ businessId }: { businessId: string }) {
  const { t, locale } = useI18n();
  const { formatMoney } = useBusinessCurrency();
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<GiftCardSubTab>('orders');
  const [amount, setAmount] = useState('50');
  const [currency, setCurrency] = useState('USD');
  const [expiresAtDay, setExpiresAtDay] = useState('');
  const [fulfillmentStatus, setFulfillmentStatus] = useState('');
  const [orderSearchInput, setOrderSearchInput] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderPage, setOrderPage] = useState(1);
  const [orderSortOrder, setOrderSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [settingsForm, setSettingsForm] = useState<GiftCardSettings | null>(null);
  const [editingExpirationCardId, setEditingExpirationCardId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOrderSearch(orderSearchInput.trim());
      setOrderPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [orderSearchInput]);

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['gift-cards', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/gift-cards`);
      return unwrap<GiftCardRow[]>(data);
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

  const {
    data: fulfillmentData,
    isLoading: fulfillmentLoading,
    isError: fulfillmentError,
  } = useQuery({
    queryKey: [
      'gift-card-fulfillment',
      businessId,
      fulfillmentStatus,
      orderSearch,
      orderPage,
      orderSortOrder,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (fulfillmentStatus) params.set('status', fulfillmentStatus);
      if (orderSearch) params.set('search', orderSearch);
      params.set('page', String(orderPage));
      params.set('pageSize', String(DEFAULT_PAGE_SIZE));
      params.set('sortBy', 'createdAt');
      params.set('sortOrder', orderSortOrder);
      const { data } = await api.get(
        `/businesses/${businessId}/gift-cards/fulfillment?${params.toString()}`,
      );
      return unwrap<{ orders: GiftCardRow[]; total: number; page: number; pageSize: number }>(data);
    },
    enabled: subTab === 'orders',
  });

  const fulfillmentOrders = fulfillmentData?.orders ?? [];
  const fulfillmentTotal = fulfillmentData?.total ?? 0;

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/employees`);
      return unwrap<GiftCardEmployee[]>(data);
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

  const { data: servicePackages = [] } = useQuery({
    queryKey: ['service-packages', businessId, 'gift-products'],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/packages?filter=active`);
      return unwrap<GiftCardPackagePreview[]>(data);
    },
    enabled: subTab === 'products',
  });

  const { data: subscriptionPlans = [] } = useQuery({
    queryKey: ['subscription-plans', businessId, 'gift-products'],
    queryFn: async () => {
      const { data } = await api.get(
        `/businesses/${businessId}/subscriptions/plans?includeInactive=false`,
      );
      return unwrap<GiftCardSubscriptionPlanPreview[]>(data);
    },
    enabled: subTab === 'products',
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
      return unwrap<{ requests: GiftCardChangeRequestRow[] }>(data).requests;
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
    onSuccess: (result) => {
      const payload = unwrap<{ refundStatus?: string }>(result);
      if (payload.refundStatus === 'failed') {
        toast.error(t('monetization.giftCardRefundFailed'));
      }
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
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="search"
                className="input w-full pl-9"
                placeholder={t('monetization.giftCardOrderSearchPlaceholder')}
                value={orderSearchInput}
                onChange={(e) => setOrderSearchInput(e.target.value)}
              />
            </div>
            <select
              className="input max-w-[220px]"
              value={fulfillmentStatus}
              onChange={(e) => {
                setFulfillmentStatus(e.target.value);
                setOrderPage(1);
              }}
            >
              <option value="">{t('monetization.giftCardAllStatuses')}</option>
              <option value="awaiting_card_creation">{t('monetization.giftCardStatusAwaitingCreation')}</option>
              <option value="ready_for_delivery">{t('monetization.giftCardStatusReady')}</option>
              <option value="out_for_delivery">{t('monetization.giftCardStatusOutForDelivery')}</option>
              <option value="shipped">{t('monetization.giftCardStatusShipped')}</option>
              <option value="delivered">{t('monetization.giftCardStatusDelivered')}</option>
              <option value="cancelled">{t('monetization.giftCardStatusCancelled')}</option>
              <option value="pending">{t('monetization.giftCardStatusPending')}</option>
            </select>
          </div>
          <div className="card overflow-hidden p-0">
            {fulfillmentLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              </div>
            ) : fulfillmentError ? (
              <p className="text-red-400 text-sm text-center py-12">{t('common.errorGeneric')}</p>
            ) : fulfillmentOrders.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-12">{t('monetization.giftCardNoOrders')}</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800 text-left">
                        <th className="px-4 py-3 font-medium text-gray-400">Code</th>
                        <th className="px-4 py-3 font-medium text-gray-400">Type</th>
                        <th className="px-4 py-3 font-medium text-gray-400">Delivery</th>
                        <th className="px-4 py-3 font-medium text-gray-400">Status</th>
                        <th className="px-4 py-3 font-medium text-gray-400">Recipient</th>
                        <th className="px-4 py-3 font-medium text-gray-400">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 hover:text-gray-200"
                            onClick={() => {
                              setOrderSortOrder((prev) => (prev === 'DESC' ? 'ASC' : 'DESC'));
                              setOrderPage(1);
                            }}
                          >
                            {t('monetization.giftCardDetailCreated')}
                            {orderSortOrder === 'DESC' ? (
                              <ArrowDown className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUp className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </th>
                        <th className="px-4 py-3 font-medium text-gray-400">{t('monetization.expirationDate')}</th>
                        <th className="px-4 py-3 font-medium text-gray-400" />
                      </tr>
                    </thead>
                    <tbody>
                      {fulfillmentOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-gray-800/80 cursor-pointer hover:bg-gray-800/40 transition-colors"
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          <td className="px-4 py-3 font-mono">{order.codeRevealed ? order.code : '****'}</td>
                          <td className="px-4 py-3 capitalize">{order.cardType}</td>
                          <td className="px-4 py-3 capitalize">{order.deliveryMethod}</td>
                          <td className="px-4 py-3">{formatGiftCardFulfillmentStatus(order.fulfillmentStatus, t)}</td>
                          <td className="px-4 py-3">
                            <div>{order.recipientName ?? '—'}</div>
                            {(order.recipientEmail || order.purchaserEmail) && (
                              <div className="text-xs text-gray-500 truncate max-w-[180px]">
                                {order.recipientEmail ?? order.purchaserEmail}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-400">
                            {order.createdAt ? formatDateDisplay(order.createdAt, locale) : '—'}
                          </td>
                          <td className="px-4 py-3 text-gray-400">
                            {order.expiresAt ? formatDateDisplay(order.expiresAt, locale) : t('monetization.noExpiration')}
                          </td>
                          <td className="px-4 py-3 space-x-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1"
                              onClick={() => setSelectedOrderId(order.id)}
                            >
                              {t('monetization.giftCardViewDetails')}
                            </button>
                            {order.deliveryMethod === 'physical' && order.fulfillmentStatus === 'out_for_delivery' && (
                              <button
                                type="button"
                                className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1"
                                onClick={async () => {
                                  const carrier = await promptDialog({
                                    message: t('monetization.giftCardCarrierPrompt'),
                                    defaultValue: 'Courier',
                                  });
                                  if (!carrier) return;
                                  const trackingNumber = await promptDialog({
                                    message: t('monetization.giftCardTrackingPrompt'),
                                  });
                                  if (!trackingNumber) return;
                                  shipMutation.mutate({ id: order.id, carrier, trackingNumber });
                                }}
                              >
                                <Truck className="w-3 h-3" />
                                Mark shipped
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <TablePagination
                  page={orderPage}
                  pageSize={DEFAULT_PAGE_SIZE}
                  totalItems={fulfillmentTotal}
                  onPageChange={setOrderPage}
                />
              </>
            )}
          </div>
          {selectedOrderId && (
            <GiftCardOrderDetailModal
              businessId={businessId}
              giftCardId={selectedOrderId}
              onClose={() => setSelectedOrderId(null)}
              onUpdated={() => {
                void queryClient.invalidateQueries({ queryKey: ['gift-card-fulfillment', businessId] });
              }}
            />
          )}
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
                  <th className="px-4 py-3 font-medium text-gray-400">Refund</th>
                  <th className="px-4 py-3 font-medium text-gray-400">Notes</th>
                  <th className="px-4 py-3 font-medium text-gray-400" />
                </tr>
              </thead>
              <tbody>
                {changeRequests.map((request) => (
                  <tr key={request.id} className="border-b border-gray-800/80">
                    <td className="px-4 py-3 capitalize">{request.requestType}</td>
                    <td className="px-4 py-3 capitalize">{formatChangeRequestStatus(request, t)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{request.giftCardCode ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400">
                      {formatRefundStatus(request.refundStatus, t) ?? '—'}
                    </td>
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
                            onClick={async () => {
                              const specialistNotes = await promptDialog({
                                message: t('monetization.giftCardNeedsInfoPrompt'),
                              });
                              if (specialistNotes === null) return;
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
                            onClick={async () => {
                              const specialistNotes = await promptDialog({
                                message: t('monetization.giftCardDenyPrompt'),
                              });
                              if (specialistNotes === null) return;
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
            services={services.map((s: { id: string; name: string; price: number }) => ({
              id: s.id,
              name: s.name,
              price: Number(s.price),
            }))}
            packages={servicePackages.map((pkg) => ({
              id: pkg.id,
              name: pkg.name,
              packagePrice: Number(pkg.preview?.pricing?.packagePrice ?? 0),
              itemSummary: (pkg.preview?.items ?? [])
                .map((item) => `${item.serviceName} × ${item.quantity}`)
                .join(', '),
            }))}
            subscriptionPlans={subscriptionPlans.map((plan) => ({
              id: plan.id,
              name: plan.name,
              serviceName: plan.service?.name ?? '',
              subscriptionPrice: Number(plan.preview?.pricing?.subscriptionPrice ?? 0),
            }))}
            purchasableServices={settingsForm.purchasableServices ?? []}
            purchasablePackages={settingsForm.purchasablePackages ?? []}
            purchasableSubscriptionPlans={settingsForm.purchasableSubscriptionPlans ?? []}
            bundles={settingsForm.bundles ?? []}
            onChange={({
              purchasableServices,
              purchasablePackages,
              purchasableSubscriptionPlans,
              bundles,
            }) =>
              setSettingsForm({
                ...settingsForm,
                purchasableServices,
                purchasablePackages,
                purchasableSubscriptionPlans,
                bundles,
              })
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
          <ToggleChoice variant="dashboard"
            checked={settingsForm.purchaseEnabled}
            onChange={(purchaseEnabled) => setSettingsForm({ ...settingsForm, purchaseEnabled })}
            label={t('monetization.giftCardPurchaseEnabled')}
          />
          <ToggleChoice variant="dashboard"
            checked={settingsForm.digitalDeliveryEnabled}
            onChange={(digitalDeliveryEnabled) =>
              setSettingsForm({ ...settingsForm, digitalDeliveryEnabled })
            }
            label={t('monetization.giftCardDigitalDelivery')}
          />
          <ToggleChoice variant="dashboard"
            checked={settingsForm.physicalDeliveryEnabled}
            onChange={(physicalDeliveryEnabled) =>
              setSettingsForm({ ...settingsForm, physicalDeliveryEnabled })
            }
            label={t('monetization.giftCardPhysicalDelivery')}
          />
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
          <ToggleChoice variant="dashboard"
            checked={settingsForm.cancelModifyEnabled}
            onChange={(cancelModifyEnabled) =>
              setSettingsForm({ ...settingsForm, cancelModifyEnabled })
            }
            label={t('monetization.giftCardCancelModifyEnabled')}
          />
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
          <ToggleChoice variant="dashboard"
            checked={settingsForm.physicalCancelBeforeReady ?? true}
            onChange={(physicalCancelBeforeReady) =>
              setSettingsForm({ ...settingsForm, physicalCancelBeforeReady })
            }
            label={t('monetization.giftCardPhysicalCancelBeforeReady')}
          />
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
              <DatePicker className="max-w-[200px]" value={expiresAtDay} clearable onChange={setExpiresAtDay} />
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
                          {formatMoney(card.balance, card.currency)}
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
