'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Sparkles, Send, X, ChevronDown, ChevronUp, Undo2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  useDraggableFloatingPosition,
  useViewportSize,
} from '@/lib/use-draggable-floating-position';
import {
  AI_MUTATION_QUERY_KEYS,
  buildAiRequestContext,
  getAiPageContext,
  type AiPageContext,
} from '@/lib/ai-orchestration';
import { resolveCommandBarExamples } from '@/lib/ai-command-bar-examples.util';
import { useOrchestrixEvents } from '@/components/ai-proactive-suggestions';
import { AiAvailableProvidersPanel } from '@/components/ai-available-providers-panel';
import { AiClarifyForm, type ClarifyIssue } from '@/components/ai-clarify-form';
import { AiExecutionTimeline } from '@/components/ai-execution-timeline';
import { normalizeAvailableProviders } from '@/lib/ai-available-providers.util';
import { useAiEvents } from '@/lib/use-ai-events';
import { normalizeExecutionTimeline } from '@/lib/ai-clarify.util';
import {
  extractSessionContext,
  findLastUndoableMessageId,
  mergeSessionContext,
  shouldInvalidateAfterAi,
  type AiCommandSessionContext,
} from '@/lib/ai-command-bar.util';
import { confirmDialog } from '@/lib/app-dialog';
import { PlanDiffPreview } from '@/components/ai-agent-workspaces';
import { AiCommandWizard, type WizardStepView } from '@/components/ai-command-wizard';
import { AiCommandMacrosPanel } from '@/components/ai-command-macros-panel';
import { AiSpeakReplyButton, AiVoiceInputButton } from '@/components/ai-voice-controls';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/i18n';
import type { OnboardingAiStep } from '@/lib/ai-onboarding.util';
import type { SpeechRecognitionErrorCode } from '@/lib/use-speech-recognition';
import { isPlanLimitError, planLimitMessage } from '@/lib/plan-entitlements';
import { isSpeechSynthesisSupported } from '@/lib/use-speech-recognition';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  details?: unknown;
  action?: string;
  success?: boolean;
  timestamp: Date;
}

type SessionContext = AiCommandSessionContext;

function invalidateAfterMutation(queryClient: ReturnType<typeof useQueryClient>) {
  for (const key of AI_MUTATION_QUERY_KEYS) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
}

export type AiCommandBarProps = {
  variant?: 'dashboard' | 'onboarding';
  onboardingStep?: OnboardingAiStep;
};

