import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';
import { lazy, Suspense } from 'solid-js';
import { StoreProvider } from './store';
import './index.css';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const CoinDetail = lazy(() => import('./pages/CoinDetail'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageSkeleton() {
  return (
    <div class="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div class="w-8 h-8 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <StoreProvider>
      <Router>
        <Route path="/" component={() => <Suspense fallback={<PageSkeleton />}><Dashboard /></Suspense>} />
        <Route path="/coin/:id" component={() => <Suspense fallback={<PageSkeleton />}><CoinDetail /></Suspense>} />
        <Route path="*" component={() => <Suspense fallback={<PageSkeleton />}><NotFound /></Suspense>} />
      </Router>
    </StoreProvider>
  );
}

render(() => <App />, document.getElementById('root')!);
