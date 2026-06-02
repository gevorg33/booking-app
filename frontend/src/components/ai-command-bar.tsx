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
  buildAiCommandBarExamples,
  buildAiRequestContext,
  getAiPageContext,
  type AiPageContext,
} from '@/lib/ai-orchestration';
import { useOrchestrixEvents } from '@/components/ai-proactive-suggestions';
import { useAiEvents } from '@/lib/use-ai-events';
import { confirmDialog } from '@/lib/app-dialog';
import { PlanDiffPreview } from '@/components/ai-agent-workspaces';
import { AiSpeakReplyButton, AiVoiceInputButton } from '@/components/ai-voice-controls';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/i18n';
import type { SpeechRecognitionErrorCode } from '@/lib/use-speech-recognition';
import { isSpeechSynthesisSupported } from '@/lib/use-speech-recognition';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  details?: any;
  action?: string;
  success?: boolean;
  timestamp: Date;
}

interface SessionContext extends Partial<AiPageContext> {
  lastAction?: string | null;
  lastMetric?: string | null;
  availableProviders?: string[];
}

interface ClarifyIssue {
  field: string;
  label: string;
  message: string;
  example?: string;
}

function extractSessionContext(result: {
  action?: string;
  details?: {
    sessionContext?: SessionContext;
    employee?: string;
    date?: string;
    availableProviders?: string[];
    params?: Record<string, unknown>;
  };
}): SessionContext {
  const ctx: SessionContext = { ...(result.details?.sessionContext ?? {}) };
  if (result.details?.employee) ctx.employeeName = result.details.employee;
  if (result.details?.date) ctx.date = result.details.date;
  const params = result.details?.params;
  const details = result.details as Record<string, unknown> | undefined;
  if (params?.employeeName && !ctx.employeeName) ctx.employeeName = String(params.employeeName);
  if (params?.date && !ctx.date) ctx.date = String(params.date);
  if (params?.serviceName && !ctx.serviceName) ctx.serviceName = String(params.serviceName);
  if (params?.timeSlot && !ctx.timeSlot) ctx.timeSlot = String(params.timeSlot);
  const available = result.details?.availableProviders;
  if (Array.isArray(available) && available.length > 0) {
    ctx.availableProviders = available.map(String);
  }
  if (result.action) ctx.lastAction = result.action;
  if (details?.metric) ctx.customerMetric = String(details.metric);
  if (details?.appointmentMetric) ctx.appointmentMetric = String(details.appointmentMetric);
  if (details?.bookingMetric) ctx.bookingMetric = String(details.bookingMetric);
  const metric = details?.appointmentMetric ?? details?.customerMetric ?? details?.bookingMetric ?? details?.metric;
  if (metric) ctx.lastMetric = String(metric);
  return ctx;
}

function mergeSessionContext(prev: SessionContext, next: SessionContext): SessionContext {
  return {
    employeeName: next.employeeName ?? prev.employeeName,
    date: next.date ?? prev.date,
    dateFrom: next.dateFrom ?? prev.dateFrom,
    dateTo: next.dateTo ?? prev.dateTo,
    serviceName: next.serviceName ?? prev.serviceName,
    timeSlot: next.timeSlot ?? prev.timeSlot,
    customerName: next.customerName ?? prev.customerName,
    templateName: next.templateName ?? prev.templateName,
    timeFrom: next.timeFrom ?? prev.timeFrom,
    timeTo: next.timeTo ?? prev.timeTo,
    allProviders: next.allProviders ?? prev.allProviders,
    lastAction: next.lastAction ?? prev.lastAction,
    lastMetric: next.lastMetric ?? prev.lastMetric,
    appointmentMetric: next.appointmentMetric ?? prev.appointmentMetric,
    customerMetric: next.customerMetric ?? prev.customerMetric,
    bookingMetric: next.bookingMetric ?? prev.bookingMetric,
    route: next.route ?? prev.route,
    availableProviders: next.availableProviders ?? prev.availableProviders,
  };
}

const SCHEDULE_ACTIONS = new Set([
  'fill_unused_slots',
  'apply_schedule',
  'block_schedule',
  'create_direct_schedule',
  'clear_schedule',
  'setup_week_schedule',
  'assign_employee_services',
]);

const ORCHESTRATION_ACTIONS = new Set([
  'optimize_schedule',
  'resolve_conflicts',
  'reassign_cancelled',
  'summarize_utilization',
]);

