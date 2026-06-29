import {
  IonButton,
  IonIcon,
  IonInput,
  IonSpinner,
} from '@ionic/react';
import { close, send, sparkles } from 'ionicons/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import type { PublicBusinessProfile } from '../lib/types.js';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import { getConsumerDiscoveryChips } from '../lib/consumer-discovery-chips.js';
import { getConsumerFabDefaultBottomInset } from '../lib/consumer-tab-bar-layout.util.js';
import {
  useDraggableFloatingPosition,
  useViewportSize,
} from '../lib/use-draggable-floating-position.js';
import { ConsumerBodyPortal } from './ConsumerBodyPortal.js';
import {
  sendPublicAssistantMessage,
  type PublicAssistantResponse,
} from '../services/public-api.js';
import {
  buildProviderBookingPrompt,
  normalizeAvailableProviders,
  type AiAvailableProvider,
} from '../lib/ai-available-providers.util.js';
import {
  buildPublicAssistantCheckoutNavigate,
  shouldAutoNavigateAssistantCheckout,
} from '../lib/public-assistant-checkout.util.js';
import {
  hasConsumerAssistantGuideSteps,
  resolveConsumerAssistantExampleKeys,
} from '../lib/consumer-assistant-guide.util.js';
import {
  resolveAssistantModePayload,
  withAssistantModeContext,
} from '../lib/assistant-mode.util.js';
import { ConsumerAiGuidePanel } from './ConsumerAiGuidePanel.js';
import type { ConsumerAiGuideResponse } from '../lib/consumer-assistant-guide.util.js';
import { buildConsumerAssistantHref } from '../lib/consumer-assistant-navigate.util.js';
import { AiAvailableProvidersPanel } from './AiAvailableProvidersPanel.js';
import {
  ConsumerAiSpeakReplyButton,
  ConsumerAiVoiceInputButton,
} from './ConsumerAiVoiceControls.js';
import {
  isSpeechSynthesisSupported,
  type SpeechRecognitionErrorCode,
} from '../lib/use-speech-recognition.js';
import { loadRecentSalons } from '../lib/recent-salons.js';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  navigate?: PublicAssistantResponse['navigate'];
  guide?: ConsumerAiGuideResponse;
  success?: boolean;
  details?: Record<string, unknown>;
}

interface SessionContext {
  employeeName?: string | null;
  date?: string | null;
  serviceName?: string | null;
  timeSlot?: string | null;
  customerName?: string | null;
  screen?: string | null;
  recentSalons?: Array<{ slug: string; name: string }>;
}

