'use client';

import { useMemo, useState } from 'react';
import { Users, Info } from 'lucide-react';
import { formatScheduleTime } from '@/lib/date-format';
import type { PublicProvider } from '@/lib/public-api';

interface ProviderListProps {
  slug: string;
  providers: PublicProvider[];
  primaryColor: string;
  selectedEmployeeId: string | null;
  selectedStartTime: string | null;
  onSelect: (employeeId: string, startTime: string) => void;
}

export function ProviderList({
  slug,
  providers,
  primaryColor,
  selectedEmployeeId,
  selectedStartTime,
  onSelect,
}: ProviderListProps) {
  const [anyProfessional, setAnyProfessional] = useState(false);

  const anySlots = useMemo(() => {
    for (const p of providers) {
      if (p.slots.length > 0) return { provider: p, slot: p.slots[0] };
    }
    return null;
  }, [providers]);

  return (
    <div className="space-y-3 pb-8">
      <button
        type="button"
        onClick={() => {
          setAnyProfessional(true);
          if (anySlots) onSelect(anySlots.provider.id, anySlots.slot.startTime);
        }}
        className={`w-full flex items-center gap-3 p-4 rounded-2xl border bg-white text-left transition-colors ${
          anyProfessional ? 'border-violet-400 ring-2 ring-violet-100' : 'border-gray-100 hover:border-gray-200'
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900">Any available specialist</p>
        </div>
        <span
          className="w-5 h-5 rounded-full border-2 shrink-0"
          style={{
            borderColor: anyProfessional ? primaryColor : '#d1d5db',
            backgroundColor: anyProfessional ? primaryColor : 'transparent',
          }}
        />
      </button>

      {providers.map((provider) => {
        const isSelected = !anyProfessional && selectedEmployeeId === provider.id;
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
              </div>
              <button type="button" className="p-1 text-gray-400" title="Provider info">
                <Info className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setAnyProfessional(false);
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

            {provider.nearestDateLabel && provider.slots.length > 0 && (
              <div className="px-4 pb-4">
                <p className="text-xs text-gray-500 mb-2">
                  Nearest time slot for the appointment — {provider.nearestDateLabel}:
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
                          setAnyProfessional(false);
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
              <p className="px-4 pb-4 text-sm text-gray-400">No available slots in the next two weeks</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
