import { useState } from 'react';
import { IonButton } from '@ionic/react';
import { useI18n } from '../i18n';
import type { AiGuideResponse } from '../lib/ai-client.types';

function hasGuideSteps(
  guide: AiGuideResponse | null | undefined,
): guide is AiGuideResponse {
  return Boolean(guide?.steps?.length);
}

export function ProviderAiGuidePanel({
  guide,
  onNavigate,
}: {
  guide: AiGuideResponse;
  onNavigate?: (path: string) => void;
}) {
  const { t } = useI18n();
  const [cursor, setCursor] = useState(0);

  if (!hasGuideSteps(guide)) return null;

  const step = guide.steps[cursor];
  if (!step) return null;

  const atEnd = cursor >= guide.steps.length - 1;
  const navigateTarget = step.navigate ?? (atEnd ? guide.navigate : undefined);

  return (
    <div className="ai-assistant-guide">
      {guide.summary ? <p className="booking-meta">{guide.summary}</p> : null}
      <div className="ai-assistant-guide-card">
        <p className="booking-meta">
          {t('ai.guideStepOf', {
            current: cursor + 1,
            total: guide.steps.length,
          })}
        </p>
        <p>{step.title}</p>
        <p className="booking-meta">{step.body}</p>
        <div className="ai-assistant-guide-actions">
          {!atEnd ? (
            <IonButton
              size="small"
              onClick={() => setCursor((current) => Math.min(current + 1, guide.steps.length - 1))}
            >
              {t('ai.guideNextStep')}
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
              {t('ai.guideOpenInApp')}
            </IonButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}
