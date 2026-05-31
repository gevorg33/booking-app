'use client';

import { useState } from 'react';
import { Loader2, Link2, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/i18n';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

interface ServiceLink {
  id: string;
  serviceId: string;
  serviceName: string;
  productId: string;
  productName: string;
  quantityPerService: number;
}

interface InventoryServiceLinksProps {
  businessId: string;
  products: Array<{ id: string; name: string }>;
}

export function InventoryServiceLinks({ businessId, products }: InventoryServiceLinksProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    serviceId: '',
    productId: '',
    quantityPerService: '1',
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/services`);
      return unwrap<Array<{ id: string; name: string }>>(data);
    },
  });

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['inventory-service-links', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/inventory/service-links`);
      return unwrap<ServiceLink[]>(data);
    },
  });

  const linkMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/businesses/${businessId}/inventory/service-links`, {
        serviceId: form.serviceId,
        productId: form.productId,
        quantityPerService: parseFloat(form.quantityPerService) || 1,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-service-links', businessId] });
      setForm((current) => ({ ...current, quantityPerService: '1' }));
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async (linkId: string) => {
      await api.delete(`/businesses/${businessId}/inventory/service-links/${linkId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-service-links', businessId] });
    },
  });

  const canSubmit = form.serviceId && form.productId && products.length > 0 && services.length > 0;

  return (
    <div className="card space-y-4">
      <div>
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Link2 className="w-4 h-4 text-amber-400" />
          {t('operations.linkProductsTitle')}
        </h3>
        <p className="text-sm text-gray-400 mt-1">{t('operations.linkProductsBody')}</p>
      </div>

      <form
        className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) linkMutation.mutate();
        }}
      >
        <div>
          <label className="label">{t('operations.linkService')}</label>
          <select
            className="input"
            value={form.serviceId}
            onChange={(event) => setForm({ ...form, serviceId: event.target.value })}
            required
          >
            <option value="">{t('operations.selectService')}</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{t('operations.linkProduct')}</label>
          <select
            className="input"
            value={form.productId}
            onChange={(event) => setForm({ ...form, productId: event.target.value })}
            required
          >
            <option value="">{t('operations.selectProduct')}</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{t('operations.quantityPerService')}</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            className="input"
            value={form.quantityPerService}
            onChange={(event) => setForm({ ...form, quantityPerService: event.target.value })}
          />
        </div>
        <button
          type="submit"
          disabled={!canSubmit || linkMutation.isPending}
          className="btn-primary inline-flex items-center justify-center gap-2"
        >
          {linkMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {t('operations.linkProductsAction')}
        </button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
        </div>
      ) : links.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">{t('operations.noServiceLinks')}</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-4 py-3 font-medium text-gray-400">{t('operations.linkService')}</th>
                <th className="px-4 py-3 font-medium text-gray-400">{t('operations.linkProduct')}</th>
                <th className="px-4 py-3 font-medium text-gray-400">{t('operations.quantityPerService')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id} className="border-b border-gray-800/80">
                  <td className="px-4 py-3">{link.serviceName}</td>
                  <td className="px-4 py-3">{link.productName}</td>
                  <td className="px-4 py-3">{Number(link.quantityPerService).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => unlinkMutation.mutate(link.id)}
                      className="p-2 text-gray-400 hover:text-red-400 rounded-lg"
                      aria-label={t('operations.removeServiceLink')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
