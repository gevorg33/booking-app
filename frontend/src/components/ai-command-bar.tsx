'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Send, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  details?: any;
  action?: string;
  success?: boolean;
  timestamp: Date;
}

const EXAMPLES = [
  'Show Gevorg Gasparyan appointments on 2026-05-28',
  'Show all service provider appointments for tomorrow',
  'Cancel all hairdrying and hairstyle bookings for Gevorg Gasparyan on 2026-05-28',
  'Book facemassage with Gevorg Gasparyan on 2026-06-02 at 09:00 for customer John',
];

export function AiCommandBar() {
  const { business } = useAuthStore();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

    try {
      const { data } = await api.post(`/businesses/${business.id}/ai/command`, { prompt });
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

      if (
        (result.action === 'cancel_bookings' || result.action === 'create_booking') &&
        result.success
      ) {
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
        queryClient.invalidateQueries({ queryKey: ['provider-calendar'] });
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
  }, [input, business?.id, loading, queryClient]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  if (!business) return null;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-br from-violet-600 to-blue-600 rounded-full shadow-lg shadow-violet-600/30 flex items-center justify-center text-white hover:scale-105 transition-transform z-50"
          title="AI Command (natural language)"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      )}

      {/* Command panel */}
      {open && (
        <div className="fixed bottom-6 right-6 w-[440px] max-h-[600px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl shadow-black/50 flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/80 backdrop-blur">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-semibold text-gray-200">AI Assistant</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-white transition-colors"
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
                  Tell me what you need in plain English
                </p>
                <div className="space-y-2">
                  {EXAMPLES.map((ex, i) => (
                    <button
                      key={i}
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
                      : msg.success === false
                        ? 'bg-red-900/20 border border-red-700/30 text-red-200'
                        : 'bg-gray-800 border border-gray-700 text-gray-200'
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed">{msg.text}</pre>

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

                  {msg.action && msg.role === 'assistant' && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${msg.success ? 'bg-green-500' : msg.success === false ? 'bg-red-500' : 'bg-gray-500'}`} />
                      <span className="text-[10px] text-gray-500">{msg.action.replace(/_/g, ' ')}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                  <span className="text-xs text-gray-400">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-800">
            <div className="flex items-center gap-2">
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
              Press Enter to send, Esc to close
            </p>
          </div>
        </div>
      )}
    </>
  );
}
