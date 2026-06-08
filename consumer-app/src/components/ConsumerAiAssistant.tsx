import { useCallback, useEffect, useRef, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonModal,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { closeOutline, sendOutline, sparklesOutline } from 'ionicons/icons';
import type { PublicBusinessProfile } from '../lib/types.js';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import { sendPublicAssistantMessage } from '../services/public-api.js';
import { ConsumerAiCommandFeedback } from './ConsumerAiCommandFeedback.js';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  success?: boolean;
  traceId?: string;
}

export function ConsumerAiAssistant({
  slug,
  profile,
  copy,
  locale,
}: {
  slug: string;
  profile: PublicBusinessProfile;
  copy: ConsumerCopy;
  locale: string;
}) {
  const primary = profile.branding.primaryColor || '#7c3aed';
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionContext, setSessionContext] = useState<Record<string, string | null>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const submit = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text: prompt }]);
    setInput('');
    setLoading(true);

    const history = messages.map((m) => ({ role: m.role, content: m.text }));

    try {
      const result = await sendPublicAssistantMessage(slug, {
        prompt,
        history,
        context: sessionContext,
        locale,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: result.summary,
          success: result.success,
          traceId: result.traceId,
        },
      ]);

      if (result.sessionContext) {
        setSessionContext((prev) => ({ ...prev, ...result.sessionContext! }));
      }
    } catch (err: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          text: err instanceof Error ? err.message : 'Something went wrong.',
          success: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, sessionContext, slug, locale]);

  return (
    <>
      <IonFab slot="fixed" vertical="bottom" horizontal="end" style={{ marginBottom: 72 }}>
        <IonFabButton
          color="primary"
          style={{ '--background': primary }}
          onClick={() => setOpen(true)}
          aria-label={copy.assistantTitle}
        >
          <IonIcon icon={sparklesOutline} />
        </IonFabButton>
      </IonFab>

      <IonModal isOpen={open} onDidDismiss={() => setOpen(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{copy.assistantTitle}</IonTitle>
            <IonButton slot="end" fill="clear" onClick={() => setOpen(false)}>
              <IonIcon icon={closeOutline} slot="icon-only" />
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div ref={scrollRef} className="consumer-ai-messages">
            {messages.length === 0 ? (
              <IonText color="medium">
                <p>{copy.assistantHint}</p>
              </IonText>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`consumer-ai-msg consumer-ai-msg--${msg.role}${
                    msg.success === false ? ' consumer-ai-msg--error' : ''
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.role === 'assistant' && (
                    <ConsumerAiCommandFeedback
                      slug={slug}
                      traceId={msg.traceId}
                      copy={copy}
                    />
                  )}
                </div>
              ))
            )}
            {loading && (
              <div className="consumer-ai-msg consumer-ai-msg--assistant">
                <IonSpinner name="dots" />
                <IonText color="medium">
                  <span>{copy.assistantThinking}</span>
                </IonText>
              </div>
            )}
          </div>

          <div className="consumer-ai-input-row">
            <IonInput
              value={input}
              placeholder={copy.assistantPlaceholder}
              disabled={loading}
              onIonInput={(e) => setInput(String(e.detail.value ?? ''))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void submit();
                }
              }}
            />
            <IonButton
              style={{ '--background': primary }}
              disabled={!input.trim() || loading}
              onClick={() => void submit()}
            >
              <IonIcon icon={sendOutline} slot="icon-only" />
            </IonButton>
          </div>
        </IonContent>
      </IonModal>
    </>
  );
}
