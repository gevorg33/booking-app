import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IonButton,
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
import { closeOutline, sparklesOutline } from 'ionicons/icons';
import {
  useDraggableFloatingPosition,
  useViewportSize,
} from '../lib/use-draggable-floating-position';
import { getProviderFabDefaultBottomInset } from '../lib/provider-tab-bar-layout.util';
import { ProviderBodyPortal } from './ProviderBodyPortal';
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
import { resolveProviderAiExamples } from '../lib/provider-ai-guide-examples';
import {
  mapDashboardServicesForAssistantExamples,
  type AssistantExampleTenantInput,
} from '../lib/assistant-example-tenant.util';
import { useAuthStore } from '../services/auth-store';
import {
  resolveAssistantModePayload,
  withAssistantModeContext,
} from '../lib/assistant-mode.util';
import { ProviderAiGuidePanel } from './ProviderAiGuidePanel';
import type { AiGuideResponse } from '../lib/ai-client.types';
import {
  getProviderQuickChips,
  type ProviderMobileRoute,
} from '../lib/provider-ai-quick-chips';
import { buildProviderAiCommandContext } from '../lib/provider-ai-command-context.util';
import { ProviderAiVoiceButton } from './ProviderAiVoiceButton';
import { ProviderAiSpeakReplyButton } from './ProviderAiSpeakReplyButton';
import { resolveAssistantSpeakText } from '../lib/provider-ai-guide-reply.util';
import { enableNativePush } from '../services/native-push';
import {
  isSpeechSynthesisSupported,
  localeToSpeechLang,
  speakText,
  type SpeechRecognitionErrorCode,
} from '../lib/use-speech-recognition.js';

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
  guideFlowId?: string | null;
  guideStepIndex?: number | null;
  completedSteps?: number[] | null;
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
  voiceSummary?: string;
  autoSpeak?: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  success?: boolean;
  guide?: AiGuideResponse;
  details?: MessageDetails;
}

export interface ProviderAiScreenContext {
  date?: string | null;
  customerName?: string | null;
  serviceName?: string | null;
  timeSlot?: string | null;
  route?: string;
  tab?: string;
  mobileRoute?: ProviderMobileRoute;
}

interface ProviderAiAssistantProps {
  businessId: string;
  screenContext?: ProviderAiScreenContext;
  seedPrompt?: string | null;
  onSeedPromptConsumed?: () => void;
  mobileRoute?: ProviderMobileRoute;
  isManager?: boolean;
  /** Test-only: start with panel open without FAB tap. */
  initialOpen?: boolean;
  overlaysVisible?: boolean;
}

function mergeSession(prev: SessionContext, next: SessionContext): SessionContext {
  return {
    customerName: next.customerName ?? prev.customerName,
    date: next.date ?? prev.date,
    timeSlot: next.timeSlot ?? prev.timeSlot,
    serviceName: next.serviceName ?? prev.serviceName,
    allAppointments: next.allAppointments ?? prev.allAppointments,
    guideFlowId: next.guideFlowId ?? prev.guideFlowId,
    guideStepIndex:
      next.guideStepIndex != null ? next.guideStepIndex : prev.guideStepIndex,
    completedSteps: next.completedSteps ?? prev.completedSteps,
  };
}

