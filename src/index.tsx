import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';
import { lazy } from 'solid-js';
import { Root } from './app';
import './index.css';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const CoinDetail = lazy(() => import('./pages/CoinDetail'));
const Watchlist = lazy(() => import('./pages/Watchlist'));
const NotFound = lazy(() => import('./pages/NotFound'));

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

render(
  () => (
    <Router root={Root}>
      <Route path="/" component={Dashboard} />
      <Route path="/coin/:id" component={CoinDetail} />
      <Route path="/watchlist" component={Watchlist} />
      <Route path="*" component={NotFound} />
    </Router>
  ),
  root,
);
