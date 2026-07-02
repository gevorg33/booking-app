/** Custom events for opening the public booking assistant FAB. */

export const PUBLIC_ASSISTANT_OPEN = 'public-assistant:open';
export const PUBLIC_ASSISTANT_PROMPT = 'public-assistant:prompt';
export const PUBLIC_ASSISTANT_RUN = 'public-assistant:run';

export type PublicAssistantPromptDetail = { prompt: string };
export type PublicAssistantRunDetail = {
  prompt: string;
  autoSubmit?: boolean;
};

export function firePublicAssistantOpen() {
  window.dispatchEvent(new CustomEvent(PUBLIC_ASSISTANT_OPEN));
}

export function firePublicAssistantPrompt(prompt: string) {
  window.dispatchEvent(
    new CustomEvent<PublicAssistantPromptDetail>(PUBLIC_ASSISTANT_PROMPT, {
      detail: { prompt },
    }),
  );
  firePublicAssistantOpen();
}

/** Open assistant and optionally auto-submit the prompt (ai-cmd-customer-4.9.2). */
export function firePublicAssistantRun(
  prompt: string,
  autoSubmit = true,
) {
  window.dispatchEvent(
    new CustomEvent<PublicAssistantRunDetail>(PUBLIC_ASSISTANT_RUN, {
      detail: { prompt, autoSubmit },
    }),
  );
  firePublicAssistantOpen();
}

export type PublicAssistantEventHandlers = {
  onPrompt?: (prompt: string) => void;
  onRun?: (detail: PublicAssistantRunDetail) => void;
  onOpen?: () => void;
};

export function handlePublicAssistantPromptEvent(
  e: Event,
  handlers: PublicAssistantEventHandlers,
): void {
  const prompt = (e as CustomEvent<PublicAssistantPromptDetail>).detail?.prompt;
  if (prompt && handlers.onPrompt) handlers.onPrompt(prompt);
}

export function handlePublicAssistantRunEvent(
  e: Event,
  handlers: PublicAssistantEventHandlers,
): void {
  const detail = (e as CustomEvent<PublicAssistantRunDetail>).detail;
  const prompt = detail?.prompt;
  if (!prompt) return;
  if (handlers.onRun) {
    handlers.onRun({ ...detail, prompt, autoSubmit: detail.autoSubmit !== false });
  } else if (handlers.onPrompt) {
    handlers.onPrompt(prompt);
  }
}

export function subscribePublicAssistantEvents(
  handlers: PublicAssistantEventHandlers,
): () => void {
  const onPrompt = (e: Event) => handlePublicAssistantPromptEvent(e, handlers);
  const onRun = (e: Event) => handlePublicAssistantRunEvent(e, handlers);
  const onOpen = () => handlers.onOpen?.();

  window.addEventListener(PUBLIC_ASSISTANT_PROMPT, onPrompt);
  window.addEventListener(PUBLIC_ASSISTANT_RUN, onRun);
  window.addEventListener(PUBLIC_ASSISTANT_OPEN, onOpen);
  return () => {
    window.removeEventListener(PUBLIC_ASSISTANT_PROMPT, onPrompt);
    window.removeEventListener(PUBLIC_ASSISTANT_RUN, onRun);
    window.removeEventListener(PUBLIC_ASSISTANT_OPEN, onOpen);
  };
}
