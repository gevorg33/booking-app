'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useI18n } from '@/i18n';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

interface RetailProduct {
  id: string;
  name: string;
  sku: string | null;
  retailPrice: number;
  quantityOnHand: number;
}

interface RetailSaleLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface BookingRetailPosPanelProps {
  businessId: string;
  bookingId: string;
  disabled?: boolean;
  onSaved?: () => void;
}

export function BookingRetailPosPanel({
  businessId,
  bookingId,
  disabled,
  onSaved,
}: BookingRetailPosPanelProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<Record<string, number>>({});

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['retail-pos-products', businessId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/retail-pos/products`);
      return unwrap<{ products: RetailProduct[] }>(data).products;
    },
    enabled: !!businessId,
  });

  const { data: checkout, isLoading: salesLoading } = useQuery({
    queryKey: ['booking-retail-sales', businessId, bookingId],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${businessId}/bookings/${bookingId}/retail-sales`);
      return unwrap<{ lines: RetailSaleLine[]; retailTotal: number; currency: string }>(data);
    },
    enabled: !!businessId && !!bookingId,
  });

  useEffect(() => {
    if (!checkout) return;
    const next: Record<string, number> = {};
    for (const line of checkout.lines) {
      next[line.productId] = line.quantity;
    }
    queueMicrotask(() => setCart(next));
  }, [checkout]);

  const cartLines = useMemo(() => {
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => {
        const product = products.find((p) => p.id === productId);
        const unitPrice = product?.retailPrice ?? 0;
        return {
          productId,
          name: product?.name ?? 'Product',
          quantity,
          unitPrice,
          lineTotal: Math.round(unitPrice * quantity * 100) / 100,
        };
      });
  }, [cart, products]);

  const cartTotal = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.lineTotal, 0),
    [cartLines],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put(`/businesses/${businessId}/bookings/${bookingId}/retail-sales`, {
        lines: cartLines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
      });
      return unwrap(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['booking-retail-sales', businessId, bookingId] });
      void queryClient.invalidateQueries({ queryKey: ['booking', businessId, bookingId] });
      void queryClient.invalidateQueries({ queryKey: ['retail-pos-products', businessId] });
      void queryClient.invalidateQueries({ queryKey: ['inventory', businessId] });
      onSaved?.();
    },
  });

  const setQty = (productId: string, quantity: number, max: number) => {
    const next = Math.max(0, Math.min(max, quantity));
    setCart((prev) => ({ ...prev, [productId]: next }));
  };

  if (productsLoading || salesLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/80 space-y-3">
      <p className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
        <ShoppingBag className="w-3.5 h-3.5" />
        {t('retailPos.title')}
      </p>
      <p className="text-xs text-gray-500">{t('retailPos.subtitle')}</p>

      {products.length === 0 ? (
        <p className="text-xs text-gray-500">{t('retailPos.noProducts')}</p>
      ) : (
        <ul className="space-y-2">
          {products.map((product) => {
            const qty = cart[product.id] ?? 0;
            return (
              <li
                key={product.id}
                className="flex items-center justify-between gap-3 text-sm border-b border-gray-800/80 pb-2 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-200 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">
                    ${product.retailPrice.toFixed(2)} · {product.quantityOnHand} {t('retailPos.inStock')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    className="p-1 rounded border border-gray-700 text-gray-400 hover:text-gray-200 disabled:opacity-40"
                    disabled={disabled || qty <= 0}
                    onClick={() => setQty(product.id, qty - 1, product.quantityOnHand)}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-gray-200">{qty}</span>
                  <button
                    type="button"
                    className="p-1 rounded border border-gray-700 text-gray-400 hover:text-gray-200 disabled:opacity-40"
                    disabled={disabled || qty >= product.quantityOnHand}
                    onClick={() => setQty(product.id, qty + 1, product.quantityOnHand)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {cartLines.length > 0 && (
        <div className="text-sm space-y-1 pt-1 border-t border-gray-700/80">
          {cartLines.map((line) => (
            <div key={line.productId} className="flex justify-between text-gray-400">
              <span>
                {line.name} × {line.quantity}
              </span>
              <span>${line.lineTotal.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between font-medium text-gray-200 pt-1">
            <span>{t('retailPos.retailTotal')}</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
        </div>
      )}

      <button
        type="button"
        className="btn-secondary w-full text-sm"
        disabled={disabled || saveMutation.isPending}
        onClick={() => saveMutation.mutate()}
      >
        {saveMutation.isPending ? t('common.saving') : t('retailPos.saveCart')}
      </button>
    </div>
  );
}
