import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';
import { lazy, Suspense, For } from 'solid-js';
import { StoreProvider } from './store';
import { ListSkeleton, SidebarSkeleton, Skeleton } from './components/ui';
import './index.css';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const CoinDetail = lazy(() => import('./pages/CoinDetail'));
const NotFound = lazy(() => import('./pages/NotFound'));

const STAT_ITEMS = [0, 1, 2, 3];

function PageSkeleton(props: { type: 'dashboard' | 'detail' }) {
  return (
    <div class="min-h-screen bg-[#09090b]">
      <header class="sticky top-0 z-20 bg-[#09090b]/80 backdrop-blur-md border-b border-white/5">
        <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div class="flex items-center gap-2"><Skeleton class="w-7 h-7 rounded-lg" /><Skeleton class="w-24 h-5" /></div>
          <Skeleton class="hidden sm:block w-64 h-9 rounded-lg" />
          <div class="flex gap-2"><Skeleton class="w-8 h-8 rounded-lg" /><Skeleton class="w-20 h-8 rounded-lg" /></div>
        </div>
      </header>
      <main class="py-6">
        <div class={`mx-auto px-4 sm:px-6 lg:px-8 ${props.type === 'dashboard' ? 'max-w-[1600px]' : 'max-w-6xl'}`}>
          {props.type === 'dashboard' ? (
            <div class="space-y-6">
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <For each={STAT_ITEMS}>{() => <Skeleton class="h-20 rounded-xl" />}</For>
              </div>
              <div class="grid lg:grid-cols-[260px_1fr_300px] gap-6">
                <div class="hidden lg:block space-y-4"><SidebarSkeleton /><SidebarSkeleton /></div>
                <ListSkeleton rows={10} />
                <div class="hidden lg:block space-y-4"><Skeleton class="h-72 rounded-xl" /><SidebarSkeleton rows={3} /></div>
              </div>
            </div>
          ) : (
            <div class="grid lg:grid-cols-[1fr_340px] gap-6">
              <div class="space-y-6">
                <div class="flex items-center gap-4"><Skeleton class="w-14 h-14 rounded-full" /><div class="space-y-2"><Skeleton class="w-40 h-6" /><Skeleton class="w-32 h-8" /></div></div>
                <Skeleton class="h-64 rounded-xl" />
              </div>
              <Skeleton class="h-80 rounded-xl" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <StoreProvider>
      <Router>
        <Route path="/" component={() => <Suspense fallback={<PageSkeleton type="dashboard" />}><Dashboard /></Suspense>} />
        <Route path="/coin/:id" component={() => <Suspense fallback={<PageSkeleton type="detail" />}><CoinDetail /></Suspense>} />
        <Route path="*" component={() => <Suspense fallback={<PageSkeleton type="detail" />}><NotFound /></Suspense>} />
      </Router>
    </StoreProvider>
  );
}

render(() => <App />, document.getElementById('root')!);
