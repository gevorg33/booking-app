'use client';

import { MapPin, Users } from 'lucide-react';
import { formatPublicMoney, type PublicService } from '@/lib/public-api';
import {
  formatTourDifficulty,
  isPublicTourService,
  tourPriceLabel,
} from '@/lib/tour-service';
import { useI18n } from '@/i18n';

interface TourServiceCardProps {
  service: PublicService;
  businessCurrency?: string;
  selected: boolean;
  primaryColor: string;
  onSelect: () => void;
}

export function TourServiceCard({
  service,
  businessCurrency,
  selected,
  primaryColor,
  onSelect,
}: TourServiceCardProps) {
  const { t } = useI18n();
  if (!isPublicTourService(service)) return null;

  const difficulty = formatTourDifficulty(service.difficulty, t);
  const price = formatPublicMoney(service.price, service.currency, businessCurrency);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex flex-col sm:flex-row gap-3 p-0 rounded-2xl border bg-white text-left overflow-hidden transition-colors ${
        selected ? 'border-violet-400 ring-2 ring-violet-100' : 'border-gray-100 hover:border-gray-200'
      }`}
    >
      <div className="sm:w-36 h-28 sm:h-auto shrink-0 bg-gradient-to-br from-violet-100 to-sky-100 relative">
        {service.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={service.coverImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-violet-400 text-sm font-medium">
            {t('tours.tourImagePlaceholder')}
          </div>
        )}
        {service.tourDurationBadge && (
          <span className="absolute top-2 left-2 text-xs font-semibold bg-white/90 text-gray-800 px-2 py-0.5 rounded-full">
            {service.tourDurationBadge}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0 p-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900">{service.name}</p>
          {service.description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{service.description}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-600">
            {difficulty && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5">
                {difficulty}
              </span>
            )}
            {service.maxGroupSize != null && service.maxGroupSize > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                <Users className="w-3 h-3" />
                {t('tours.maxGroup', { count: String(service.maxGroupSize) })}
              </span>
            )}
            {service.meetingPoint && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 line-clamp-1">
                <MapPin className="w-3 h-3 shrink-0" />
                {service.meetingPoint}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-semibold text-gray-900">
            {tourPriceLabel(price, service, t)}
          </p>
          <span
            className="inline-block mt-2 w-5 h-5 rounded border-2"
            style={{
              borderColor: selected ? primaryColor : '#d1d5db',
              backgroundColor: selected ? primaryColor : 'transparent',
            }}
          />
        </div>
      </div>
    </button>
  );
}
