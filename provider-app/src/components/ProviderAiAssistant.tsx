import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonInput,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { chevronDownOutline, chevronUpOutline, sparklesOutline } from 'ionicons/icons';
import api, { unwrap } from '../services/api';

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
}

const EXAMPLES = [
  "Cancel all my today's appointments — I'm sick",
  "Mark John's appointment at 13:00 as done and paid",
  "Mark all today's appointments as done with payment paid",
  "What's on my schedule today?",
];

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
}: ProviderAiAssistantProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionContext, setSessionContext] = useState<SessionContext>({});
  const scrollRef = useRef<HTMLDivElement>(null);

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
        const history = [...messages, userMsg].slice(-10).map((m) => ({
          role: m.role,
          content: m.text,
        }));

        const { data: res } = await api.post(`/businesses/${businessId}/provider/ai/command`, {
          prompt: prompt.trim(),
          history,
          context: { ...sessionContext, ...screenContext },
        });
        const result = unwrap<{
          success: boolean;
          summary: string;
          details?: MessageDetails;
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
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { message?: string } } };
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'assistant',
            text: ax.response?.data?.message ?? 'Something went wrong. Try again.',
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
    [businessId, invalidateBookings, loading, messages, screenContext, sessionContext],
  );

  const confirmAction = useCallback(
    async (message: Message) => {
      const pending = message.details?.pendingAction;
      const bookingIds = message.details?.bookingIds;
      if (!pending || !bookingIds?.length || confirmingId) return;

      setConfirmingId(message.id);
      try {
        const { data: res } = await api.post(`/businesses/${businessId}/provider/ai/command/confirm`, {
          action: pending.action,
          bookingIds,
          params: pending.params,
        });
        const result = unwrap<{ success: boolean; summary: string; details?: MessageDetails }>(res);

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
        const ax = err as { response?: { data?: { message?: string } } };
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'assistant',
            text: ax.response?.data?.message ?? 'Could not confirm action.',
            success: false,
          },
        ]);
      } finally {
        setConfirmingId(null);
      }
    },
    [businessId, confirmingId, invalidateBookings],
  );

  return (
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
            AI Assistant
          </IonCardTitle>
        </IonCardHeader>
        <IonIcon icon={open ? chevronUpOutline : chevronDownOutline} />
      </div>

      {open && (
        <IonCardContent>
          <div className="ai-assistant-examples">
            {EXAMPLES.map((example) => (
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
                  Ask in plain language to cancel, mark done, update payment, or view your schedule.
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
                            <span>Try: &ldquo;{issue.example}&rdquo;</span>
                          </button>
                        ) : (
                          <p key={`${issue.field}-${issue.label}`} className="ai-assistant-clarify-line">
                            {issue.label}: {issue.message}
                          </p>
                        ),
                      )}
                    </div>
                  )}

                  {msg.details?.preview && msg.details.preview.length > 0 && (
                    <ul className="ai-assistant-preview">
                      {msg.details.preview.slice(0, 5).map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                      {msg.details.preview.length > 5 && (
                        <li>…and {msg.details.preview.length - 5} more</li>
                      )}
                    </ul>
                  )}
                  {msg.details?.requiresConfirmation && msg.details.pendingAction && (
                    <IonButton
                      size="small"
                      expand="block"
                      className="ion-margin-top"
                      onClick={() => void confirmAction(msg)}
                      disabled={confirmingId === msg.id}
                    >
                      {confirmingId === msg.id ? <IonSpinner name="crescent" /> : 'Confirm'}
                    </IonButton>
                  )}
                </div>
              ))
            )}
            {loading && (
              <div className="ai-assistant-msg ai-assistant-msg--assistant">
                <IonSpinner name="dots" />
              </div>
            )}
          </div>

          <form
            className="ai-assistant-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              void sendPrompt(input);
            }}
          >
            <IonInput
              value={input}
              placeholder="Tell me what to do…"
              onIonInput={(e) => setInput(e.detail.value ?? '')}
              disabled={loading}
            />
            <IonButton type="submit" disabled={loading || !input.trim()}>
              Send
            </IonButton>
          </form>
        </IonCardContent>
      )}
    </IonCard>
  );
}
