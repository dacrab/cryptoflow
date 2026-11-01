import { For, ParentComponent, Show, createContext, onCleanup, useContext } from 'solid-js';
import { Portal } from 'solid-js/web';
import { createStore, produce } from 'solid-js/store';
import { Icon } from '../components/Icon';

type Tone = 'success' | 'danger' | 'info';

interface ToastAction {
  label: string;
  run: () => void;
}

interface ToastOptions {
  message: string;
  tone?: Tone;
  action?: ToastAction;
}

interface ToastItem extends Required<Pick<ToastOptions, 'message' | 'tone'>> {
  id: number;
  action?: ToastAction;
}

interface ToastStore {
  show: (options: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastStore>();

export const ToastProvider: ParentComponent = (props) => {
  const [toasts, setToasts] = createStore<ToastItem[]>([]);
  const timers = new Map<number, number>();
  let sequence = 0;

  const dismiss = (id: number) => {
    const timer = timers.get(id);
    if (timer) window.clearTimeout(timer);
    timers.delete(id);
    setToasts(
      produce((items) => {
        const index = items.findIndex((item) => item.id === id);
        if (index >= 0) items.splice(index, 1);
      }),
    );
  };

  const show = (options: ToastOptions) => {
    const id = ++sequence;
    setToasts((items) => [...items, { ...options, id, tone: options.tone ?? 'info' }]);
    timers.set(id, window.setTimeout(() => dismiss(id), 4200));
    return id;
  };

  onCleanup(() => {
    for (const timer of timers.values()) window.clearTimeout(timer);
    timers.clear();
  });

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {props.children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

export function useToast(): ToastStore {
  const store = useContext(ToastContext);
  if (!store) throw new Error('useToast must be used inside ToastProvider');
  return store;
}

const TONE_ICON = {
  success: 'check',
  danger: 'alert',
  info: 'info',
} as const;

const TONE_CLASS = {
  success: 'text-up border-up/25 bg-up/[0.06]',
  danger: 'text-down border-down/25 bg-down/[0.06]',
  info: 'text-muted border-line bg-white/[0.03]',
};

function ToastViewport(props: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <Portal mount={document.body}>
      <div
        class="pointer-events-none fixed inset-x-4 bottom-4 z-[80] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[360px]"
        aria-live="polite"
        aria-atomic="true"
      >
        <For each={props.toasts}>
          {(toast) => (
            <div class="toast-in pointer-events-auto flex items-start gap-2.5 rounded-lg border border-line bg-panel p-3 shadow-lg shadow-black/30">
              <span class={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border ${TONE_CLASS[toast.tone]}`}>
                <Icon name={TONE_ICON[toast.tone]} size={12} />
              </span>
              <p class="flex-1 pt-0.5 text-[12px] leading-snug text-fg">{toast.message}</p>
              <Show when={toast.action}>
                {(action) => (
                  <button
                    type="button"
                    class="pt-0.5 text-[11px] font-medium text-muted underline underline-offset-2 transition-colors hover:text-fg"
                    onClick={() => {
                      action().run();
                      props.onDismiss(toast.id);
                    }}
                  >
                    {action().label}
                  </button>
                )}
              </Show>
              <button
                type="button"
                class="pt-0.5 text-dim transition hover:text-fg"
                onClick={() => props.onDismiss(toast.id)}
                aria-label="Dismiss notification"
              >
                <Icon name="x" size={12} />
              </button>
            </div>
          )}
        </For>
      </div>
    </Portal>
  );
}
