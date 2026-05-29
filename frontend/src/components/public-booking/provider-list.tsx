'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Users } from 'lucide-react';
import { formatScheduleTime } from '@/lib/date-format';
import type { PublicProvider } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { useI18n } from '@/i18n';
import {
  ProviderReviewList,
  ProviderReviewSummary,
} from '@/components/public-booking/provider-reviews';

interface ProviderListProps {
  slug: string;
  providers: PublicProvider[];
  primaryColor: string;
  selectedEmployeeId: string | null;
  selectedStartTime: string | null;
  onSelect: (employeeId: string, startTime: string) => void;
  showAnySpecialistOption?: boolean;
}

export function ProviderList({
  slug,
  providers,
  primaryColor,
  selectedEmployeeId,
  selectedStartTime,
  onSelect,
  showAnySpecialistOption = true,
}: ProviderListProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [expandedReviewIds, setExpandedReviewIds] = useState<Set<string>>(() => new Set());

  return (
    <div className="space-y-3 pb-8">
      {showAnySpecialistOption && (
      <button
        type="button"
        onClick={() => router.push(bookPath(slug, '/any'))}
        className="w-full flex items-center gap-3 p-4 rounded-2xl border bg-white text-left transition-colors border-gray-100 hover:border-gray-200"
      >
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900">{t('public.anySpecialist')}</p>
          <p className="text-sm text-gray-500 mt-0.5">{t('public.anySpecialistHint')}</p>
        </div>
        <ChevronDown className="w-5 h-5 text-gray-400 -rotate-90 shrink-0" />
      </button>
      )}

      {providers.map((provider) => {
        const isSelected = selectedEmployeeId === provider.id;
        const reviewCount = Number(provider.reviewCount ?? 0);
        const averageRating =
          provider.averageRating != null ? Number(provider.averageRating) : null;
        const recentReviews = provider.recentReviews ?? [];
        const hasReviews = reviewCount > 0 && averageRating != null && !Number.isNaN(averageRating);
        const reviewsExpanded = hasReviews && expandedReviewIds.has(provider.id);

        const toggleReviews = () => {
          if (!hasReviews) return;
          setExpandedReviewIds((prev) => {
            const next = new Set(prev);
            if (next.has(provider.id)) next.delete(provider.id);
            else next.add(provider.id);
            return next;
          });
        };

        const reviewsPageHref = bookPath(slug, `/providers/${provider.id}/reviews`);
        return (
          <div
            key={provider.id}
            className={`rounded-2xl border bg-white overflow-hidden transition-colors ${
              isSelected ? 'border-violet-400 ring-2 ring-violet-100' : 'border-gray-100'
            }`}
          >
            <div className="flex items-start gap-3 p-4">
              {provider.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={provider.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
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
                  <button
                    type="button"
                    onClick={toggleReviews}
                    className="mt-2 w-full text-left rounded-xl -mx-1 px-1 py-1 hover:bg-gray-50 transition-colors"
                    aria-expanded={reviewsExpanded}
                  >
                    <ProviderReviewSummary
                      averageRating={averageRating!}
                      reviewCount={reviewCount}
                      primaryColor={primaryColor}
                    />
                    <span
                      className="inline-flex items-center gap-1 text-xs font-medium mt-1"
                      style={{ color: primaryColor }}
                    >
                      {reviewsExpanded ? t('public.hideProviderReviews') : t('public.showProviderReviews')}
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${reviewsExpanded ? 'rotate-180' : ''}`}
                      />
                    </span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (provider.slots[0]) onSelect(provider.id, provider.slots[0].startTime);
                }}
                className="w-5 h-5 rounded-full border-2 shrink-0 mt-1"
                style={{
                  borderColor: isSelected ? primaryColor : '#d1d5db',
                  backgroundColor: isSelected ? primaryColor : 'transparent',
                }}
                aria-label={`Select ${provider.name}`}
              />
            </div>

            {reviewsExpanded && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3 bg-gray-50/60">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  {t('public.providerReviewsTitle')}
                </p>
                <ProviderReviewList
                  reviews={recentReviews}
                  primaryColor={primaryColor}
                  seeMoreHref={reviewsPageHref}
                  showSeeMore={reviewCount > 3}
                />
              </div>
            )}

            {provider.nearestDateLabel && provider.slots.length > 0 && (
              <div className="px-4 pb-4">
                <p className="text-xs text-gray-500 mb-2">
                  {t('public.nearestSlots', { date: provider.nearestDateLabel })}
                </p>
                <div className="flex flex-wrap gap-2">
                  {provider.slots.map((slot) => {
                    const active =
                      isSelected && selectedStartTime === slot.startTime;
                    return (
                      <button
                        key={slot.startTime}
                        type="button"
                        onClick={() => {
                          onSelect(provider.id, slot.startTime);
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          active
                            ? 'text-white border-transparent'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                        style={active ? { backgroundColor: primaryColor } : undefined}
                      >
                        {formatScheduleTime(slot.startTime)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {provider.slots.length === 0 && (
              <p className="px-4 pb-4 text-sm text-gray-400">{t('public.noSlots')}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
