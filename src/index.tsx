import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';
import { lazy, Suspense } from 'solid-js';
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { StoreProvider } from './store';
import './index.css';

inject();
injectSpeedInsights();

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
      <Suspense fallback={<PageSkeleton />}>
        <Router>
          <Route path="/" component={Dashboard} />
          <Route path="/coin/:id" component={CoinDetail} />
          <Route path="*" component={NotFound} />
        </Router>
      </Suspense>
    </StoreProvider>
  );
}

render(() => <App />, document.getElementById('root')!);
