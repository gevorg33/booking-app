'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      const result = data.data || data;
      setAuth(result.user, result.business, result.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
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

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-sm">
              {error}
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
      </div>
    </div>
  );
}
