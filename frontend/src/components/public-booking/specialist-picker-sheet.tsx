'use client';

import { useEffect, useState } from 'react';
import { Loader2, Users, X } from 'lucide-react';
import {
  getPublicServiceSlotProviders,
  type PublicServiceSlotProvider,
} from '@/lib/public-api';
import { useI18n } from '@/i18n';
import { ProviderReviewSummary } from '@/components/public-booking/provider-reviews';

export type SpecialistChoice =
  | { type: 'any' }
  | { type: 'provider'; provider: PublicServiceSlotProvider };

interface SpecialistPickerSheetProps {
  open: boolean;
  onClose: () => void;
  slug: string;
  serviceId: string;
  startTime: string;
  primaryColor: string;
  value: SpecialistChoice;
  onChange: (choice: SpecialistChoice) => void;
}

export function SpecialistPickerSheet({
  open,
  onClose,
  slug,
  serviceId,
  startTime,
  primaryColor,
  value,
  onChange,
}: SpecialistPickerSheetProps) {
  const { t } = useI18n();
  const [providers, setProviders] = useState<PublicServiceSlotProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    queueMicrotask(() => setLoading(true));
    queueMicrotask(() => setLoadError(null));

    getPublicServiceSlotProviders(slug, serviceId, startTime)
      .then((res) => {
        if (!cancelled) setProviders(res.providers);
      })
      .catch((err) => {
        if (!cancelled) {
          setProviders([]);
          setLoadError(err instanceof Error ? err.message : t('public.bookingFailed'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, slug, serviceId, startTime, t]);

  if (!open) return null;

  const anySelected = value.type === 'any';

  function selectAny() {
    onChange({ type: 'any' });
    onClose();
  }

  function selectProvider(provider: PublicServiceSlotProvider) {
    onChange({ type: 'provider', provider });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label={t('common.close')}
        onClick={onClose}
      />
      <div className="relative bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{t('public.selectSpecialist')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 space-y-2">
          <button
            type="button"
            onClick={selectAny}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl border bg-white text-left transition-colors ${
              anySelected ? 'border-violet-400 ring-2 ring-violet-100' : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{t('public.anySpecialist')}</p>
              <p className="text-sm text-gray-500">{t('public.assignedAutomatically')}</p>
            </div>
            <span
              className="w-5 h-5 rounded-full border-2 shrink-0"
              style={{
                borderColor: anySelected ? primaryColor : '#d1d5db',
                backgroundColor: anySelected ? primaryColor : 'transparent',
              }}
            />
          </button>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : loadError ? (
            <p className="text-sm text-red-600 py-4 text-center">{loadError}</p>
          ) : providers.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">{t('public.noSpecialistsForSlot')}</p>
          ) : (
            providers.map((provider) => {
              const selected = value.type === 'provider' && value.provider.id === provider.id;
              const hasReviews =
                provider.reviewCount > 0 &&
                provider.averageRating != null &&
                !Number.isNaN(provider.averageRating);

              return (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => selectProvider(provider)}
                  className={`w-full flex items-start gap-3 p-4 rounded-2xl border bg-white text-left transition-colors ${
                    selected ? 'border-violet-400 ring-2 ring-violet-100' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  {provider.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={provider.avatarUrl}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-semibold"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {provider.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{provider.name}</p>
                    {provider.role && <p className="text-sm text-gray-500">{provider.role}</p>}
                    {hasReviews && (
                      <div className="mt-2">
                        <ProviderReviewSummary
                          averageRating={provider.averageRating!}
                          reviewCount={provider.reviewCount}
                          primaryColor={primaryColor}
                        />
                      </div>
                    )}
                  </div>
                  <span
                    className="w-5 h-5 rounded-full border-2 shrink-0 mt-1"
                    style={{
                      borderColor: selected ? primaryColor : '#d1d5db',
                      backgroundColor: selected ? primaryColor : 'transparent',
                    }}
                  />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