export function AiCommandBar({ variant = 'dashboard', onboardingStep = 'type' }: AiCommandBarProps) {
  const { t, locale } = useI18n();
  const { business } = useAuthStore();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionContext, setSessionContext] = useState<SessionContext>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [retryingStepId, setRetryingStepId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const viewport = useViewportSize();
  const estimatedSize = useMemo(() => {
    const fab = { width: 48, height: 48 };
    if (!viewport.width) return fab;
    if (open) {
      return {
        width: Math.min(440, viewport.width - 32),
        height: Math.min(600, viewport.height - 32),
      };
    }
    return fab;
  }, [open, viewport.height, viewport.width]);
  const isOnboarding = variant === 'onboarding';
  const { floatingRef, floatingStyle, bindDragHandle, isDragging } =
    useDraggableFloatingPosition({
      storageKey: isOnboarding
        ? 'orchestrix-ai-position-onboarding'
        : 'orchestrix-ai-position-dashboard',
      estimatedSize,
    });

  useAiEvents(business?.id, {
    onClarify: () => setOpen(true),
    onTaskProgress: () => setOpen(true),
    onTaskCompleted: () => {
      invalidateAfterMutation(queryClient);
      queryClient.invalidateQueries({ queryKey: ['agent-tasks-pending', business?.id] });
      queryClient.invalidateQueries({ queryKey: ['agent-tasks-undo-preview', business?.id] });
    },
  });

  const { data: pendingTasks = [] } = useQuery({
    queryKey: ['agent-tasks-pending', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}/agents/tasks/pending`);
      return (data.data ?? data ?? []) as Array<Record<string, unknown>>;
    },
    enabled: !!business?.id,
    refetchInterval: 15_000,
  });

  const { data: undoPreview, isLoading: undoPreviewLoading } = useQuery({
    queryKey: ['agent-tasks-undo-preview', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}/agents/tasks/undo-latest/preview`);
      return data.data ?? data;
    },
    enabled: !!business?.id && open,
    refetchInterval: open ? 10_000 : false,
  });

  const undoLatestMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/businesses/${business!.id}/agents/tasks/undo-latest`);
      return data.data ?? data;
    },
    onSuccess: (result) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: `${t('ai.undoSuccess')}: ${result?.intent ?? undoPreview?.intent ?? ''}`.trim(),
          success: true,
          action: 'undo',
          timestamp: new Date(),
        },
      ]);
      invalidateAfterMutation(queryClient);
      queryClient.invalidateQueries({ queryKey: ['agent-tasks-undo-preview', business?.id] });
      queryClient.invalidateQueries({ queryKey: ['agent-tasks-pending', business?.id] });
    },
    onError: (error: unknown) => {
      const response = (error as { response?: { data?: { message?: unknown; error?: unknown } } })?.response?.data;
      const text = response?.message ?? response?.error ?? t('ai.undoFailed');
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          text: Array.isArray(text) ? text.join(', ') : String(text),
          success: false,
          action: 'undo',
          timestamp: new Date(),
        },
      ]);
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}/employees`);
      return (data.data || data || []) as Array<{
        id: string;
        name: string;
        serviceIds?: string[];
        isActive?: boolean;
      }>;
    },
    enabled: !!business?.id,
    staleTime: 60_000,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services', business?.id],
    queryFn: async () => {
      const { data } = await api.get(`/businesses/${business!.id}/services`);
      return (data.data || data || []) as Array<{ id: string; name: string; isActive?: boolean }>;
    },
    enabled: !!business?.id,
    staleTime: 60_000,
  });

  const examples = useMemo(
    () =>
      resolveCommandBarExamples({
        variant: isOnboarding ? 'onboarding' : 'dashboard',
        onboardingStep,
        tenant: { employees, services },
        t,
      }),
    [employees, isOnboarding, onboardingStep, services, t],
  );

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const approveTask = useCallback(
    async (taskId: string) => {
      if (!business?.id || approvingId) return;
      setApprovingId(taskId);
      try {
        const { data } = await api.post(
          `/businesses/${business.id}/ai/command/tasks/${taskId}/approve`,
        );
        const result = data.data || data;
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            text: result.summary,
            details: result.details,
            action: result.action,
            success: result.success,
            timestamp: new Date(),
          },
        ]);
        setSessionContext((prev) => mergeSessionContext(prev, extractSessionContext(result)));
        if (result.success) {
          invalidateAfterMutation(queryClient);
          queryClient.invalidateQueries({ queryKey: ['agent-tasks-undo-preview', business?.id] });
        }
      } catch (err: unknown) {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'assistant',
            text: err?.response?.data?.message || t('ai.approvePlanFailed'),
            success: false,
            action: 'error',
            timestamp: new Date(),
          },
        ]);
      } finally {
        setApprovingId(null);
      }
    },
    [approvingId, business?.id, queryClient, t],
  );

  const confirmExecution = useCallback(
    async (msg: Message) => {
      const prompt = String(msg.details?.confirmationPrompt ?? '').trim();
      if (!prompt || !business?.id || loading || confirmingId) return;

      setConfirmingId(msg.id);
      try {
        const msgIndex = messages.findIndex((m) => m.id === msg.id);
        const history = messages
          .slice(0, msgIndex >= 0 ? msgIndex : messages.length)
          .map((m) => ({ role: m.role, content: m.text }));

        const pageCtx = getAiPageContext();
        const { data } = await api.post(`/businesses/${business.id}/ai/command`, {
          prompt,
          history,
          confirmed: true,
          context: buildAiRequestContext(pathname, sessionContext, pageCtx),
        });
        const result = data.data || data;

        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            text: result.summary,
            details: result.details,
            action: result.action,
            success: result.success,
            timestamp: new Date(),
          },
        ]);
        setSessionContext((prev) => mergeSessionContext(prev, extractSessionContext(result)));
        if (shouldInvalidateAfterAi(result.action, result.success)) {
          invalidateAfterMutation(queryClient);
          queryClient.invalidateQueries({ queryKey: ['agent-tasks-undo-preview', business?.id] });
        }
      } catch (err: unknown) {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'assistant',
            text: err?.response?.data?.message || t('ai.confirmActionFailed'),
            success: false,
            action: 'error',
            timestamp: new Date(),
          },
        ]);
      } finally {
        setConfirmingId(null);
      }
    },
    [business?.id, confirmingId, loading, messages, pathname, queryClient, sessionContext, t],
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

  const runPrompt = useCallback(
    async (rawPrompt: string) => {
      const prompt = rawPrompt.trim();
      if (!prompt || !business?.id || loading) return;

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: 'user',
        text: prompt,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setLoading(true);

      const history = messages.map((m) => ({
        role: m.role,
        content: m.text,
      }));

      try {
        const pageCtx = getAiPageContext();
        const { data } = await api.post(`/businesses/${business.id}/ai/command`, {
          prompt,
          history,
          context: buildAiRequestContext(pathname, sessionContext, pageCtx),
        });
        const result = data.data || data;

        const assistantMsg: Message = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: result.summary,
          details: result.details,
          action: result.action,
          success: result.success,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setSessionContext((prev) => mergeSessionContext(prev, extractSessionContext(result)));

        if (shouldInvalidateAfterAi(result.action, result.success)) {
          invalidateAfterMutation(queryClient);
          queryClient.invalidateQueries({ queryKey: ['agent-tasks-undo-preview', business?.id] });
        }
      } catch (err: unknown) {
        const limitMsg = planLimitMessage(err);
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'assistant',
            text:
              limitMsg ??
              (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
              t('common.errorGeneric'),
            success: false,
            action: isPlanLimitError(err) ? 'plan_limit' : 'error',
            timestamp: new Date(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [business?.id, loading, queryClient, messages, sessionContext, pathname, t],
  );

  const submit = useCallback(() => {
    void runPrompt(input);
  }, [input, runPrompt]);

  useOrchestrixEvents({
    onOpen: () => setOpen(true),
    onPrompt: (prompt) => {
      setOpen(true);
      setInput(prompt);
      inputRef.current?.focus();
    },
    onRun: (prompt, autoSubmit) => {
      setOpen(true);
      setInput(prompt);
      if (autoSubmit) void runPrompt(prompt);
      else inputRef.current?.focus();
    },
  });

  const retryWorkflowStep = useCallback(
    async (taskId: string, stepId: string) => {
      if (!business?.id || retryingStepId) return;
      setRetryingStepId(stepId);
      try {
        const { data } = await api.post(
          `/businesses/${business.id}/ai/command/tasks/${taskId}/steps/${stepId}/retry`,
        );
        const result = data.data || data;
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            text: result.summary ?? '',
            details: result.details,
            action: result.action,
            success: result.success,
            timestamp: new Date(),
          },
        ]);
        if (result.success) {
          invalidateAfterMutation(queryClient);
          queryClient.invalidateQueries({ queryKey: ['agent-tasks-undo-preview', business.id] });
        }
      } catch (err: unknown) {
        const text =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          t('common.errorGeneric');
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'assistant',
            text: String(text),
            success: false,
            action: 'error',
            timestamp: new Date(),
          },
        ]);
      } finally {
        setRetryingStepId(null);
      }
    },
    [business?.id, queryClient, retryingStepId, t],
  );

  const lastUndoableMessageId = useMemo(
    () => findLastUndoableMessageId(messages, Boolean(undoPreview?.undoable)),
    [messages, undoPreview?.undoable],
  );

  const handleInlineUndo = useCallback(async () => {
    if (!undoPreview?.undoable || undoLatestMutation.isPending) return;
    undoLatestMutation.mutate();
  }, [undoLatestMutation, undoPreview?.undoable]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const closeAssistant = useCallback(() => {
    setOpen(false);
    setMessages([]);
    setSessionContext({});
  }, []);

  const handleUndoLatest = useCallback(async () => {
    if (!undoPreview?.undoable || undoLatestMutation.isPending) return;
    const label = t('ai.undoLatestConfirm').replace('{intent}', undoPreview.intent);
    if (!(await confirmDialog({ message: label, destructive: true }))) return;
    undoLatestMutation.mutate();
  }, [t, undoLatestMutation, undoPreview]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAssistant();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, closeAssistant]);

  if (!business) return null;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          ref={floatingRef}
          type="button"
          {...bindDragHandle({ onPress: () => setOpen(true) })}
          style={floatingStyle}
          className={`w-12 h-12 bg-gradient-to-br from-violet-600 to-blue-600 rounded-full shadow-lg shadow-violet-600/30 flex items-center justify-center text-white transition-transform ${
            isDragging ? 'scale-100 cursor-grabbing' : 'hover:scale-105 cursor-grab'
          }`}
          title={t('ai.commandBarDragTitle')}
        >
          <Sparkles className="w-5 h-5" />
          {pendingTasks.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-[10px] font-bold flex items-center justify-center">
              {pendingTasks.length}
            </span>
          )}
        </button>
      )}

      {/* Command panel */}
      {open && (
        <div
          ref={floatingRef}
          style={floatingStyle}
          className="w-[440px] max-w-[calc(100vw-2rem)] max-h-[600px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/80 backdrop-blur">
            <div
              {...bindDragHandle()}
              className="flex flex-1 items-center gap-2 min-w-0 select-none"
            >
              <Sparkles className="w-4 h-4 text-violet-400 shrink-0 pointer-events-none" />
              <span className="text-sm font-semibold text-gray-200 truncate pointer-events-none">
                {isOnboarding ? t('onboarding.aiAssistantTitle') : t('ai.assistantTitle')}
              </span>
            </div>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={handleUndoLatest}
              disabled={!undoPreview?.undoable || undoLatestMutation.isPending || undoPreviewLoading}
              className="shrink-0 ml-2 p-1 text-gray-500 hover:text-violet-300 disabled:opacity-40 disabled:hover:text-gray-500 transition-colors cursor-pointer"
              title={
                undoPreview?.undoable
                  ? `${t('ai.undoLatest')}: ${undoPreview.intent}`
                  : undoPreview?.reason ?? t('ai.undoLatestNone')
              }
              aria-label={t('ai.undoLatest')}
            >
              <Undo2
                className={`w-4 h-4 ${undoLatestMutation.isPending ? 'opacity-40' : ''}`}
              />
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={closeAssistant}
              className="shrink-0 ml-1 p-1 text-gray-500 hover:text-white transition-colors cursor-pointer"
              aria-label={t('ai.closeAssistant')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[420px]">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <Sparkles className="w-8 h-8 text-violet-500/50 mx-auto mb-3" />
                <p className="text-sm text-gray-400 mb-4">{t('ai.emptyHint')}</p>
                <p className="text-[11px] text-gray-500 mb-2">{t('ai.examples')}</p>
                <AiCommandMacrosPanel compact />
                <div className="space-y-2 mt-3">
                  {examples.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => { setInput(ex); inputRef.current?.focus(); }}
                      className="block w-full text-left text-xs text-gray-500 hover:text-violet-300 bg-gray-800/50 hover:bg-gray-800 rounded-lg px-3 py-2 transition-colors"
                    >
                      &ldquo;{ex}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => {
              const msgDetails =
                msg.details && typeof msg.details === 'object'
                  ? (msg.details as Record<string, unknown>)
                  : undefined;
              const availableProviders = normalizeAvailableProviders(msgDetails);
              const providerServiceName =
                typeof msgDetails?.serviceName === 'string'
                  ? msgDetails.serviceName
                  : undefined;
              const providerDate =
                typeof msgDetails?.date === 'string' ? msgDetails.date : undefined;

              return (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100'
                      : msg.details?.needsClarification
                        ? 'bg-amber-900/20 border border-amber-700/40 text-amber-100'
                        : msg.success === false
                          ? 'bg-red-900/20 border border-red-700/30 text-red-200'
                          : 'bg-gray-800 border border-gray-700 text-gray-200'
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed">{msg.text}</pre>

                  {msg.role === 'assistant' && isSpeechSynthesisSupported() && (
                    <AiSpeakReplyButton
                      text={msg.text}
                      locale={locale}
                      label={t('ai.speakReply')}
                      variant="dark"
                    />
                  )}

                  {msg.role === 'assistant' && availableProviders.length > 0 && (
                    <AiAvailableProvidersPanel
                      providers={availableProviders}
                      serviceName={providerServiceName}
                      date={providerDate}
                      onBook={(composed) => void runPrompt(composed)}
                    />
                  )}

                  {msg.details?.needsClarification && Array.isArray(msg.details.missing) && (
                    <AiClarifyForm
                      issues={msg.details.missing as ClarifyIssue[]}
                      options={{
                        employees,
                        services,
                        availableProviderNames:
                          (msg.details.availableProviders as string[] | undefined) ??
                          availableProviders.map((provider) => provider.name),
                      }}
                      onSubmit={(composed) => void runPrompt(composed)}
                    />
                  )}

                  {msg.role === 'assistant' &&
                    normalizeExecutionTimeline(msg.details?.executionTimeline).length > 0 && (
                      <AiExecutionTimeline
                        steps={normalizeExecutionTimeline(msg.details.executionTimeline)}
                        taskId={
                          typeof msg.details?.taskId === 'string'
                            ? msg.details.taskId
                            : undefined
                        }
                        onRetry={retryWorkflowStep}
                        retryingStepId={retryingStepId}
                      />
                    )}

                  {msg.id === lastUndoableMessageId && undoPreview?.undoable && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md border border-violet-500/30 bg-violet-950/30 px-2 py-1.5">
                      <p className="text-[11px] text-violet-100/90 flex-1 min-w-[12rem]">
                        {t('ai.undoPromptBanner')}
                      </p>
                      <button
                        type="button"
                        onClick={() => void handleInlineUndo()}
                        disabled={undoLatestMutation.isPending}
                        className="text-[11px] px-2 py-0.5 rounded bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50"
                      >
                        {undoLatestMutation.isPending ? t('ai.undoing') : t('ai.undoNow')}
                      </button>
                    </div>
                  )}

                  {/* Expandable details */}
                  {msg.details && Object.keys(msg.details).length > 0 && (
                    <button
                      onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                      className="mt-2 text-[11px] text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
                    >
                      {expandedId === msg.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {expandedId === msg.id ? t('ai.hideDetails') : t('ai.showDetails')}
                    </button>
                  )}
                  {expandedId === msg.id && msg.details && (
                    <pre className="mt-2 text-[10px] text-gray-500 bg-gray-900 rounded p-2 overflow-x-auto max-h-40 overflow-y-auto">
                      {JSON.stringify(msg.details, null, 2)}
                    </pre>
                  )}

                  {msg.details?.requiresExecutionConfirmation && (
                    <button
                      type="button"
                      onClick={() => confirmExecution(msg)}
                      disabled={confirmingId === msg.id}
                      className="mt-2 text-xs px-2.5 py-1 rounded-md bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50"
                    >
                      {confirmingId === msg.id ? t('ai.executing') : t('ai.confirmExecute')}
                    </button>
                  )}

                  {msg.details?.requiresApproval && msg.details?.taskId && (
                    <>
                      {msg.details.wizardMode &&
                      Array.isArray(msg.details.wizardSteps) &&
                      msg.details.wizardSteps.length > 0 ? (
                        <AiCommandWizard
                          steps={msg.details.wizardSteps as WizardStepView[]}
                          onApprove={() => approveTask(msg.details.taskId)}
                          approving={approvingId === msg.details.taskId}
                        />
                      ) : (
                        Array.isArray(msg.details.planDiff) && (
                          <PlanDiffPreview
                            steps={msg.details.planDiff}
                            policyPreview={msg.details.policyPreview}
                            policyExplain={msg.details.policyExplain}
                          />
                        )
                      )}
                      {!msg.details.wizardMode && (
                        <button
                          onClick={() => approveTask(msg.details.taskId)}
                          disabled={approvingId === msg.details.taskId}
                          className="mt-2 text-xs px-2.5 py-1 rounded-md bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50"
                        >
                          {approvingId === msg.details.taskId
                            ? t('ai.executing')
                            : t('ai.approveExecutePlan')}
                        </button>
                      )}
                    </>
                  )}

                  {msg.action && msg.role === 'assistant' && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                        msg.details?.needsClarification
                          ? 'bg-amber-500'
                          : msg.success
                            ? 'bg-green-500'
                            : msg.success === false
                              ? 'bg-red-500'
                              : 'bg-gray-500'
                      }`} />
                      <span className="text-[10px] text-gray-500">
                        {msg.details?.needsClarification
                          ? t('ai.needsInfo')
                          : msg.action.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
            })}

            {(loading || confirmingId || approvingId) && (
              <div className="flex justify-start">
                <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-400">{t('ai.thinking')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-800">
            {voiceError && (
              <p className="text-[10px] text-amber-400/90 mb-2 px-1">{voiceError}</p>
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
                variant="dark"
                labels={{ start: t('ai.voiceStart'), stop: t('ai.voiceStop') }}
              />
              <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
                placeholder={t('ai.commandPlaceholder')}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button
                onClick={submit}
                disabled={!input.trim() || loading}
                className="p-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:hover:bg-violet-600 text-white rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-gray-600 mt-1.5 px-1">
              {undoPreview?.undoable
                ? `${t('ai.undoLatestHint')}: ${undoPreview.intent}`
                : t('ai.voiceHint')}
              {`, ${t('ai.escToClose')}`}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
