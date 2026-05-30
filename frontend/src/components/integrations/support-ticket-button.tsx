'use client';

import { useState } from 'react';
import { LifeBuoy, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

function unwrap<T>(res: unknown): T {
  return ((res as { data?: T })?.data ?? res) as T;
}

export function SupportTicketButton() {
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
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not create support ticket');
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
        title="Contact support"
      >
        <LifeBuoy className="w-4 h-4" />
        <span className="hidden lg:inline">Support</span>
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
              <h3 className="font-semibold">Contact support</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {successUrl ? (
              <div className="space-y-3">
                <p className="text-sm text-green-400">Ticket created successfully.</p>
                <a
                  href={successUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:underline break-all"
                >
                  Open in Zendesk
                </a>
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-sm w-full">
                  Close
                </button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={submit}>
                <p className="text-xs text-gray-400">
                  Creates a Zendesk ticket with your business context. Configure Zendesk under Integrations → Growth.
                </p>
                <div>
                  <label className="label">Subject</label>
                  <input
                    className="input"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary"
                  />
                </div>
                <div>
                  <label className="label">Message</label>
                  <textarea
                    className="input min-h-[120px]"
                    required
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Describe the issue…"
                  />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button type="submit" disabled={loading} className="btn-primary text-sm w-full flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Submit ticket
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
