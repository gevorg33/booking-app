import { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useQueryClient } from '@tanstack/react-query';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { chevronDownOutline, chevronUpOutline, sparklesOutline } from 'ionicons/icons';
import api, { unwrap } from '../services/api';
import {
  aiConfirmErrorMessage,
  applyAiConfirmOptimistic,
  networkPromptErrorMessage,
  offlinePromptBlockedMessage,
  prepareAiConfirmSnapshots,
  resolveAiConfirmResponse,
  rollbackAiConfirmSnapshots,
} from '../lib/provider-ai-assistant-offline.util';
import { useProviderAiEvents } from '../lib/use-ai-events';
import { useOnlineStatus } from '../lib/use-online-status';
import { useI18n } from '../i18n';
import { buildProviderAiExamples } from '../lib/provider-ai-examples';
import {
  getProviderQuickChips,
  type ProviderMobileRoute,
} from '../lib/provider-ai-quick-chips';
import { ProviderAiVoiceButton } from './ProviderAiVoiceButton';
import { enableNativePush } from '../services/native-push';
import type { SpeechRecognitionErrorCode } from '../lib/use-speech-recognition.js';

interface PreviewItem {
  id: string;
  customerName: string;
  serviceName: string;
  time: string;
  initials: string;
}

interface ClarifyIssue {
  field: string;
  label: string;
  message: string;
  example?: string;
}

interface SessionContext {
  customerName?: string | null;
  date?: string | null;
  timeSlot?: string | null;
  serviceName?: string | null;
  allAppointments?: boolean | null;
}

interface MessageDetails {
  requiresConfirmation?: boolean;
  needsClarification?: boolean;
  missing?: ClarifyIssue[];
  bookingIds?: string[];
  preview?: string[];
  previewItems?: PreviewItem[];
  pendingAction?: { action: string; params?: Record<string, unknown> };
  sessionContext?: SessionContext;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  success?: boolean;
  details?: MessageDetails;
}

export interface ProviderAiScreenContext {
  date?: string | null;
  customerName?: string | null;
  serviceName?: string | null;
  timeSlot?: string | null;
  route?: string;
}

interface ProviderAiAssistantProps {
  businessId: string;
  screenContext?: ProviderAiScreenContext;
  seedPrompt?: string | null;
  onSeedPromptConsumed?: () => void;
  mobileRoute?: ProviderMobileRoute;
  isManager?: boolean;
}

function mergeSession(prev: SessionContext, next: SessionContext): SessionContext {
  return {
    customerName: next.customerName ?? prev.customerName,
    date: next.date ?? prev.date,
    timeSlot: next.timeSlot ?? prev.timeSlot,
    serviceName: next.serviceName ?? prev.serviceName,
    allAppointments: next.allAppointments ?? prev.allAppointments,
  };
}

