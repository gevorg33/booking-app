'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Send, Sparkles, X, HelpCircle } from 'lucide-react';
import {
  useDraggableFloatingPosition,
  useViewportSize,
} from '@/lib/use-draggable-floating-position';
import {
  sendPublicAssistantMessage,
  type PublicAssistantResponse,
  type PublicBusinessProfile,
  getPublicProviders,
  getPublicServices,
} from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { useI18n } from '@/i18n';
import { AiSpeakReplyButton, AiVoiceInputButton } from '@/components/ai-voice-controls';
import { AiAvailableProvidersPanel } from '@/components/ai-available-providers-panel';
import {
  buildProviderBookingPrompt,
  normalizeAvailableProviders,
  type AiAvailableProvider,
} from '@/lib/ai-available-providers.util';
import {
  buildPublicAssistantCheckoutNavigate,
  shouldAutoNavigateAssistantCheckout,
} from '@/lib/public-assistant-checkout.util';
import {
  hasPublicAssistantGuideSteps,
} from '@/lib/public-assistant-guide.util';
import {
  buildPublicAssistantExampleTenant,
  buildPublicAssistantExamples,
} from '@/lib/public-assistant-examples.util';
import { buildPublicPageSuggestions } from '@/lib/consumer-page-suggestions.util';
import {
  resolveAssistantModePayload,
  withAssistantModeContext,
} from '@/lib/assistant-mode.util';
import { PublicAssistantGuidePanel } from '@/components/public-booking/public-assistant-guide-panel';
import type { AiGuideResponse } from '@/lib/ai-client.types';
import type { SpeechRecognitionErrorCode } from '@/lib/use-speech-recognition';
import { isSpeechSynthesisSupported, localeToSpeechLang, speakText } from '@/lib/use-speech-recognition';
import {
  buildPublicAssistantPageContext,
} from '@/lib/public-booking-assistant-context.util';
import { subscribePublicAssistantEvents } from '@/lib/public-assistant-events';
import { handleAssistantFeedbackClientAction } from '@/lib/assistant-feedback.util';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  navigate?: PublicAssistantResponse['navigate'];
  guide?: AiGuideResponse;
  success?: boolean;
  details?: Record<string, unknown>;
}

interface SessionContext {
  employeeName?: string | null;
  date?: string | null;
  serviceName?: string | null;
  timeSlot?: string | null;
  customerName?: string | null;
}


interface PublicBookingAssistantProps {
  slug: string;
  tenant: PublicBusinessProfile;
}

