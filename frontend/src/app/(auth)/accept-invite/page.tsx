'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Zap } from 'lucide-react';
import api from '@/lib/api';
import { DashboardPhoneInput } from '@/components/dashboard-phone-input';
import { formatPhoneForApi, isValidPhone } from '@/lib/phone-format';
import { useI18n } from '@/i18n';
import { getErrorMessage } from '@/lib/error-message';

interface InviteInfo {
  email: string;
  businessName: string;
  role: string;
  employeeName?: string;
  isAppAccess?: boolean;
  hasExistingAccount?: boolean;
  defaultPhoneCountryCode?: string;
}

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const token = searchParams.get('token') ?? '';

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', password: '', phone: '' });
  const [submitError, setSubmitError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      queueMicrotask(() => {
        setLoadError('Invalid invitation link');
        setLoading(false);
      });
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
        setLoadError(getErrorMessage(err, t('errors.invitationNotFound')));
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setPhoneError('');

    let phone: string | undefined;
    if (form.phone.trim()) {
      if (!isValidPhone(form.phone)) {
        setPhoneError(t('public.phoneInvalid'));
        setSubmitting(false);
        return;
      }
      phone = formatPhoneForApi(form.phone);
    }

    try {
      await api.post(`/invitations/${token}/accept`, {
        firstName: form.firstName,
        lastName: form.lastName,
        password: form.password || undefined,
        phone,
      });
      setSuccess(true);
      setTimeout(() => router.push('/provider/login'), 2000);
    } catch (err: unknown) {
      setSubmitError(getErrorMessage(err, t('common.errorGeneric')));
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
          <h1 className="text-2xl font-bold">
            {invite?.isAppAccess ? t('invite.appAccessTitle') : t('invite.title')}
          </h1>
          <p className="text-gray-400 mt-1">
            {invite?.isAppAccess ? t('invite.appAccessSubtitle') : t('invite.subtitle')}
          </p>
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
          <div className="card text-center space-y-4">
            <p className="text-green-400">{t('invite.success')}</p>
            <Link href="/provider/login" className="btn-primary inline-block">
              {t('provider.loginTitle')}
            </Link>
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

            <DashboardPhoneInput
              label={t('invite.phone')}
              value={form.phone || undefined}
              onChange={(phone) => {
                setPhoneError('');
                setForm((f) => ({ ...f, phone: phone ?? '' }));
              }}
              defaultCountryCode={invite.defaultPhoneCountryCode || '374'}
            />
            {phoneError && <p className="text-sm text-red-400">{phoneError}</p>}
            <p className="text-xs text-gray-500">{t('invite.phoneHint')}</p>

            {!invite.hasExistingAccount && (
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
            )}

            {invite.hasExistingAccount && (
              <p className="text-xs text-gray-500">{t('invite.existingAccountHint')}</p>
            )}

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
