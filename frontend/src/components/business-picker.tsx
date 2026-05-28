'use client';

import { Building2 } from 'lucide-react';
import type { BusinessSummary } from '@/lib/auth-types';
import { roleLabel } from '@/components/employees/team-members-card';
import { useI18n } from '@/i18n';

interface BusinessPickerProps {
  businesses: BusinessSummary[];
  onSelect: (businessId: string) => void;
  disabled?: boolean;
}

export function BusinessPicker({ businesses, onSelect, disabled }: BusinessPickerProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">{t('auth.selectBusinessHint')}</p>
      <div className="space-y-2">
        {businesses.map((biz) => (
          <button
            key={biz.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(biz.id)}
            className="w-full flex items-start gap-3 p-3 rounded-lg border border-gray-700 bg-gray-900/50 hover:border-blue-500/50 hover:bg-blue-600/5 text-left transition-colors disabled:opacity-50"
          >
            <Building2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-medium truncate">{biz.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {roleLabel(biz.membershipRole, t)}
                {biz.employee ? ` · ${biz.employee.name}` : ''}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
