'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { unwrapAuthResult } from '@/lib/auth-types';
import { getLoginTenantHint, savePreferredBusinessSlug } from '@/lib/auth-session';
import { BusinessPicker } from '@/components/business-picker';
import type { BusinessSummary } from '@/lib/auth-types';
import { useI18n } from '@/i18n';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingBusinesses, setPendingBusinesses] = useState<BusinessSummary[] | null>(null);

  const completeLogin = async (businessId?: string) => {
    setLoading(true);
    setError('');
    setErrorCode(null);
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

      if (!result.token || !result.business) {
        setError(t('auth.loginFailed'));
        return;
      }

      setAuth(result.user, result.business, result.token, {
        businesses: result.businesses,
        employee: result.employee,
      });
      savePreferredBusinessSlug(result.business.slug);
      router.push('/dashboard');
    } catch (err: any) {
      const code = err.response?.data?.code ?? null;
      const rawMessage = err.response?.data?.message;
      const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;

      if (code === 'ACCOUNT_NOT_FOUND') {
        setError(t('auth.accountNotFound'));
        setErrorCode('ACCOUNT_NOT_FOUND');
      } else if (code === 'INVALID_CREDENTIALS') {
        setError(t('auth.invalidCredentials'));
      } else {
        setError(message || t('auth.loginFailed'));
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">{t('auth.welcomeBack')}</h1>
          <p className="text-gray-400 mt-1">{t('auth.signInSubtitle')}</p>
        </div>

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
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-sm">
                <p>{error}</p>
                {errorCode === 'ACCOUNT_NOT_FOUND' && (
                  <p className="mt-2">
                    <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium underline">
                      {t('auth.registerPrompt')}
                    </Link>
                  </p>
                )}
              </div>
            )}
            <div>
              <label className="label">{t('common.email')}</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">{t('common.password')}</label>
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? t('auth.signingIn') : t('auth.signIn')}
            </button>
            <p className="text-center text-sm text-gray-400">
              {t('auth.noAccount')}{' '}
              <Link href="/register" className="text-blue-400 hover:text-blue-300">
                {t('nav.register')}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
