/** Custom events for opening the dashboard Orchestrix command bar. */

export const ORCHESTRIX_OPEN = 'orchestrix:open';
export const ORCHESTRIX_PROMPT = 'orchestrix:prompt';
export const ORCHESTRIX_RUN = 'orchestrix:run';

export type OrchestrixPromptDetail = { prompt: string };
export type OrchestrixRunDetail = {
  prompt: string;
  autoSubmit?: boolean;
  assistantMode?: 'guide' | 'act';
  guideTopicId?: string;
};
export type OrchestrixRunOptions = Omit<OrchestrixRunDetail, 'prompt'>;

export function fireOrchestrixOpen() {
  window.dispatchEvent(new CustomEvent(ORCHESTRIX_OPEN));
}

export function fireOrchestrixPrompt(prompt: string) {
  window.dispatchEvent(
    new CustomEvent<OrchestrixPromptDetail>(ORCHESTRIX_PROMPT, { detail: { prompt } }),
  );
  fireOrchestrixOpen();
}

/** Edit-only: opens bar and fills input without submitting. */
export function fireOrchestrixEdit(prompt: string) {
  fireOrchestrixPrompt(prompt);
}

/** Run: optional immediate submit (ai-d3). */
export function fireOrchestrixRun(
  prompt: string,
  autoSubmitOrOptions: boolean | OrchestrixRunOptions = true,
  options: OrchestrixRunOptions = {},
) {
  const resolved =
    typeof autoSubmitOrOptions === 'boolean'
      ? { autoSubmit: autoSubmitOrOptions, ...options }
      : autoSubmitOrOptions;
  window.dispatchEvent(
    new CustomEvent<OrchestrixRunDetail>(ORCHESTRIX_RUN, {
      detail: { prompt, ...resolved },
    }),
  );
  fireOrchestrixOpen();
}

export type OrchestrixHandlers = {
  onPrompt?: (prompt: string) => void;
  onRun?: (detail: OrchestrixRunDetail) => void;
  onOpen?: () => void;
};

export function handleOrchestrixPromptEvent(e: Event, handlers: OrchestrixHandlers): void {
  const prompt = (e as CustomEvent<OrchestrixPromptDetail>).detail?.prompt;
  if (prompt && handlers.onPrompt) handlers.onPrompt(prompt);
}

export function handleOrchestrixRunEvent(e: Event, handlers: OrchestrixHandlers): void {
  const detail = (e as CustomEvent<OrchestrixRunDetail>).detail;
  const prompt = detail?.prompt;
  if (!prompt) return;
  if (handlers.onRun) {
    handlers.onRun({ ...detail, prompt, autoSubmit: detail.autoSubmit !== false });
  } else if (handlers.onPrompt) {
    handlers.onPrompt(prompt);
  }
}

/** Subscribe to Orchestrix custom events; returns unsubscribe (used by useOrchestrixEvents). */
export function subscribeOrchestrixEvents(handlers: OrchestrixHandlers): () => void {
  const onPrompt = (e: Event) => handleOrchestrixPromptEvent(e, handlers);
  const onRun = (e: Event) => handleOrchestrixRunEvent(e, handlers);
  const onOpen = () => handlers.onOpen?.();

  window.addEventListener(ORCHESTRIX_PROMPT, onPrompt);
  window.addEventListener(ORCHESTRIX_RUN, onRun);
  window.addEventListener(ORCHESTRIX_OPEN, onOpen);
  return () => {
    window.removeEventListener(ORCHESTRIX_PROMPT, onPrompt);
    window.removeEventListener(ORCHESTRIX_RUN, onRun);
    window.removeEventListener(ORCHESTRIX_OPEN, onOpen);
  };
}
