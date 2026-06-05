'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Sparkles, X } from 'lucide-react';
import {
  useDraggableFloatingPosition,
  useViewportSize,
} from '@/lib/use-draggable-floating-position';
import {
  sendPublicAssistantMessage,
  type PublicAssistantResponse,
  type PublicBusinessProfile,
} from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { useI18n } from '@/i18n';
import { AiSpeakReplyButton, AiVoiceInputButton } from '@/components/ai-voice-controls';
import type { SpeechRecognitionErrorCode } from '@/lib/use-speech-recognition';
import { isSpeechSynthesisSupported } from '@/lib/use-speech-recognition';

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

const EXAMPLE_KEYS = [
  'public.exampleAvailable',
  'public.exampleServices',
  'public.exampleBook',
  'public.exampleLocation',
] as const;

interface PublicBookingAssistantProps {
  slug: string;
  tenant: PublicBusinessProfile;
}

export function PublicBookingAssistant({ slug, tenant }: PublicBookingAssistantProps) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const primary = tenant.branding.primaryColor || '#7c3aed';
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionContext, setSessionContext] = useState<SessionContext>({});
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const viewport = useViewportSize();
  const estimatedSize = useMemo(() => {
    const fab = { width: 56, height: 56 };
    if (!viewport.width) return fab;
    if (open) {
      return {
        width: Math.min(400, viewport.width - 32),
        height: Math.min(560, Math.round(viewport.height * 0.8)),
      };
    }
    return fab;
  }, [open, viewport.height, viewport.width]);
  const { floatingRef, floatingStyle, bindDragHandle, isDragging } =
    useDraggableFloatingPosition({
      storageKey: `public-ai-position-${slug}`,
      estimatedSize,
    });

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
        locale,
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
    } catch (err: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          text: err?.message || t('common.errorGeneric'),
          success: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, sessionContext, slug, locale, t]);

  const handleVoiceError = useCallback(
    (code: SpeechRecognitionErrorCode) => {
      const message =
        code === 'unsupported'
          ? t('ai.voiceUnsupported')
          : code === 'not-allowed'
            ? t('ai.voiceDenied')
            : code === 'no-speech'
              ? t('ai.voiceNoSpeech')
              : t('ai.voiceError');
      setVoiceError(message);
    },
    [t],
  );

  const closeAssistant = useCallback(() => {
    setOpen(false);
    setMessages([]);
    setSessionContext({});
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAssistant();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, closeAssistant]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <>
      {!open && (
        <button
          ref={floatingRef}
          type="button"
          {...bindDragHandle({ onPress: () => setOpen(true) })}
          style={{ ...floatingStyle, backgroundColor: primary }}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-transform ${
            isDragging ? 'scale-100 cursor-grabbing' : 'hover:scale-105 cursor-grab'
          }`}
          title={t('public.assistantTitle')}
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {open && (
        <div
          ref={floatingRef}
          style={floatingStyle}
          className="w-[min(100vw-2rem,400px)] max-h-[min(80vh,560px)] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div
              {...bindDragHandle()}
              className="flex flex-1 items-center gap-2 min-w-0 select-none"
            >
              <Sparkles className="w-4 h-4 shrink-0 pointer-events-none" style={{ color: primary }} />
              <span className="text-sm font-semibold text-gray-900 truncate pointer-events-none">
                {t('public.assistantTitle')}
              </span>
            </div>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={closeAssistant}
              className="shrink-0 ml-2 p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
              aria-label={t('common.close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[180px]">
            {messages.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-4">
                  {t('public.assistantHint')}
                </p>
                <div className="space-y-2">
                  {EXAMPLE_KEYS.map((key) => {
                    const ex = t(key);
                    return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setInput(ex);
                        inputRef.current?.focus();
                      }}
                      className="block w-full text-left text-xs text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2 transition-colors"
                    >
                      &ldquo;{ex}&rdquo;
                    </button>
                    );
                  })}
                </div>
              </div>
            )}

            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              const isError = isAssistant && msg.success === false && !msg.navigate;
              const isAction = isAssistant && !!msg.navigate;

              return (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'text-white'
                      : isError
                        ? 'bg-red-50 border border-red-100 text-red-800'
                        : isAction
                          ? 'border text-gray-800'
                          : msg.success === true
                            ? 'bg-emerald-50 border border-emerald-100 text-emerald-900'
                            : 'bg-gray-50 border border-gray-100 text-gray-800'
                  }`}
                  style={
                    msg.role === 'user'
                      ? { backgroundColor: primary }
                      : isAction
                        ? {
                            backgroundColor: `${primary}14`,
                            borderColor: `${primary}33`,
                          }
                        : undefined
                  }
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  {isAssistant && isSpeechSynthesisSupported() && (
                    <AiSpeakReplyButton
                      text={msg.text}
                      locale={locale}
                      label={t('ai.speakReply')}
                      variant="light"
                      primaryColor={primary}
                    />
                  )}
                  {msg.navigate && msg.role === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => followNavigate(msg.navigate)}
                      className="mt-2 text-xs font-medium px-3 py-1.5 rounded-full text-white hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: primary }}
                    >
                      {t('public.continueBooking')}
                    </button>
                  )}
                </div>
              </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-50 border border-gray-100 rounded-2xl px-3 py-2">
                  <span className="text-xs text-gray-500">{t('public.thinking')}</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-100">
            {voiceError && (
              <p className="text-[10px] text-amber-700 mb-2 px-1">{voiceError}</p>
            )}
            <div className="flex items-center gap-2">
              <AiVoiceInputButton
                disabled={loading}
                inputValue={input}
                locale={locale}
                onTranscript={(text) => {
                  setVoiceError(null);
                  setInput(text);
                }}
                onError={handleVoiceError}
                variant="light"
                primaryColor={primary}
                labels={{ start: t('ai.voiceStart'), stop: t('ai.voiceStop') }}
              />
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={loading}
                placeholder={t('public.assistantPlaceholder')}
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
