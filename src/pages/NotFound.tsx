import { Component } from 'solid-js';
import { A } from '@solidjs/router';
import { Button } from '../components/ui';

const NotFound: Component = () => (
  <div class="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
    <div class="text-center max-w-md">
      <div class="text-8xl font-bold text-zinc-800 mb-4">404</div>
      <h1 class="text-2xl font-semibold text-white mb-2">Page Not Found</h1>
      <p class="text-zinc-500 mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div class="flex gap-3 justify-center">
        <A href="/"><Button variant="primary">Back to Dashboard</Button></A>
        <Button variant="ghost" onClick={() => window.history.back()}>Go Back</Button>
      </div>
    </div>
  </div>
);

export default NotFound;
