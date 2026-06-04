'use client';

import { useState } from 'react';
import { LifeBuoy, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useI18n } from '@/i18n';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

export function SupportTicketButton() {
  const { t } = useI18n();
  const { business, user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);

  if (!business?.id) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessUrl(null);
    try {
      const { data } = await api.post(
        `/businesses/${business.id}/integrations/zendesk/support-ticket`,
        {
          subject: subject.trim(),
          body: body.trim(),
          requesterEmail: user?.email,
          requesterName: user?.firstName
            ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
            : undefined,
        },
      );
      const result = unwrap<{ url?: string }>(data);
      setSuccessUrl(result.url ?? null);
      setSubject('');
      setBody('');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setError(ax?.response?.data?.message || t('support.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setError(null);
          setSuccessUrl(null);
        }}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-gray-800"
        title={t('support.contactSupport')}
      >
        <LifeBuoy className="w-4 h-4" />
        <span className="hidden lg:inline">{t('support.navLabel')}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-xl p-5 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{t('support.contactSupport')}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-white"
                aria-label={t('common.close')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {successUrl ? (
              <div className="space-y-3">
                <p className="text-sm text-green-400">{t('support.ticketCreated')}</p>
                <a
                  href={successUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:underline break-all"
                >
                  {t('support.openInZendesk')}
                </a>
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-sm w-full">
                  {t('common.close')}
                </button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={submit}>
                <p className="text-xs text-gray-400">{t('support.modalHint')}</p>
                <div>
                  <label className="label">{t('support.subject')}</label>
                  <input
                    className="input"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={t('support.subjectPlaceholder')}
                  />
                </div>
                <div>
                  <label className="label">{t('support.message')}</label>
                  <textarea
                    className="input min-h-[120px]"
                    required
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={t('support.messagePlaceholder')}
                  />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-sm w-full flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {t('support.submitTicket')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