export function ConsumerBookingAssistant({
  slug,
  profile,
  copy,
  locale,
  overlaysVisible = true,
}: {
  slug: string;
  profile: PublicBusinessProfile;
  copy: ConsumerCopy;
  locale: string;
  overlaysVisible?: boolean;
}) {
  const history = useHistory();
  const location = useLocation();
  const primary = profile.branding.primaryColor || '#7c3aed';
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [guideMode, setGuideMode] = useState(false);
  const [sessionContext, setSessionContext] = useState<SessionContext>({});
  const exampleKeys = useMemo(
    () => resolveConsumerAssistantExampleKeys(guideMode),
    [guideMode],
  );
  const assistantContext = useMemo(
    () => ({
      ...sessionContext,
      screen: location.pathname,
      recentSalons: loadRecentSalons().map((salon) => ({
        slug: salon.slug,
        name: salon.name,
      })),
    }),
    [location.pathname, sessionContext, open],
  );
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const viewport = useViewportSize();
  const fabBottomInset = useMemo(() => getConsumerFabDefaultBottomInset(), []);
  const discoveryChips = useMemo(() => getConsumerDiscoveryChips(copy), [copy]);
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
      storageKey: `consumer-ai-position-${slug}`,
      estimatedSize,
      defaultBottomInset: fabBottomInset,
    });

  const closeAssistant = useCallback(() => {
    setOpen(false);
    setMessages([]);
    setSessionContext({});
    setVoiceError(null);
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
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const followNavigate = useCallback(
    (navigate?: PublicAssistantResponse['navigate']) => {
      if (!navigate) return;
      const href = buildConsumerAssistantHref(slug, navigate);
      if (!href) return;
      history.push(href);
      setOpen(false);
    },
    [history, slug],
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

      const historyPayload = messages.map((m) => ({ role: m.role, content: m.text }));

      try {
        const assistantMode = resolveAssistantModePayload(guideMode);
        const result = await sendPublicAssistantMessage(slug, {
          prompt,
          history: historyPayload,
          context: withAssistantModeContext(
            assistantContext as Record<string, unknown>,
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

        if (
          shouldAutoNavigateAssistantCheckout(prompt, result.navigate, result.success)
        ) {
          followNavigate(result.navigate);
        }
      } catch (err: unknown) {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'assistant',
            text: err instanceof Error ? err.message : copy.assistantErrorGeneric,
            success: false,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [
      assistantContext,
      copy.assistantErrorGeneric,
      followNavigate,
      guideMode,
      input,
      loading,
      locale,
      messages,
      slug,
    ],
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
          ? copy.voiceUnsupported
          : code === 'not-allowed'
            ? copy.voiceDenied
            : code === 'no-speech'
              ? copy.voiceNoSpeech
              : copy.voiceError;
      setVoiceError(message);
    },
    [copy.voiceDenied, copy.voiceError, copy.voiceNoSpeech, copy.voiceUnsupported],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  return overlaysVisible ? (
    <ConsumerBodyPortal>
      {!open ? (
        <button
          ref={floatingRef}
          type="button"
          {...bindDragHandle({ onPress: () => setOpen(true) })}
          style={{
            ...floatingStyle,
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: 'none',
            background: primary,
            color: '#fff',
            boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          aria-label={copy.assistantTitle}
        >
          <IonIcon icon={sparkles} style={{ fontSize: 26, pointerEvents: 'none' }} />
        </button>
      ) : (
        <div
          ref={floatingRef}
          style={{
            ...floatingStyle,
            width: 'min(calc(100vw - 32px), 400px)',
            maxHeight: 'min(80vh, 560px)',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 16,
            boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid #f3f4f6',
            }}
          >
            <div
              {...bindDragHandle()}
              style={{
                display: 'flex',
                flex: 1,
                alignItems: 'center',
                gap: 8,
                minWidth: 0,
                userSelect: 'none',
              }}
            >
              <IonIcon icon={sparkles} style={{ color: primary, pointerEvents: 'none' }} />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#111827',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                {copy.assistantTitle}
              </span>
            </div>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={closeAssistant}
              style={{
                marginLeft: 8,
                padding: 4,
                border: 'none',
                background: 'transparent',
                color: '#9ca3af',
                cursor: 'pointer',
              }}
              aria-label={copy.assistantClose}
            >
              <IonIcon icon={close} />
            </button>
          </div>

          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 16,
              minHeight: 180,
            }}
          >
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
                <div style={{ marginBottom: 12 }}>
                  <button
                    type="button"
                    aria-pressed={guideMode}
                    title={copy.assistantHelpChipHint}
                    onClick={() => setGuideMode((active) => !active)}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: guideMode ? primary : '#6b7280',
                      background: guideMode ? `${primary}14` : '#f9fafb',
                      border: `1px solid ${guideMode ? `${primary}55` : '#e5e7eb'}`,
                      borderRadius: 999,
                      padding: '8px 14px',
                    }}
                  >
                    {copy.assistantHelpChip}
                  </button>
                </div>
                <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
                  {guideMode ? copy.assistantGuideExamples : copy.assistantHint}
                </p>
                <div style={{ marginBottom: 16 }}>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: '#9ca3af',
                      marginBottom: 8,
                    }}
                  >
                    {copy.assistantDiscoverChipsTitle}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      justifyContent: 'center',
                    }}
                  >
                    {discoveryChips.map((chip) => (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => setInput(chip.prompt)}
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: primary,
                          background: `${primary}14`,
                          border: `1px solid ${primary}33`,
                          borderRadius: 999,
                          padding: '8px 12px',
                        }}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {exampleKeys.map((key) => {
                    const example = copy[key as keyof typeof copy] as string;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setInput(example)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          fontSize: 12,
                          color: '#4b5563',
                          background: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          borderRadius: 12,
                          padding: '10px 12px',
                        }}
                      >
                        &ldquo;{example}&rdquo;
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isAssistant = msg.role === 'assistant';
              const isError = isAssistant && msg.success === false && !msg.navigate;
              const isAction = isAssistant && !!msg.navigate;
              const availableProviders = isAssistant
                ? normalizeAvailableProviders(msg.details)
                : [];

              const bubbleStyle: React.CSSProperties = isUser
                ? { backgroundColor: primary, color: '#fff' }
                : isError
                  ? { backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }
                  : isAction
                    ? {
                        backgroundColor: `${primary}14`,
                        border: `1px solid ${primary}33`,
                        color: '#1f2937',
                      }
                    : msg.success === true
                      ? {
                          backgroundColor: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          color: '#065f46',
                        }
                      : {
                          backgroundColor: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          color: '#1f2937',
                        };

              return (
                <div
                  key={msg.id}
                  className={isUser ? 'consumer-ai-msg--user' : 'consumer-ai-msg--assistant'}
                  style={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      maxWidth: '92%',
                      borderRadius: 16,
                      padding: '10px 12px',
                      fontSize: 14,
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      ...bubbleStyle,
                    }}
                  >
                    {hasConsumerAssistantGuideSteps(msg.guide) ? (
                      <ConsumerAiGuidePanel
                        guide={msg.guide}
                        copy={copy}
                        onNavigate={(href) => {
                          const nav = buildConsumerAssistantHref(slug, {
                            path: href.split('?')[0] ?? href,
                            query: Object.fromEntries(
                              new URLSearchParams(href.split('?')[1] ?? ''),
                            ),
                          });
                          if (nav) {
                            history.push(nav);
                            setOpen(false);
                          }
                        }}
                      />
                    ) : (
                      <p style={{ margin: 0 }}>{msg.text}</p>
                    )}
                    {availableProviders.length > 0 ? (
                      <AiAvailableProvidersPanel
                        providers={availableProviders}
                        copy={copy}
                        primaryColor={primary}
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
                            typeof msg.details?.date === 'string' ? msg.details.date : undefined,
                          )
                        }
                        onBook={(composed) => void submit(composed)}
                      />
                    ) : null}
                    {isAssistant && isSpeechSynthesisSupported() ? (
                      <ConsumerAiSpeakReplyButton
                        text={msg.text}
                        locale={locale}
                        label={copy.speakReply}
                        primaryColor={primary}
                      />
                    ) : null}
                    {msg.navigate && isAssistant ? (
                      <IonButton
                        size="small"
                        style={{
                          marginTop: 8,
                          '--background': primary,
                          height: 30,
                          fontSize: 12,
                        }}
                        onClick={() => followNavigate(msg.navigate)}
                      >
                        {copy.assistantContinueBooking}
                      </IonButton>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: 16,
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <IonSpinner name="dots" style={{ width: 16, height: 16 }} />
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{copy.assistantThinking}</span>
                </div>
              </div>
            ) : null}
          </div>

          <div
            style={{
              padding: '12px 12px calc(12px + env(safe-area-inset-bottom, 0px))',
              borderTop: '1px solid #e5e7eb',
              background: '#fff',
            }}
          >
            {voiceError ? (
              <p style={{ fontSize: 10, color: '#b45309', margin: '0 0 6px 4px' }}>{voiceError}</p>
            ) : null}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <ConsumerAiVoiceInputButton
                disabled={loading}
                locale={locale}
                primaryColor={primary}
                labels={{ start: copy.voiceStart, stop: copy.voiceStop }}
                onTranscript={(text) => {
                  setVoiceError(null);
                  setInput(text);
                }}
                onError={handleVoiceError}
              />
              <IonInput
                value={input}
                disabled={loading}
                placeholder={copy.assistantPlaceholder}
                onIonInput={(e) => setInput(e.detail.value ?? '')}
                onKeyDown={onKeyDown}
                style={{
                  flex: 1,
                  '--background': '#f9fafb',
                  '--padding-start': '12px',
                  '--padding-end': '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                }}
              />
              <IonButton
                disabled={!input.trim() || loading}
                style={{ '--background': primary, margin: 0 }}
                onClick={() => void submit()}
                aria-label="Send"
              >
                <IonIcon icon={send} slot="icon-only" />
              </IonButton>
            </div>
          </div>
        </div>
      )}
    </ConsumerBodyPortal>
  ) : null;
}
