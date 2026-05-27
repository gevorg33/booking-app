'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Send, Sparkles, X } from 'lucide-react';
import {
  sendPublicAssistantMessage,
  type PublicAssistantResponse,
  type PublicBusinessProfile,
} from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  navigate?: PublicAssistantResponse['navigate'];
  success?: boolean;
}

interface SessionContext {
  employeeName?: string | null;
  date?: string | null;
  serviceName?: string | null;
  timeSlot?: string | null;
  customerName?: string | null;
}

const EXAMPLES = [
  'Who is available today?',
  'What services do you offer?',
  'Book a massage tomorrow at 10:00',
  'Where are you located?',
];

interface PublicBookingAssistantProps {
  slug: string;
  tenant: PublicBusinessProfile;
}

export function PublicBookingAssistant({ slug, tenant }: PublicBookingAssistantProps) {
  const router = useRouter();
  const primary = tenant.branding.primaryColor || '#7c3aed';
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionContext, setSessionContext] = useState<SessionContext>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const followNavigate = useCallback(
    (navigate?: PublicAssistantResponse['navigate']) => {
      if (!navigate) return;
      const q = new URLSearchParams(navigate.query).toString();
      const href = q
        ? `${bookPath(slug, `/${navigate.path}`)}?${q}`
        : bookPath(slug, `/${navigate.path}`);
      router.push(href);
      setOpen(false);
    },
    [router, slug],
  );

  const submit = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', text: prompt },
    ]);
    setInput('');
    setLoading(true);

    const history = messages.map((m) => ({ role: m.role, content: m.text }));

    try {
      const result = await sendPublicAssistantMessage(slug, {
        prompt,
        history,
        context: sessionContext as Record<string, unknown>,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: result.summary,
          navigate: result.navigate,
          success: result.success,
        },
      ]);

      if (result.sessionContext) {
        setSessionContext((prev) => ({ ...prev, ...result.sessionContext }));
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          text: err?.message || 'Something went wrong. Please try again.',
          success: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, sessionContext, slug]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform"
          style={{ backgroundColor: primary }}
          title="Booking assistant"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[min(100vw-2rem,400px)] max-h-[min(80vh,560px)] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: primary }} />
              <span className="text-sm font-semibold text-gray-900">Booking assistant</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setMessages([]);
                setSessionContext({});
              }}
              className="text-gray-400 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[180px]">
            {messages.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-4">
                  Ask about availability, services, or book an appointment in plain language.
                </p>
                <div className="space-y-2">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => {
                        setInput(ex);
                        inputRef.current?.focus();
                      }}
                      className="block w-full text-left text-xs text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2 transition-colors"
                    >
                      &ldquo;{ex}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'text-white'
                      : msg.success === false
                        ? 'bg-red-50 border border-red-100 text-red-800'
                        : 'bg-gray-50 border border-gray-100 text-gray-800'
                  }`}
                  style={msg.role === 'user' ? { backgroundColor: primary } : undefined}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  {msg.navigate && msg.role === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => followNavigate(msg.navigate)}
                      className="mt-2 text-xs font-medium px-3 py-1.5 rounded-full text-white"
                      style={{ backgroundColor: primary }}
                    >
                      Continue booking
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 border border-gray-100 rounded-2xl px-3 py-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: primary }} />
                  <span className="text-xs text-gray-500">Thinking…</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={loading}
                placeholder="Ask anything about booking…"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
              />
              <button
                type="button"
                onClick={() => void submit()}
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-xl text-white disabled:opacity-40 transition-opacity"
                style={{ backgroundColor: primary }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
