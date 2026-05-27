'use client';

import { useState } from 'react';
import { Briefcase, Plus, Clock, DollarSign, CreditCard, Pencil, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/i18n';

interface ServiceRecord {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  bufferMinutes: number;
  price: number;
  currency?: string;
  prepaymentMode?: 'none' | 'full' | 'deposit';
  depositAmount?: number | null;
}

interface ServiceFormState {
  name: string;
  durationMinutes: number;
  price: number;
  bufferMinutes: number;
  description: string;
  onlinePaymentEnabled: boolean;
  prepaymentMode: 'full' | 'deposit';
  depositAmount: number;
}

const defaultForm = (): ServiceFormState => ({
  name: '',
  durationMinutes: 30,
  price: 0,
  bufferMinutes: 0,
  description: '',
  onlinePaymentEnabled: false,
  prepaymentMode: 'full',
  depositAmount: 0,
});

function formToPayload(form: ServiceFormState) {
  return {
    name: form.name,
    description: form.description || undefined,
    durationMinutes: form.durationMinutes,
    bufferMinutes: form.bufferMinutes,
    price: form.price,
    prepaymentMode: form.onlinePaymentEnabled ? form.prepaymentMode : 'none',
    depositAmount:
      form.onlinePaymentEnabled && form.prepaymentMode === 'deposit' && form.depositAmount > 0
        ? form.depositAmount
        : undefined,
  };
}

function serviceToForm(svc: ServiceRecord): ServiceFormState {
  const online = svc.prepaymentMode && svc.prepaymentMode !== 'none';
  return {
    name: svc.name,
    durationMinutes: svc.durationMinutes,
    price: Number(svc.price),
    bufferMinutes: svc.bufferMinutes ?? 0,
    description: svc.description ?? '',
    onlinePaymentEnabled: Boolean(online),
    prepaymentMode: svc.prepaymentMode === 'deposit' ? 'deposit' : 'full',
    depositAmount: svc.depositAmount != null ? Number(svc.depositAmount) : 0,
  };
}

function ServiceFormFields({
  form,
  setForm,
  stripeReady,
  t,
}: {
  form: ServiceFormState;
  setForm: (f: ServiceFormState) => void;
  stripeReady: boolean;
  t: (key: string) => string;
}) {
  return (
    <>
      <div>
        <label className="label">{t('servicesPage.name')}</label>
        <input
          className="input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="label">{t('servicesPage.description')}</label>
        <input
          className="input"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div>
        <label className="label">{t('servicesPage.durationMinutes')}</label>
        <input
          type="number"
          min={10}
          step={10}
          className="input"
          value={form.durationMinutes}
          onChange={(e) => setForm({ ...form, durationMinutes: +e.target.value })}
          required
        />
      </div>
      <div>
        <label className="label">{t('servicesPage.bufferMinutes')}</label>
        <input
          type="number"
          min={0}
          step={5}
          className="input"
          value={form.bufferMinutes}
          onChange={(e) => setForm({ ...form, bufferMinutes: +e.target.value })}
        />
      </div>
      <div>
        <label className="label">{t('servicesPage.price')}</label>
        <input
          type="number"
          min={0}
          step={0.01}
          className="input"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: +e.target.value })}
          required
        />
      </div>
      <div className="md:col-span-2 space-y-3 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        <label className="flex items-center justify-between gap-4 text-sm">
          <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <CreditCard className="w-4 h-4" />
            {t('servicesPage.onlinePayment')}
          </span>
          <input
            type="checkbox"
            checked={form.onlinePaymentEnabled}
            disabled={!stripeReady}
            onChange={(e) =>
              setForm({
                ...form,
                onlinePaymentEnabled: e.target.checked,
                prepaymentMode: e.target.checked ? form.prepaymentMode : 'full',
              })
            }
            className="w-4 h-4 rounded border-gray-300"
          />
        </label>
        {!stripeReady && (
          <p className="text-xs text-amber-600 dark:text-amber-400">{t('servicesPage.stripeRequired')}</p>
        )}
        {form.onlinePaymentEnabled && (
          <>
            <div>
              <label className="label">{t('servicesPage.paymentType')}</label>
              <select
                className="input"
                value={form.prepaymentMode}
                onChange={(e) =>
                  setForm({ ...form, prepaymentMode: e.target.value as 'full' | 'deposit' })
                }
              >
                <option value="full">{t('servicesPage.prepayFull')}</option>
                <option value="deposit">{t('servicesPage.prepayDeposit')}</option>
              </select>
            </div>
            {form.prepaymentMode === 'deposit' && (
              <div>
                <label className="label">{t('servicesPage.depositAmount')}</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className="input"
                  value={form.depositAmount}
                  onChange={(e) => setForm({ ...form, depositAmount: +e.target.value })}
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default function ServicesPage() {
  const { t } = useI18n();
  const { business } = useAuthStore();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceFormState>(defaultForm());
  const [formError, setFormError] = useState<string | null>(null);

  const { data: stripeConnect } = useQuery({
    queryKey: ['stripe-connect', business?.id],
    queryFn: async () => {
      const { data: res } = await api.get(`/businesses/${business!.id}/billing/stripe-connect`);
      return res.data || res;
    },
    enabled: !!business?.id,
  });

  const stripeReady = Boolean(stripeConnect?.configured && stripeConnect?.chargesEnabled);

  const { data: services, isLoading } = useQuery({
    queryKey: ['services', business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data } = await api.get(`/businesses/${business.id}/services`);
      return (data.data || data || []) as ServiceRecord[];
    },
    enabled: !!business?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: ReturnType<typeof formToPayload>) => {
      const res = await api.post(`/businesses/${business!.id}/services`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setShowForm(false);
      setForm(defaultForm());
      setFormError(null);
    },
    onError: (err: unknown) => {
      setFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          t('errors.saveFailed'),
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ReturnType<typeof formToPayload> }) => {
      const res = await api.put(`/businesses/${business!.id}/services/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setEditingId(null);
      setForm(defaultForm());
      setFormError(null);
    },
    onError: (err: unknown) => {
      setFormError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          t('errors.saveFailed'),
      );
    },
  });

  const startEdit = (svc: ServiceRecord) => {
    setEditingId(svc.id);
    setShowForm(false);
    setForm(serviceToForm(svc));
    setFormError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(defaultForm());
    setFormError(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('servicesPage.title')}</h1>
          <p className="text-gray-400 text-sm">{t('servicesPage.subtitle')}</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setForm(defaultForm());
            setFormError(null);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> {t('servicesPage.addService')}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="font-semibold mb-4">{t('servicesPage.newService')}</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(formToPayload(form));
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <ServiceFormFields form={form} setForm={setForm} stripeReady={stripeReady} t={t} />
            {formError && <p className="md:col-span-2 text-sm text-red-500">{formError}</p>}
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? t('servicesPage.saving') : t('servicesPage.create')}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>
        ) : !services || services.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">{t('servicesPage.noServices')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {services.map((svc) => (
              <div key={svc.id} className="py-4">
                {editingId === svc.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      updateMutation.mutate({ id: svc.id, data: formToPayload(form) });
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <ServiceFormFields form={form} setForm={setForm} stripeReady={stripeReady} t={t} />
                    {formError && <p className="md:col-span-2 text-sm text-red-500">{formError}</p>}
                    <div className="md:col-span-2 flex gap-2">
                      <button type="submit" className="btn-primary" disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
                            {t('servicesPage.saving')}
                          </>
                        ) : (
                          t('servicesPage.save')
                        )}
                      </button>
                      <button type="button" onClick={cancelEdit} className="btn-secondary">
                        {t('common.cancel')}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{svc.name}</p>
                      {svc.description && <p className="text-sm text-gray-500">{svc.description}</p>}
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {svc.durationMinutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />${svc.price}
                        </span>
                        {svc.prepaymentMode && svc.prepaymentMode !== 'none' && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-violet-600/15 text-violet-300">
                            {svc.prepaymentMode === 'full'
                              ? t('servicesPage.badgeFullPrepay')
                              : t('servicesPage.badgeDeposit')}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(svc)}
                      className="text-gray-400 hover:text-gray-200 p-2"
                      aria-label={t('servicesPage.editService')}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
