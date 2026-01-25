import { Component, ErrorBoundary as SolidErrorBoundary, ParentComponent } from 'solid-js';
import { Button } from './ui';

const Fallback: Component<{ error: Error; reset: () => void }> = (props) => (
  <div class="min-h-[200px] flex flex-col items-center justify-center p-6 text-center">
    <div class="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
      <svg class="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <h3 class="text-lg font-medium mb-1">Something went wrong</h3>
    <p class="text-sm text-zinc-500 mb-4">{props.error.message}</p>
    <Button variant="secondary" onClick={props.reset}>Try again</Button>
  </div>
);

export const ErrorBoundary: ParentComponent = (props) => (
  <SolidErrorBoundary fallback={(err, reset) => <Fallback error={err} reset={reset} />}>
    {props.children}
  </SolidErrorBoundary>
);
