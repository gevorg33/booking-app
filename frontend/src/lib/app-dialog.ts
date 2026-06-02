export type PromptDialogOptions = {
  title?: string;
  message: string;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

export type ConfirmDialogOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type DialogRequest =
  | {
      kind: 'confirm';
      options: ConfirmDialogOptions;
      resolve: (value: boolean) => void;
    }
  | {
      kind: 'prompt';
      options: PromptDialogOptions;
      resolve: (value: string | null) => void;
    };

type DialogListener = (request: DialogRequest | null) => void;

let listener: DialogListener | null = null;

export function subscribeAppDialog(next: DialogListener) {
  listener = next;
  return () => {
    if (listener === next) listener = null;
  };
}

export function confirmDialog(messageOrOptions: string | ConfirmDialogOptions): Promise<boolean> {
  const options =
    typeof messageOrOptions === 'string' ? { message: messageOrOptions } : messageOrOptions;

  if (typeof window === 'undefined' || !listener) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    listener?.({ kind: 'confirm', options, resolve });
  });
}

export function promptDialog(messageOrOptions: string | PromptDialogOptions): Promise<string | null> {
  const options =
    typeof messageOrOptions === 'string' ? { message: messageOrOptions } : messageOrOptions;

  if (typeof window === 'undefined' || !listener) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    listener?.({ kind: 'prompt', options, resolve });
  });
}
