'use client';

import { Sparkles } from 'lucide-react';
import { useI18n } from '@/i18n';
import { fireGuideAssistantSeedForTopic } from '@/lib/dashboard-guide-hash.util';

interface GuideTopicAskAiButtonProps {
  topicId: string;
  className?: string;
}

export function GuideTopicAskAiButton({ topicId, className }: GuideTopicAskAiButtonProps) {
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={() => fireGuideAssistantSeedForTopic(topicId, t)}
      className={
        className ??
        'inline-flex items-center gap-1.5 text-sm font-medium text-violet-300 hover:text-violet-200 transition-colors'
      }
    >
      <Sparkles className="w-3.5 h-3.5" />
      {t('ai.guideAskAi')}
    </button>
  );
}