export function PublicBookingAssistant({ slug, tenant }: PublicBookingAssistantProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t, locale } = useI18n();
  const primary = tenant.branding.primaryColor || '#7c3aed';
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionContext, setSessionContext] = useState<SessionContext>({});
  const [guideMode, setGuideMode] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const { data: publicServices = [] } = useQuery({
    queryKey: ['public-services', slug, locale, 'assistant-examples'],
    queryFn: async () => {
      const response = await getPublicServices(slug, { locale });
      return response.services ?? [];
    },
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
  const { data: publicProviders = [] } = useQuery({
    queryKey: ['public-providers', slug, locale, 'assistant-examples'],
    queryFn: async () => {
      const response = await getPublicProviders(slug, undefined, locale);
      return response.providers ?? [];
    },
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
  const exampleTenant = useMemo(
    () =>
      buildPublicAssistantExampleTenant({
        services: publicServices,
        providers: publicProviders,
      }),
    [publicProviders, publicServices],
  );
  const pageSuggestions = useMemo(() => {
    const search = searchParams.toString();
    return buildPublicPageSuggestions(pathname, t, search ? `?${search}` : '');
  }, [pathname, searchParams, t]);
  const examples = useMemo(() => {
    if (guideMode) {
      return buildPublicAssistantExamples(true, t, exampleTenant);
    }
    if (pageSuggestions.length) return pageSuggestions;
    return buildPublicAssistantExamples(false, t, exampleTenant);
  }, [exampleTenant, guideMode, pageSuggestions, t]);
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
      if (navigate.path === 'provider_profile' && navigate.query.employeeId) {
        router.push(
          bookPath(slug, `/providers/${navigate.query.employeeId}`),
        );
        setOpen(false);
        return;
      }
      const q = new URLSearchParams(navigate.query).toString();
      const href = q
        ? `${bookPath(slug, `/${navigate.path}`)}?${q}`
        : bookPath(slug, `/${navigate.path}`);
      router.push(href);
      setOpen(false);
    },
    [router, slug],
  );

  const assistantPageContext = useMemo(
    () => buildPublicAssistantPageContext(pathname),
    [pathname],
  );

  const submit = useCallback(
    async (overridePrompt?: string) => {
      const prompt = (overridePrompt ?? input).trim();
      if (!prompt || loading) return;

      setMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: 'user', text: prompt },
      ]);
      if (!overridePrompt) setInput('');
      setLoading(true);

      const history = messages.map((m) => ({ role: m.role, content: m.text }));

      try {
        const assistantMode = resolveAssistantModePayload(guideMode);
        const result = await sendPublicAssistantMessage(slug, {
          prompt,
          history,
          context: withAssistantModeContext(
            {
              ...sessionContext,
              ...assistantPageContext,
            } as Record<string, unknown>,
            guideMode,
          ),
          locale,
          ...(assistantMode ? { assistantMode } : {}),
        });

        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            text: result.summary,
            navigate: result.navigate,
            guide: result.guide,
            success: result.success,
            details: result.details,
          },
        ]);

        if (result.sessionContext) {
          setSessionContext((prev) => ({ ...prev, ...result.sessionContext }));
        }

        if (result.details?.clientAction === 'speakAssistantReply') {
          const speakTextValue =
            typeof result.details?.speakText === 'string'
              ? result.details.speakText
              : undefined;
          if (speakTextValue && isSpeechSynthesisSupported()) {
            speakText(speakTextValue, localeToSpeechLang(locale));
          }
        }
        handleAssistantFeedbackClientAction(result.details);
      } catch (err: unknown) {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'assistant',
            text: err instanceof Error ? err.message : t('common.errorGeneric'),
            success: false,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [assistantPageContext, followNavigate, guideMode, input, loading, messages, sessionContext, slug, locale, t],
  );

  const handleProviderSlotSelect = useCallback(
    (
      details: Record<string, unknown> | undefined,
      selection: {
        provider: AiAvailableProvider;
        time?: string;
        prompt: string;
      },
      serviceLabel?: string,
      date?: string,
    ) => {
      if (selection.time) {
        const checkout = buildPublicAssistantCheckoutNavigate(
          details,
          selection.provider,
          selection.time,
        );
        if (checkout) {
          followNavigate(checkout);
          return;
        }
      }
      void submit(
        selection.prompt ||
          buildProviderBookingPrompt({
            provider: selection.provider,
            serviceName: serviceLabel,
            date,
            time: selection.time,
          }),
      );
    },
    [followNavigate, submit],
  );

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

  useEffect(() => {
    return subscribePublicAssistantEvents({
      onOpen: () => setOpen(true),
      onRun: ({ prompt, autoSubmit }) => {
        setOpen(true);
        if (autoSubmit !== false) {
          void submit(prompt);
          return;
        }
        setInput(prompt);
      },
      onPrompt: (prompt) => {
        setOpen(true);
        setInput(prompt);
      },
    });
  }, [submit]);

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
                <div className="flex flex-wrap justify-center gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setGuideMode((active) => !active)}
                    aria-pressed={guideMode}
                    title={t('public.assistantHelpChipHint')}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      guideMode
                        ? 'bg-violet-100 text-violet-800 border border-violet-300'
                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-violet-200'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                    {t('public.assistantHelpChip')}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  {guideMode ? t('public.assistantGuideExamples') : t('public.assistantHint')}
                </p>
                <div className="space-y-2">
                  {!guideMode && pageSuggestions.length > 0 ? (
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 text-left">
                      {t('public.assistantPageSuggestionsTitle')}
                    </p>
                  ) : null}
                  {examples.map((ex) => (
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

            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              const isError = isAssistant && msg.success === false && !msg.navigate;
              const isAction = isAssistant && !!msg.navigate;
              const availableProviders = isAssistant
                ? normalizeAvailableProviders(msg.details)
                : [];

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
                  {hasPublicAssistantGuideSteps(msg.guide) ? (
                    <PublicAssistantGuidePanel
                      guide={msg.guide}
                      slug={slug}
                      onNavigate={(href) => {
                        const trimmed = href.replace(/^\//, '');
                        const [path, queryString] = trimmed.split('?');
                        followNavigate({
                          path: path as NonNullable<PublicAssistantResponse['navigate']>['path'],
                          query: Object.fromEntries(new URLSearchParams(queryString ?? '')),
                        });
                      }}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  )}
                  {availableProviders.length > 0 && (
                    <AiAvailableProvidersPanel
                      providers={availableProviders}
                      serviceName={
                        Array.isArray(msg.details?.serviceNames) &&
                        msg.details.serviceNames.length > 0
                          ? msg.details.serviceNames.map(String).join(' and ')
                          : typeof msg.details?.serviceName === 'string'
                            ? msg.details.serviceName
                            : undefined
                      }
                      date={
                        typeof msg.details?.date === 'string' ? msg.details.date : undefined
                      }
                      variant="light"
                      primaryColor={primary}
                      onSelectSlot={(selection) =>
                        handleProviderSlotSelect(
                          msg.details,
                          selection,
                          Array.isArray(msg.details?.serviceNames) &&
                            msg.details.serviceNames.length > 0
                            ? msg.details.serviceNames.map(String).join(' and ')
                            : typeof msg.details?.serviceName === 'string'
                              ? msg.details.serviceName
                              : undefined,
                          typeof msg.details?.date === 'string'
                            ? msg.details.date
                            : undefined,
                        )
                      }
                      onBook={(composed) => void submit(composed)}
                    />
                  )}
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
