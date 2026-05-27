'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Zap } from 'lucide-react';
import api from '@/lib/api';
import { useI18n } from '@/i18n';

interface InviteInfo {
  email: string;
  businessName: string;
  role: string;
  employeeName?: string;
}

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const token = searchParams.get('token') ?? '';

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', password: '' });
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadError('Invalid invitation link');
      setLoading(false);
      return;
    }
    api
      .get(`/invitations/${token}`)
      .then(({ data }) => {
        const info = (data.data || data) as InviteInfo;
        setInvite(info);
        if (info.employeeName) {
          const parts = info.employeeName.split(' ');
          setForm((f) => ({
            ...f,
            firstName: parts[0] ?? '',
            lastName: parts.slice(1).join(' ') ?? '',
          }));
        }
      })
      .catch((err) => {
        setLoadError(err.response?.data?.message || 'Invitation not found');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.post(`/invitations/${token}/accept`, form);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || t('common.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">{t('invite.title')}</h1>
          <p className="text-gray-400 mt-1">{t('invite.subtitle')}</p>
        </div>

        {loading ? (
          <div className="card flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : loadError ? (
          <div className="card text-center">
            <p className="text-red-400 text-sm">{loadError}</p>
            <Link href="/login" className="text-blue-400 text-sm mt-4 inline-block">
              {t('nav.signIn')}
            </Link>
          </div>
        ) : success ? (
          <div className="card text-center">
            <p className="text-green-400">{t('invite.success')}</p>
          </div>
        ) : invite ? (
          <form onSubmit={handleSubmit} className="card space-y-4">
            <div className="rounded-lg bg-gray-800/50 p-3 text-sm">
              <p className="text-gray-300">
                Join <span className="font-medium text-white">{invite.businessName}</span> as{' '}
                <span className="capitalize">{invite.role}</span>
              </p>
              <p className="text-gray-500 mt-1">{invite.email}</p>
            </div>

            {submitError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-sm">
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">{t('auth.firstName')}</label>
                <input
                  className="input"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">{t('auth.lastName')}</label>
                <input
                  className="input"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">{t('common.password')}</label>
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
                required
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? t('invite.accepting') : t('invite.accept')}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        </div>
      }
    >
      <AcceptInviteForm />
    </Suspense>
  );
}
