'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { unwrapAuthResult } from '@/lib/auth-types';
import { savePreferredBusinessSlug } from '@/lib/auth-session';
import { roleLabel } from '@/components/employees/team-members-card';
import { useI18n } from '@/i18n';

export function BusinessSwitcher() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { business, businesses, setAuth, user, token } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  if (!business || businesses.length <= 1) {
    return business ? (
      <p className="text-xs text-gray-500 mt-2 truncate">{business.name}</p>
    ) : null;
  }

  const handleSwitch = async (businessId: string) => {
    if (businessId === business.id || switching) return;
    setSwitching(true);
    try {
      const { data } = await api.post('/auth/switch-business', { businessId });
      const result = unwrapAuthResult(data);
      if (!result.token || !result.business) return;
      setAuth(result.user, result.business, result.token, {
        businesses: result.businesses,
        employee: result.employee,
      });
      savePreferredBusinessSlug(result.business.slug);
      queryClient.clear();
      setOpen(false);
      window.location.reload();
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="relative mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={switching}
        className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800/60 transition-colors"
      >
        <span className="truncate text-left">{business.name}</span>
        {switching ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
        ) : (
          <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-lg border border-gray-700 bg-gray-900 shadow-xl py-1 max-h-48 overflow-y-auto">
            {businesses.map((biz) => (
              <button
                key={biz.id}
                type="button"
                onClick={() => void handleSwitch(biz.id)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-800 ${
                  biz.id === business.id ? 'text-blue-400 bg-blue-600/10' : 'text-gray-300'
                }`}
              >
                <p className="font-medium truncate">{biz.name}</p>
                <p className="text-gray-500 truncate">{roleLabel(biz.membershipRole, t)}</p>
              </button>
            ))}
          </div>
        </>
      )}

      {user?.email && token && (
        <p className="text-[10px] text-gray-600 mt-1 truncate px-2">{t('auth.multiTenantHint')}</p>
      )}
    </div>
  );
}
