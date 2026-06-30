import { useState } from 'react';
import { IonButton } from '@ionic/react';
import type { ConsumerCopy } from '../lib/consumer-copy.types.js';
import type { ConsumerAiGuideResponse } from '../lib/consumer-assistant-guide.util.js';
import { hasConsumerAssistantGuideSteps } from '../lib/consumer-assistant-guide.util.js';
import { openZendeskMessengerWidget } from '../lib/guide-support-handoff.util.js';

export function ConsumerAiGuidePanel({
  guide,
  copy,
  onNavigate,
}: {
  guide: ConsumerAiGuideResponse;
  copy: ConsumerCopy;
  onNavigate?: (href: string) => void;
}) {
  const [cursor, setCursor] = useState(0);

  if (!hasConsumerAssistantGuideSteps(guide)) return null;

  const step = guide.steps[cursor];
  if (!step) return null;

  const atEnd = cursor >= guide.steps.length - 1;
  const navigateTarget = step.navigate ?? (atEnd ? guide.navigate : undefined);
  const supportHandoff = atEnd ? guide.supportHandoff : undefined;

  return (
    <div className="consumer-ai-guide">
      {guide.summary ? <p className="consumer-ai-guide__summary">{guide.summary}</p> : null}
      <div className="consumer-ai-guide__card">
        <p className="consumer-ai-guide__meta">
          {copy.assistantGuideStepOf
            .replace('{current}', String(cursor + 1))
            .replace('{total}', String(guide.steps.length))}
        </p>
        <p className="consumer-ai-guide__title">{step.title}</p>
        <p className="consumer-ai-guide__body">{step.body}</p>
        <div className="consumer-ai-guide__actions">
          {!atEnd ? (
            <IonButton
              size="small"
              onClick={() => setCursor((current) => Math.min(current + 1, guide.steps.length - 1))}
            >
              {copy.assistantGuideNextStep}
            </IonButton>
          ) : null}
          {navigateTarget?.path && onNavigate ? (
            <IonButton
              size="small"
              fill="outline"
              onClick={() => {
                const params = new URLSearchParams(navigateTarget.query ?? {});
                const qs = params.toString();
                onNavigate(`${navigateTarget.path}${qs ? `?${qs}` : ''}`);
              }}
            >
              {copy.assistantGuideOpenInApp}
            </IonButton>
          ) : null}
          {supportHandoff ? (
            <IonButton
              size="small"
              fill="outline"
              onClick={() => {
                openZendeskMessengerWidget();
              }}
            >
              {supportHandoff.label || copy.assistantGuideStillStuck}
            </IonButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}
