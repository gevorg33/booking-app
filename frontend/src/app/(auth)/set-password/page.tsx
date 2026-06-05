'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Smartphone } from 'lucide-react';
import api from '@/lib/api';
import { useI18n } from '@/i18n';
import { getErrorMessage } from '@/lib/error-message';

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const token = searchParams.get('token') ?? '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      queueMicrotask(() => setLoadError(t('auth.resetLinkInvalid')));
      queueMicrotask(() => setLoading(false));
      return;
    }
    api
      .get(`/auth/reset-password/${token}`)
      .then(({ data }) => {
        const info = (data as { data?: { email?: string } })?.data ?? data;
        setEmail((info as { email?: string }).email ?? '');
      })
      .catch((err) => {
        setLoadError(getErrorMessage(err, t('auth.resetLinkInvalid')));
      })
      .finally(() => setLoading(false));
  }, [token, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => router.push('/provider/login'), 2000);
    } catch (err: unknown) {
      setSubmitError(getErrorMessage(err, t('common.errorGeneric')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">{t('auth.setPasswordTitle')}</h1>
          <p className="text-gray-400 mt-1">{t('auth.setPasswordSubtitle')}</p>
        </div>

        {loading ? (
          <div className="card flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : loadError ? (
          <div className="card text-center">
            <p className="text-red-400 text-sm">{loadError}</p>
            <Link href="/provider/login" className="text-blue-400 text-sm mt-4 inline-block">
              {t('provider.loginTitle')}
            </Link>
          </div>
        ) : success ? (
          <div className="card text-center space-y-4">
            <p className="text-green-400">{t('auth.passwordUpdated')}</p>
            <Link href="/provider/login" className="btn-primary inline-block">
              {t('provider.loginTitle')}
            </Link>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="card space-y-4">
            {email && (
              <div className="rounded-lg bg-gray-800/50 p-3 text-sm text-gray-300">{email}</div>
            )}
            {submitError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-sm">
                {submitError}
              </div>
            )}
            <div>
              <label className="label">{t('auth.newPassword')}</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                autoComplete="new-password"
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? t('common.saving') : t('auth.setPasswordBtn')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        </div>
      }
    >
      <SetPasswordForm />
    </Suspense>
  );
}
