'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useI18n } from '@/i18n';

interface InventoryProduct {
  id: string;
  name: string;
  isActive?: boolean;
}

export function RecommendedProductsField({
  businessId,
  targetType,
  targetId,
  products,
}: {
  businessId: string;
  targetType: 'service' | 'category';
  targetId: string;
  products: InventoryProduct[];
}) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => setLoading(true));
    const path =
      targetType === 'service'
        ? `/businesses/${businessId}/inventory/recommendations/services/${targetId}`
        : `/businesses/${businessId}/inventory/recommendations/categories/${targetId}`;
    api
      .get(path)
      .then((res) => {
        if (!cancelled) {
          const ids = (res.data?.productIds ?? res.data?.data?.productIds ?? []) as string[];
          setSelected(Array.isArray(ids) ? ids : []);
        }
      })
      .catch(() => {
        if (!cancelled) setSelected([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [businessId, targetType, targetId]);

  const activeProducts = products.filter((product) => product.isActive !== false);

  const toggle = async (productId: string) => {
    const next = selected.includes(productId)
      ? selected.filter((id) => id !== productId)
      : [...selected, productId];
    setSelected(next);
    setSaving(true);
    const path =
      targetType === 'service'
        ? `/businesses/${businessId}/inventory/recommendations/services/${targetId}`
        : `/businesses/${businessId}/inventory/recommendations/categories/${targetId}`;
    try {
      await api.put(path, { productIds: next });
    } finally {
      setSaving(false);
    }
  };

  if (!targetId) return null;

  return (
    <div className="space-y-2">
      <label className="label">{t('recommendations.admin.recommendedProducts')}</label>
      <p className="text-xs text-gray-500">{t('recommendations.admin.recommendedProductsHint')}</p>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t('common.loading')}
        </div>
      ) : activeProducts.length === 0 ? (
        <p className="text-sm text-gray-500">{t('recommendations.admin.noProductsYet')}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {activeProducts.map((product) => {
            const checked = selected.includes(product.id);
            return (
              <button
                key={product.id}
                type="button"
                disabled={saving}
                onClick={() => toggle(product.id)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  checked
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-transparent text-gray-300 border-gray-700 hover:border-gray-500'
                }`}
              >
                {product.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