export default function ProviderAiAssistant({
  businessId,
  screenContext,
  seedPrompt,
  onSeedPromptConsumed,
  mobileRoute = 'today',
  isManager = false,
  initialOpen = false,
  overlaysVisible = true,
}: ProviderAiAssistantProps) {
  const { t, locale } = useI18n();
  const history = useHistory();
  const online = useOnlineStatus();
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const quickChips = getProviderQuickChips(mobileRoute, t, { isManager });
  const [guideMode, setGuideMode] = useState(false);
  const authEmployee = useAuthStore((state) => state.employee);
  const { data: exampleTenant } = useQuery({
    queryKey: ['provider-assistant-catalog', businessId],
    queryFn: async (): Promise<AssistantExampleTenantInput> => {
      const [employeesRes, servicesRes] = await Promise.all([
        api.get(`/businesses/${businessId}/employees`).catch(() => ({ data: { data: [] } })),
        api.get(`/businesses/${businessId}/services`).catch(() => ({ data: { data: [] } })),
      ]);
      const employees = unwrap<Array<{
        id: string;
        name: string;
        serviceIds?: string[];
        isActive?: boolean;
      }>>(employeesRes.data);
      const services = unwrap<Array<{
        id: string;
        name: string;
        isActive?: boolean;
        category?: { name?: string | null } | null;
      }>>(servicesRes.data);
      const normalizedEmployees =
        employees.length > 0
          ? employees
          : authEmployee
            ? [{ id: authEmployee.id, name: authEmployee.name, isActive: true }]
            : [];
      return {
        employees: normalizedEmployees,
        services: mapDashboardServicesForAssistantExamples(services),
      };
    },
    enabled: Boolean(businessId),
    staleTime: 60_000,
  });
  const examples = useMemo(
    () => resolveProviderAiExamples(t, guideMode, exampleTenant),
    [exampleTenant, guideMode, t],
  );
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(initialOpen);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionContext, setSessionContext] = useState<SessionContext>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const viewport = useViewportSize();
  const fabBottomInset = useMemo(() => getProviderFabDefaultBottomInset(), []);
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
      storageKey: `provider-ai-position-${businessId}`,
      estimatedSize,
      defaultBottomInset: fabBottomInset,
    });

  const closeAssistant = useCallback(() => {
    setOpen(false);
    setVoiceError(null);
  }, []);

  const openFab = useCallback(() => {
    setOpen(true);
  }, []);

  useProviderAiEvents(businessId, (type) => {
    if (type === 'ai.clarify' || type === 'ai.task.progress') setOpen(true);
  });

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAssistant();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeAssistant, open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

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

        const assistantMode = resolveAssistantModePayload(guideMode);
        const { data: res } = await api.post(`/businesses/${businessId}/provider/ai/command`, {
          prompt: prompt.trim(),
          history,
          context: withAssistantModeContext(
            buildProviderAiCommandContext({
              sessionContext: {
                ...sessionContext,
                nativePlatform: Capacitor.getPlatform(),
              },
              screenContext,
              mobileRoute,
            }),
            guideMode,
          ),
          ...(assistantMode ? { assistantMode } : {}),
        });
        const result = unwrap<{
          success: boolean;
          summary: string;
          guide?: AiGuideResponse;
          details?: MessageDetails & {
            navigate?: { path?: string; query?: Record<string, string> };
            clientAction?: string;
            voiceSummary?: string;
            autoSpeak?: boolean;
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
            guide: result.guide,
            details: result.details,
          },
        ]);

        const speakPayload = resolveAssistantSpeakText({
          summary: result.summary,
          guide: result.guide,
          voiceSummary:
            typeof result.details?.voiceSummary === 'string'
              ? result.details.voiceSummary
              : undefined,
        });
        if (result.details?.autoSpeak && speakPayload) {
          speakText(speakPayload, localeToSpeechLang(locale));
        }

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
    [businessId, guideMode, history, invalidateBookings, loading, locale, messages, online, screenContext, sessionContext, t],
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

  const showSuggestions = messages.length === 0 && !loading;

  const assistantPanel = open ? (
          <div className="ai-assistant-card__body">
          {showSuggestions && (
            <div className="ai-assistant-suggestions">
              {quickChips.length > 0 && (
                <div className="ai-assistant-quick-chips">
                  <p className="booking-meta ai-assistant-quick-chips__label">{t('provider.quickChipsTitle')}</p>
                  <div className="ai-assistant-quick-chips__row">
                    {quickChips.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="ai-assistant-quick-chip"
                        onClick={() => {
                          if (c.id === 'teamWhosNext') {
                            window.dispatchEvent(new CustomEvent('provider:show-team-whos-next'));
                          }
                          void sendPrompt(c.prompt);
                        }}
                        disabled={loading}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="ai-assistant-examples">
                <div className="ai-assistant-guide-toggle">
                  <button
                    type="button"
                    className={`ai-assistant-guide-chip${guideMode ? ' ai-assistant-guide-chip--active' : ''}`}
                    aria-pressed={guideMode}
                    title={t('provider.assistantHelpChipHint')}
                    onClick={() => setGuideMode((active) => !active)}
                  >
                    {t('provider.assistantHelpChip')}
                  </button>
                  <p className="booking-meta ai-assistant-guide-toggle__hint">
                    {guideMode
                      ? t('provider.assistantGuideExamples')
                      : t('provider.assistantEmptyHint')}
                  </p>
                </div>
                <div className="ai-assistant-examples__list">
                  {examples.slice(0, 3).map((example) => (
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
              </div>
            </div>
          )}

          <div ref={scrollRef} className="ai-assistant-messages">
            {messages.length === 0 ? (
              !showSuggestions ? (
                <IonText color="medium">
                  <p className="booking-meta">{t('provider.assistantEmptyHint')}</p>
                </IonText>
              ) : null
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
                  {msg.guide ? (
                    <ProviderAiGuidePanel
                      guide={msg.guide}
                      onNavigate={(path) => history.push(path)}
                    />
                  ) : (
                    <p>{msg.text}</p>
                  )}

                  {msg.role === 'assistant' && isSpeechSynthesisSupported() ? (
                    <ProviderAiSpeakReplyButton
                      text={resolveAssistantSpeakText({
                        text: msg.text,
                        summary: msg.text,
                        guide: msg.guide,
                        voiceSummary:
                          typeof msg.details?.voiceSummary === 'string'
                            ? msg.details.voiceSummary
                            : undefined,
                      })}
                      locale={locale}
                      label={t('ai.speakReply')}
                    />
                  ) : null}

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

          <div className="ai-assistant-composer">
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
          </div>
          </div>
  ) : null;

  if (!overlaysVisible) return null;

  return (
    <ProviderBodyPortal>
      {!open ? (
        <button
          ref={floatingRef}
          type="button"
          data-testid="provider-ai-fab"
          {...bindDragHandle({ onPress: openFab })}
          className="provider-ai-fab"
          style={{
            ...floatingStyle,
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          aria-label={t('provider.openAssistantFab')}
        >
          <IonIcon icon={sparklesOutline} style={{ fontSize: 28, pointerEvents: 'none' }} />
        </button>
      ) : (
        <div
          ref={floatingRef}
          className="ai-assistant-card ai-assistant-card--floating"
          style={floatingStyle}
        >
          <div className="ai-assistant-card__header">
            <div {...bindDragHandle()} className="ai-assistant-card__header-drag">
              <IonIcon icon={sparklesOutline} className="ai-assistant-card__icon" />
              <span className="ai-assistant-card__title">{t('provider.assistantTitle')}</span>
            </div>
            <button
              type="button"
              className="ai-assistant-card__close"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={closeAssistant}
              aria-label={t('provider.assistantClose')}
            >
              <IonIcon icon={closeOutline} />
            </button>
          </div>
          {assistantPanel}
        </div>
      )}
    </ProviderBodyPortal>
  );
}
