import { A, useLocation, useNavigate } from '@solidjs/router';
import { Button, Kbd } from '../components/ui';
import { Icon } from '../components/Icon';

export default function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div class="flex min-h-[55vh] items-center justify-center py-12">
      <div class="w-full max-w-md text-center">
        <p class="font-mono text-[11px] text-dim">404</p>
        <h1 class="mt-2 text-[20px] font-semibold tracking-tight text-fg">Page not found</h1>
        <p class="mt-2 text-[13px] leading-relaxed text-muted">
          <code class="rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[11px] text-fg">
            {location.pathname}
          </code>{' '}
          is not part of this app.
        </p>

        <div class="mt-6 flex flex-wrap items-center justify-center gap-2">
          <A href="/">
            <Button variant="primary" size="sm">
              Back to markets
            </Button>
          </A>
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
            Go back
          </Button>
        </div>

        <p class="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-dim">
          <Kbd>⌘K</Kbd> jump to an asset
          <Icon name="chevronRight" size={10} />
        </p>
      </div>
    </div>
  );
}