function shouldInvalidateAfterAi(action?: string, success?: boolean): boolean {
  if (!success || !action) return false;
  return (
    action === 'cancel_bookings' ||
    action === 'create_booking' ||
    action === 'create_service' ||
    action === 'create_services' ||
    action === 'reschedule_booking' ||
    SCHEDULE_ACTIONS.has(action) ||
    ORCHESTRATION_ACTIONS.has(action)
  );
}

function invalidateAfterMutation(queryClient: ReturnType<typeof useQueryClient>) {
  for (const key of AI_MUTATION_QUERY_KEYS) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
}

export function AiCommandBar() {
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
  const { floatingRef, floatingStyle, bindDragHandle, isDragging } =
    useDraggableFloatingPosition({
      storageKey: 'orchestrix-ai-position-dashboard',
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
      return (data.data ?? data ?? []) as any[];
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
    onError: (error: any) => {
      const text =
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        t('ai.undoFailed');
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
    () => buildAiCommandBarExamples({ employees, services }),
    [employees, services],
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

  useOrchestrixEvents({
    onOpen: () => setOpen(true),
    onPrompt: (prompt) => {
      setOpen(true);
      setInput(prompt);
      inputRef.current?.focus();
    },
  });

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
      } catch (err: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'assistant',
            text: err?.response?.data?.message || 'Failed to approve plan',
            success: false,
            action: 'error',
            timestamp: new Date(),
          },
        ]);
      } finally {
        setApprovingId(null);
      }
    },
    [approvingId, business?.id, queryClient],
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
      } catch (err: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'assistant',
            text: err?.response?.data?.message || 'Failed to confirm action',
            success: false,
            action: 'error',
            timestamp: new Date(),
          },
        ]);
      } finally {
        setConfirmingId(null);
      }
    },
    [business?.id, confirmingId, loading, messages, pathname, queryClient, sessionContext],
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

  const submit = useCallback(async () => {
    const prompt = input.trim();
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
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          text: err?.response?.data?.message || 'Something went wrong. Please try again.',
          success: false,
          action: 'error',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, business?.id, loading, queryClient, messages, sessionContext, pathname]);

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
          title="AI Command (drag to move)"
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
                Orchestrix AI
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
              aria-label="Close AI assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[420px]">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <Sparkles className="w-8 h-8 text-violet-500/50 mx-auto mb-3" />
                <p className="text-sm text-gray-400 mb-4">
                  Express operational intent — AI plans, policy validates, workflows execute
                </p>
                <div className="space-y-2">
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

            {messages.map((msg) => (
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

                  {msg.details?.needsClarification && Array.isArray(msg.details.missing) && (
                    <div className="mt-2 space-y-1">
                      {(msg.details.missing as ClarifyIssue[]).map((issue, i) => (
                        issue.example ? (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setInput(issue.example!);
                              inputRef.current?.focus();
                            }}
                            className="block w-full text-left text-[11px] text-amber-200/90 hover:text-amber-100 bg-amber-950/30 hover:bg-amber-950/50 rounded px-2 py-1 transition-colors"
                          >
                            {issue.label}: {issue.message}
                            <span className="block text-[10px] text-amber-400/80 mt-0.5">Try: &ldquo;{issue.example}&rdquo;</span>
                          </button>
                        ) : (
                          <p key={i} className="text-[11px] text-amber-200/80">
                            {issue.label}: {issue.message}
                          </p>
                        )
                      ))}
                    </div>
                  )}

                  {/* Expandable details */}
                  {msg.details && Object.keys(msg.details).length > 0 && (
                    <button
                      onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                      className="mt-2 text-[11px] text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
                    >
                      {expandedId === msg.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {expandedId === msg.id ? 'Hide' : 'Show'} details
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
                      {confirmingId === msg.id ? 'Executing…' : 'Confirm & execute'}
                    </button>
                  )}

                  {msg.details?.requiresApproval && msg.details?.taskId && (
                    <>
                      {Array.isArray(msg.details.planDiff) && (
                        <PlanDiffPreview steps={msg.details.planDiff} policyPreview={msg.details.policyPreview} />
                      )}
                      <button
                        onClick={() => approveTask(msg.details.taskId)}
                        disabled={approvingId === msg.details.taskId}
                        className="mt-2 text-xs px-2.5 py-1 rounded-md bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50"
                      >
                        {approvingId === msg.details.taskId ? 'Executing…' : 'Approve & execute plan'}
                      </button>
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
                        {msg.details?.needsClarification ? 'needs info' : msg.action.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-400">Thinking…</span>
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
                placeholder="e.g. Cancel all bookings for Gevorg tomorrow..."
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
              , Esc to close
            </p>
          </div>
        </div>
      )}
    </>
  );
}