export default function ProviderAiAssistant({
  businessId,
  screenContext,
  seedPrompt,
  onSeedPromptConsumed,
  mobileRoute = 'today',
  isManager = false,
}: ProviderAiAssistantProps) {
  const { t, locale } = useI18n();
  const history = useHistory();
  const online = useOnlineStatus();
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const quickChips = getProviderQuickChips(mobileRoute, t, { isManager });
  const examples = buildProviderAiExamples(t);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionContext, setSessionContext] = useState<SessionContext>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  useProviderAiEvents(businessId, (type) => {
    if (type === 'ai.clarify' || type === 'ai.task.progress') setOpen(true);
  });

  const invalidateBookings = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['provider-today', businessId] });
    void queryClient.invalidateQueries({ queryKey: ['provider-upcoming', businessId] });
    void queryClient.invalidateQueries({ queryKey: ['provider-schedule-summary', businessId] });
  }, [businessId, queryClient]);

  const sendPrompt = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || loading) return;

      const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text: prompt.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setLoading(true);

      try {
        if (!online) {
          setMessages((prev) => [
            ...prev,
            {
              id: `e-${Date.now()}`,
              role: 'assistant',
              text: offlinePromptBlockedMessage(t),
              success: false,
            },
          ]);
          return;
        }

        const history = [...messages, userMsg].slice(-10).map((m) => ({
          role: m.role,
          content: m.text,
        }));

        const { data: res } = await api.post(`/businesses/${businessId}/provider/ai/command`, {
          prompt: prompt.trim(),
          history,
          context: {
            ...sessionContext,
            ...screenContext,
            nativePlatform: Capacitor.getPlatform(),
          },
        });
        const result = unwrap<{
          success: boolean;
          summary: string;
          details?: MessageDetails & {
            navigate?: { path?: string; query?: Record<string, string> };
            clientAction?: string;
          };
        }>(res);

        if (result.details?.sessionContext) {
          setSessionContext((prev) => mergeSession(prev, result.details!.sessionContext!));
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            text: result.summary,
            success: result.success,
            details: result.details,
          },
        ]);

        if (result.success && !result.details?.requiresConfirmation) {
          invalidateBookings();
        }

        const navigate = result.details?.navigate;
        if (navigate?.path) {
          const params = new URLSearchParams(navigate.query ?? {});
          const qs = params.toString();
          history.push(`${navigate.path}${qs ? `?${qs}` : ''}`);
          if (result.details?.clientAction === 'enableNativePush') {
            void enableNativePush(businessId);
          }
        }
      } catch (err: unknown) {
        const text = networkPromptErrorMessage(err, t, 'provider.assistantErrorGeneric');
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'assistant',
            text,
            success: false,
          },
        ]);
      } finally {
        setLoading(false);
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        });
      }
    },
    [businessId, history, invalidateBookings, loading, messages, online, screenContext, sessionContext, t],
  );

  const confirmAction = useCallback(
    async (message: Message) => {
      const pending = message.details?.pendingAction;
      const bookingIds = message.details?.bookingIds;
      if (!pending || !bookingIds?.length || confirmingId) return;

      setConfirmingId(message.id);
      const snapshots = prepareAiConfirmSnapshots(queryClient, businessId, bookingIds);
      applyAiConfirmOptimistic(queryClient, businessId, bookingIds, pending);

      try {
        const response = await api.post(`/businesses/${businessId}/provider/ai/command/confirm`, {
          action: pending.action,
          bookingIds,
          params: pending.params,
        });

        const resolved = resolveAiConfirmResponse(response, t);
        if (resolved.kind === 'queued') {
          setMessages((prev) => [
            ...prev,
            {
              id: `c-${Date.now()}`,
              role: 'assistant',
              text: resolved.summary,
              success: true,
            },
          ]);
          return;
        }

        const result = unwrap<{ success: boolean; summary: string; details?: MessageDetails }>(
          resolved.data,
        );

        if (result.details?.sessionContext) {
          setSessionContext((prev) => mergeSession(prev, result.details!.sessionContext!));
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `c-${Date.now()}`,
            role: 'assistant',
            text: result.summary,
            success: result.success,
          },
        ]);
        invalidateBookings();
      } catch (err: unknown) {
        rollbackAiConfirmSnapshots(queryClient, businessId, snapshots);
        const text = aiConfirmErrorMessage(err, t);
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'assistant',
            text,
            success: false,
          },
        ]);
      } finally {
        setConfirmingId(null);
      }
    },
    [businessId, confirmingId, invalidateBookings, queryClient, t],
  );

  useEffect(() => {
    if (!seedPrompt?.trim()) return;
    setOpen(true);
    void sendPrompt(seedPrompt);
    onSeedPromptConsumed?.();
  }, [seedPrompt, onSeedPromptConsumed, sendPrompt]);

  useEffect(() => {
    const onAiPrompt = (e: Event) => {
      const prompt = (e as CustomEvent<{ prompt?: string }>).detail?.prompt;
      if (!prompt?.trim()) return;
      setOpen(true);
      void sendPrompt(prompt);
    };
    window.addEventListener('provider:ai-prompt', onAiPrompt);
    return () => window.removeEventListener('provider:ai-prompt', onAiPrompt);
  }, [sendPrompt]);

  return (
    <>
      <IonCard className="ai-assistant-card ion-margin-bottom">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setOpen((v) => !v);
        }}
        className="ai-assistant-card__header"
      >
        <IonCardHeader>
          <IonCardTitle className="ai-assistant-card__title">
            <IonIcon icon={sparklesOutline} className="ai-assistant-card__icon" />
            {t('provider.assistantTitle')}
          </IonCardTitle>
        </IonCardHeader>
        <IonIcon icon={open ? chevronUpOutline : chevronDownOutline} />
      </div>

      {open && (
        <IonCardContent>
          {quickChips.length > 0 && (
            <div className="ai-assistant-quick-chips">
              <p className="booking-meta ai-assistant-quick-chips__label">{t('provider.quickChipsTitle')}</p>
              <div className="ai-assistant-quick-chips__row">
                {quickChips.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="ai-assistant-quick-chip"
                    onClick={() => void sendPrompt(c.prompt)}
                    disabled={loading}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="ai-assistant-examples">
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                className="ai-assistant-example"
                onClick={() => void sendPrompt(example)}
                disabled={loading}
              >
                {example}
              </button>
            ))}
          </div>

          <div ref={scrollRef} className="ai-assistant-messages">
            {messages.length === 0 ? (
              <IonText color="medium">
                <p className="booking-meta">
                  {t('provider.assistantEmptyHint')}
                </p>
              </IonText>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`ai-assistant-msg ai-assistant-msg--${msg.role}${
                    msg.details?.needsClarification
                      ? ' ai-assistant-msg--clarify'
                      : msg.success === false
                        ? ' ai-assistant-msg--error'
                        : ''
                  }`}
                >
                  <p>{msg.text}</p>

                  {msg.details?.needsClarification && Array.isArray(msg.details.missing) && (
                    <div className="ai-assistant-clarify">
                      {msg.details.missing.map((issue) =>
                        issue.example ? (
                          <button
                            key={`${issue.field}-${issue.label}`}
                            type="button"
                            className="ai-assistant-clarify-btn"
                            onClick={() => {
                              setInput(issue.example!);
                            }}
                          >
                            {issue.label}: {issue.message}
                            <span>
                              {t('provider.assistantClarifyTry')} &ldquo;{issue.example}&rdquo;
                            </span>
                          </button>
                        ) : (
                          <p key={`${issue.field}-${issue.label}`} className="ai-assistant-clarify-line">
                            {issue.label}: {issue.message}
                          </p>
                        ),
                      )}
                    </div>
                  )}

                  {msg.details?.previewItems && msg.details.previewItems.length > 0 ? (
                    <div className="ai-assistant-preview-list">
                      {msg.details.previewItems.map((item) => (
                        <div key={item.id} className="ai-assistant-preview-row">
                          <span className="ai-assistant-preview-avatar">{item.initials}</span>
                          <div className="ai-assistant-preview-copy">
                            <strong>{item.customerName}</strong>
                            <span>{item.time}</span>
                            <span className="booking-meta">{item.serviceName}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    msg.details?.preview &&
                    msg.details.preview.length > 0 && (
                      <ul className="ai-assistant-preview">
                        {msg.details.preview.slice(0, 5).map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                        {msg.details.preview.length > 5 && (
                          <li>
                            {t('provider.assistantPreviewMore', {
                              count: msg.details.preview.length - 5,
                            })}
                          </li>
                        )}
                      </ul>
                    )
                  )}

                  {msg.details?.requiresConfirmation && msg.details.pendingAction && (
                    <>
                      <p className="ai-assistant-swipe-hint booking-meta">
                        {t('provider.assistantSwipeHint')}
                      </p>
                      <IonItemSliding className="ai-assistant-confirm-slide">
                        <IonItem lines="none" className="ai-assistant-confirm-item">
                          <IonLabel>
                            <h3>
                              {t('provider.assistantConfirmChanges', {
                                count:
                                  msg.details.previewItems?.length ??
                                  msg.details.bookingIds?.length ??
                                  0,
                              })}
                            </h3>
                            <p>{t('provider.assistantSwipeConfirm')}</p>
                          </IonLabel>
                        </IonItem>
                        <IonItemOptions side="end">
                          <IonItemOption
                            color="danger"
                            onClick={() => void confirmAction(msg)}
                            disabled={confirmingId === msg.id}
                          >
                            {confirmingId === msg.id
                              ? t('provider.assistantWorking')
                              : t('provider.assistantConfirm')}
                          </IonItemOption>
                        </IonItemOptions>
                      </IonItemSliding>
                      <IonButton
                        size="small"
                        expand="block"
                        className="ion-margin-top"
                        onClick={() => void confirmAction(msg)}
                        disabled={confirmingId === msg.id}
                      >
                        {confirmingId === msg.id ? (
                          <IonSpinner name="crescent" />
                        ) : (
                          t('provider.assistantConfirmAll')
                        )}
                      </IonButton>
                    </>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div className="ai-assistant-msg ai-assistant-msg--assistant">
                <p className="ai-assistant-thinking">{t('ai.thinking')}</p>
              </div>
            )}
          </div>

          {voiceError && (
            <IonText color="danger">
              <p className="booking-meta">{voiceError}</p>
            </IonText>
          )}

          <form
            className="ai-assistant-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              void sendPrompt(input);
            }}
          >
            <ProviderAiVoiceButton
              disabled={loading}
              inputValue={input}
              locale={locale}
              labels={{
                start: t('provider.voiceStart'),
                stop: t('provider.voiceStop'),
              }}
              onTranscript={(text) => {
                setVoiceError(null);
                setInput(text);
              }}
              onError={(code: SpeechRecognitionErrorCode) => {
                const key =
                  code === 'unsupported'
                    ? 'provider.voiceUnsupported'
                    : code === 'not-allowed'
                      ? 'provider.voiceDenied'
                      : code === 'no-speech'
                        ? 'provider.voiceNoSpeech'
                        : 'provider.voiceError';
                setVoiceError(t(key));
              }}
            />
            <IonInput
              value={input}
              placeholder={t('provider.assistantInputPlaceholder')}
              onIonInput={(e) => setInput(e.detail.value ?? '')}
              disabled={loading}
            />
            <IonButton type="submit" disabled={loading || !input.trim()}>
              {t('ai.send')}
            </IonButton>
          </form>
        </IonCardContent>
      )}
    </IonCard>
    </>
  );
}
