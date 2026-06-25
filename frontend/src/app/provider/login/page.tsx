'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Smartphone } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { unwrapAuthResult } from '@/lib/auth-types';
import { getLoginTenantHint, savePreferredBusinessSlug } from '@/lib/auth-session';
import { BusinessPicker } from '@/components/business-picker';
import type { BusinessSummary } from '@/lib/auth-types';
import { canAccessProviderApp } from '@/lib/provider-access';
import { useI18n } from '@/i18n';
import { getErrorMessage } from '@/lib/error-message';

export default function ProviderLoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingBusinesses, setPendingBusinesses] = useState<BusinessSummary[] | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const finishLogin = (result: ReturnType<typeof unwrapAuthResult>) => {
    if (!canAccessProviderApp(result.employee, result.business?.membershipRole)) {
      setError(t('provider.noEmployeeProfile'));
      return;
    }
    if (!result.token || !result.business) {
      setError(t('auth.loginFailed'));
      return;
    }
    setAuth(result.user, result.business, result.token, {
      businesses: result.businesses,
      employee: result.employee,
    });
    savePreferredBusinessSlug(result.business.slug);
    router.replace('/provider/today');
  };

  const completeLogin = async (businessId?: string) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', {
        email: form.email,
        password: form.password,
        ...getLoginTenantHint(),
        ...(businessId ? { businessId } : {}),
      });
      const result = unwrapAuthResult(data);

      if (result.requiresBusinessSelection) {
        setPendingBusinesses(result.businesses);
        return;
      }

      finishLogin(result);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { code?: string } } };
      if (!axiosErr.response) {
        setError(t('provider.networkError'));
        return;
      }
      const code = axiosErr.response.data?.code;
      if (code === 'ACCOUNT_NOT_FOUND') {
        setError(t('provider.accountNotFoundHint'));
      } else if (code === 'INVALID_CREDENTIALS') {
        setError(t('auth.invalidCredentials'));
      } else {
        setError(getErrorMessage(err, t('auth.loginFailed')));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPendingBusinesses(null);
    await completeLogin();
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email: forgotEmail.trim() });
      const payload = (data as { data?: { message?: string } })?.data ?? data;
      setForgotMessage((payload as { message?: string }).message || t('auth.resetEmailSent'));
    } catch {
      setForgotMessage(t('auth.resetEmailSent'));
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-8">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Smartphone className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold">{t('provider.loginTitle')}</h1>
        <p className="text-gray-400 text-sm mt-2">{t('provider.loginSubtitle')}</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      {pendingBusinesses ? (
        <div className="card space-y-4">
          <h2 className="font-semibold">{t('auth.selectBusiness')}</h2>
          <BusinessPicker
            businesses={pendingBusinesses}
            disabled={loading}
            onSelect={(businessId) => void completeLogin(businessId)}
          />
          <button
            type="button"
            className="btn-secondary w-full text-sm"
            onClick={() => setPendingBusinesses(null)}
          >
            {t('common.back')}
          </button>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="card space-y-4">
          <div>
            <label className="label">{t('common.email')}</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="label mb-0">{t('common.password')}</label>
              <button
                type="button"
                onClick={() => {
                  setForgotOpen(true);
                  setForgotEmail(form.email);
                  setForgotMessage('');
                }}
                className="text-xs text-blue-400 hover:underline"
              >
                {t('auth.forgotPassword')}
              </button>
            </div>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('auth.signIn')}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-gray-500 mt-6">
        {t('provider.adminPortal')}{' '}
        <Link href="/login" className="text-blue-400 hover:underline">
          {t('nav.signIn')}
        </Link>
      </p>

      {forgotOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setForgotOpen(false)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-lg mb-2">{t('auth.forgotPassword')}</h3>
            <p className="text-sm text-gray-400 mb-4">{t('auth.forgotPasswordHint')}</p>
            {forgotMessage ? (
              <p className="text-green-400 text-sm">{forgotMessage}</p>
            ) : (
              <form onSubmit={(e) => void handleForgotPassword(e)} className="space-y-4">
                <div>
                  <label className="label">{t('common.email')}</label>
                  <input
                    type="email"
                    className="input"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={forgotLoading} className="btn-primary text-sm">
                    {forgotLoading ? t('common.saving') : t('auth.sendResetLink')}
                  </button>
                  <button type="button" onClick={() => setForgotOpen(false)} className="btn-secondary text-sm">
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
