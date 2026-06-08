const store = new Map<string, string>();

const localStorageMock: Storage = {
  get length() {
    return store.size;
  },
  clear() {
    store.clear();
  },
  getItem(key: string) {
    return store.get(key) ?? null;
  },
  key(index: number) {
    return [...store.keys()][index] ?? null;
  },
  removeItem(key: string) {
    store.delete(key);
  },
  setItem(key: string, value: string) {
    store.set(key, value);
  },
};

const sessionStore = new Map<string, string>();

const sessionStorageMock: Storage = {
  get length() {
    return sessionStore.size;
  },
  clear() {
    sessionStore.clear();
  },
  getItem(key: string) {
    return sessionStore.get(key) ?? null;
  },
  key(index: number) {
    return [...sessionStore.keys()][index] ?? null;
  },
  removeItem(key: string) {
    sessionStore.delete(key);
  },
  setItem(key: string, value: string) {
    sessionStore.set(key, value);
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
  configurable: true,
});

if (
  typeof globalThis.window === 'undefined' ||
  typeof globalThis.window.addEventListener !== 'function'
) {
  const listeners = new Map<string, Set<(event: Event) => void>>();
  const windowLike = {
    location: { href: 'http://localhost/' },
    addEventListener(type: string, listener: (event: Event) => void) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(listener);
    },
    removeEventListener(type: string, listener: (event: Event) => void) {
      listeners.get(type)?.delete(listener);
    },
    dispatchEvent(event: Event) {
      listeners.get(event.type)?.forEach((fn) => fn(event));
      return true;
    },
  };
  Object.defineProperty(globalThis, 'window', {
    value: windowLike,
    writable: true,
    configurable: true,
  });
}

if (typeof document === 'undefined') {
  const cssVars = new Map<string, string>();
  Object.defineProperty(globalThis, 'document', {
    value: {
      documentElement: {
        style: {
          setProperty: (key: string, value: string) => cssVars.set(key, value),
          getPropertyValue: (key: string) => cssVars.get(key) ?? '',
        },
      },
    },
    writable: true,
  });
}
